"use server"

import { revalidatePath } from "next/cache"
import { addMinutes, isBefore, isToday, parse, startOfDay, endOfDay } from "date-fns"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { generateAppointmentCode } from "@/lib/sequence"
import { serializeDecimal } from "@/lib/serialize"
import {
  bookAppointmentSchema,
  walkInSchema,
  availabilitySchema,
  waitingListSchema,
  type BookAppointmentInput,
  type WalkInInput,
  type AvailabilityInput,
  type WaitingListInput,
} from "@/lib/validations/appointment"

const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "ARRIVED", "IN_CONSULTATION"] as const

// ── Slot computation ───────────────────────────────────────────────────

export async function getAvailableSlots(doctorId: string, date: Date) {
  const dayOfWeek = date.getDay()
  const dayStart = startOfDay(date)
  const dayEnd = endOfDay(date)

  const [availabilities, leave, existingAppointments] = await Promise.all([
    prisma.doctorAvailability.findMany({
      where: { doctorId, dayOfWeek, isActive: true },
      orderBy: { startTime: "asc" },
    }),
    prisma.doctorLeave.findFirst({
      where: { doctorId, date: { gte: dayStart, lte: dayEnd } },
    }),
    prisma.appointment.findMany({
      where: {
        doctorId,
        scheduledAt: { gte: dayStart, lte: dayEnd },
        status: { in: [...ACTIVE_STATUSES] },
      },
      select: { scheduledAt: true },
    }),
  ])

  if (leave) return { onLeave: true, reason: leave.reason, slots: [] as Date[] }

  const bookedTimes = new Set(existingAppointments.map((a) => a.scheduledAt.getTime()))
  const now = new Date()
  const slots: Date[] = []

  for (const availability of availabilities) {
    const start = parse(availability.startTime, "HH:mm", date)
    const end = parse(availability.endTime, "HH:mm", date)
    let cursor = start
    while (isBefore(cursor, end)) {
      if (!bookedTimes.has(cursor.getTime()) && (!isToday(date) || isBefore(now, cursor))) {
        slots.push(new Date(cursor))
      }
      cursor = addMinutes(cursor, availability.slotDurationMinutes)
    }
  }

  return { onLeave: false, reason: null, slots }
}

// ── Booking / lifecycle ────────────────────────────────────────────────

export async function bookAppointment(input: BookAppointmentInput) {
  const data = bookAppointmentSchema.parse(input)

  const conflict = await prisma.appointment.findFirst({
    where: {
      doctorId: data.doctorId,
      scheduledAt: data.scheduledAt,
      status: { in: [...ACTIVE_STATUSES] },
    },
  })
  if (conflict) throw new Error("This slot was just booked. Please choose another slot.")

  const user = await getCurrentUser().catch(() => null)

  const appointment = await prisma.$transaction(async (tx) => {
    const appointmentCode = await generateAppointmentCode(tx)
    return tx.appointment.create({
      data: {
        appointmentCode,
        patientId: data.patientId,
        doctorId: data.doctorId,
        serviceId: data.serviceId || null,
        scheduledAt: data.scheduledAt,
        durationMinutes: data.durationMinutes,
        type: data.type,
        reason: data.reason || null,
        createdById: user?.id ?? null,
        source: user ? "CRM" : "WEBSITE",
      },
    })
  })

  revalidatePath("/appointments")
  revalidatePath(`/patients/${data.patientId}`)
  revalidatePath("/dashboard")
  return appointment
}

export async function createWalkIn(input: WalkInInput) {
  const data = walkInSchema.parse(input)
  const user = await getCurrentUser()
  const now = new Date()

  const appointment = await prisma.$transaction(async (tx) => {
    const appointmentCode = await generateAppointmentCode(tx)
    return tx.appointment.create({
      data: {
        appointmentCode,
        patientId: data.patientId,
        doctorId: data.doctorId,
        scheduledAt: now,
        type: "WALK_IN",
        status: "ARRIVED",
        reason: data.reason || null,
        checkedInAt: now,
        createdById: user.id,
        source: "CRM",
      },
    })
  })

  revalidatePath("/appointments")
  revalidatePath("/queue")
  revalidatePath(`/patients/${data.patientId}`)
  revalidatePath("/dashboard")
  return appointment
}

export async function cancelAppointment(id: string, reason: string) {
  const appointment = await prisma.appointment.update({
    where: { id },
    data: { status: "CANCELLED", cancelReason: reason, cancelledAt: new Date() },
  })
  revalidatePath("/appointments")
  revalidatePath("/queue")
  revalidatePath(`/patients/${appointment.patientId}`)
  revalidatePath("/dashboard")
  return appointment
}

export async function rescheduleAppointment(id: string, newScheduledAt: Date) {
  const original = await prisma.appointment.findUniqueOrThrow({ where: { id } })

  const conflict = await prisma.appointment.findFirst({
    where: {
      doctorId: original.doctorId,
      scheduledAt: newScheduledAt,
      status: { in: [...ACTIVE_STATUSES] },
    },
  })
  if (conflict) throw new Error("This slot is already booked. Please choose another slot.")

  const [, next] = await prisma.$transaction(async (tx) => {
    const updated = await tx.appointment.update({
      where: { id },
      data: { status: "RESCHEDULED" },
    })
    const appointmentCode = await generateAppointmentCode(tx)
    const created = await tx.appointment.create({
      data: {
        appointmentCode,
        patientId: original.patientId,
        doctorId: original.doctorId,
        serviceId: original.serviceId,
        scheduledAt: newScheduledAt,
        durationMinutes: original.durationMinutes,
        type: original.type,
        reason: original.reason,
        rescheduledFromId: id,
        createdById: original.createdById,
        source: original.source,
      },
    })
    return [updated, created]
  })

  revalidatePath("/appointments")
  revalidatePath(`/patients/${original.patientId}`)
  revalidatePath("/dashboard")
  return next
}

export async function confirmAppointment(id: string) {
  const appointment = await prisma.appointment.update({
    where: { id },
    data: { status: "CONFIRMED" },
  })
  revalidatePath("/appointments")
  revalidatePath("/dashboard")
  return appointment
}

export async function checkInAppointment(id: string) {
  const now = new Date()
  const appointment = await prisma.appointment.update({
    where: { id },
    data: { status: "ARRIVED", checkedInAt: now },
  })
  revalidatePath("/queue")
  revalidatePath("/appointments")
  revalidatePath("/dashboard")
  return appointment
}

export async function markNoShow(id: string) {
  const appointment = await prisma.appointment.update({
    where: { id },
    data: { status: "NO_SHOW" },
  })
  revalidatePath("/appointments")
  revalidatePath("/queue")
  revalidatePath("/dashboard")
  return appointment
}

export async function startConsultation(id: string) {
  const appointment = await prisma.appointment.update({
    where: { id },
    data: { status: "IN_CONSULTATION", startedAt: new Date() },
  })
  revalidatePath("/queue")
  revalidatePath("/appointments")
  return appointment
}

export async function completeConsultation(id: string) {
  const appointment = await prisma.appointment.update({
    where: { id },
    data: { status: "COMPLETED", completedAt: new Date() },
  })
  revalidatePath("/queue")
  revalidatePath("/appointments")
  revalidatePath("/dashboard")
  return appointment
}

// ── Queries ─────────────────────────────────────────────────────────────

export async function getAppointments(params: {
  doctorId?: string
  status?: string
  from?: Date
  to?: Date
  patientId?: string
  page?: number
  pageSize?: number
}) {
  const { doctorId, status, from, to, patientId, page = 1, pageSize = 20 } = params
  const where: Record<string, unknown> = {}
  if (doctorId) where.doctorId = doctorId
  if (status) where.status = status
  if (patientId) where.patientId = patientId
  if (from || to) {
    where.scheduledAt = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    }
  }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: { patient: true, doctor: true, service: true },
      orderBy: { scheduledAt: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.appointment.count({ where }),
  ])

  return {
    appointments: appointments.map((a) => ({ ...a, doctor: serializeDecimal(a.doctor, ["consultationFee"]) })),
    total,
    page,
    pageSize,
  }
}

export async function getTodayQueue(doctorId?: string) {
  const dayStart = startOfDay(new Date())
  const dayEnd = endOfDay(new Date())
  const queue = await prisma.appointment.findMany({
    where: {
      doctorId,
      checkedInAt: { gte: dayStart, lte: dayEnd },
      status: { in: ["ARRIVED", "IN_CONSULTATION"] },
    },
    include: { patient: true, doctor: true, service: true },
    orderBy: [{ checkedInAt: "asc" }],
  })
  return queue.map((a) => ({ ...a, doctor: serializeDecimal(a.doctor, ["consultationFee"]) }))
}

export async function getTodayAppointments(doctorId?: string) {
  const dayStart = startOfDay(new Date())
  const dayEnd = endOfDay(new Date())
  return prisma.appointment.findMany({
    where: {
      doctorId,
      scheduledAt: { gte: dayStart, lte: dayEnd },
      status: { notIn: ["CANCELLED", "RESCHEDULED"] },
    },
    include: { patient: true, doctor: true, service: true },
    orderBy: { scheduledAt: "asc" },
  })
}

// ── Doctor availability ────────────────────────────────────────────────

export async function getAllDoctorsWithAvailability() {
  const doctors = await prisma.user.findMany({
    where: { role: "DOCTOR" },
    include: { doctorAvailabilities: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] }, doctorLeaves: { orderBy: { date: "asc" } } },
    orderBy: { name: "asc" },
  })
  return doctors.map((d) => serializeDecimal(d, ["consultationFee"]))
}

export async function addAvailability(doctorId: string, input: AvailabilityInput) {
  const data = availabilitySchema.parse(input)
  await prisma.doctorAvailability.create({ data: { ...data, doctorId } })
  revalidatePath("/appointments/availability")
}

export async function deleteAvailability(id: string) {
  await prisma.doctorAvailability.delete({ where: { id } })
  revalidatePath("/appointments/availability")
}

export async function addDoctorLeave(doctorId: string, date: Date, reason?: string) {
  await prisma.doctorLeave.create({ data: { doctorId, date, reason } })
  revalidatePath("/appointments/availability")
}

export async function deleteDoctorLeave(id: string) {
  await prisma.doctorLeave.delete({ where: { id } })
  revalidatePath("/appointments/availability")
}

// ── Waiting list ────────────────────────────────────────────────────────

export async function addToWaitingList(input: WaitingListInput) {
  const data = waitingListSchema.parse(input)
  const entry = await prisma.waitingListEntry.create({ data })
  revalidatePath("/waiting-list")
  return entry
}

export async function updateWaitingListStatus(id: string, status: "WAITING" | "NOTIFIED" | "CONVERTED" | "EXPIRED") {
  await prisma.waitingListEntry.update({ where: { id }, data: { status } })
  revalidatePath("/waiting-list")
}

export async function deleteWaitingListEntry(id: string) {
  await prisma.waitingListEntry.delete({ where: { id } })
  revalidatePath("/waiting-list")
}

export async function getWaitingList(status?: string) {
  const entries = await prisma.waitingListEntry.findMany({
    where: status ? { status: status as never } : undefined,
    include: { patient: true, doctor: true },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
  })
  return entries.map((e) => ({ ...e, doctor: e.doctor ? serializeDecimal(e.doctor, ["consultationFee"]) : null }))
}
