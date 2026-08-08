"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { toPlain } from "@/lib/serialize"
import {
  otSchema,
  otStatusSchema,
  surgerySchema,
  surgeryStatusSchema,
  type OtInput,
  type OtStatusInput,
  type SurgeryInput,
  type SurgeryStatusInput,
} from "@/lib/validations/operations"

// ── Theatres ────────────────────────────────────────────────────────────

export async function getTheatres() {
  const theatres = await prisma.operationTheatre.findMany({
    include: {
      surgeries: {
        where: { status: { in: ["SCHEDULED", "IN_PROGRESS"] } },
        include: { patient: true, surgeon: true },
        orderBy: { scheduledStart: "asc" },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  })
  return toPlain(theatres)
}

export async function createTheatre(input: OtInput) {
  const data = otSchema.parse(input)
  const ot = await prisma.operationTheatre.create({ data })
  revalidatePath("/operations/ot")
  return toPlain(ot)
}

export async function updateTheatreStatus(id: string, input: OtStatusInput) {
  const data = otStatusSchema.parse(input)
  const ot = await prisma.operationTheatre.update({ where: { id }, data })
  revalidatePath("/operations/ot")
  return toPlain(ot)
}

export async function deleteTheatre(id: string) {
  await prisma.operationTheatre.delete({ where: { id } })
  revalidatePath("/operations/ot")
}

// ── Surgery scheduling ─────────────────────────────────────────────────

export async function getSurgeries(params?: { from?: Date; to?: Date; status?: string }) {
  const where: Record<string, unknown> = {}
  if (params?.status) where.status = params.status
  if (params?.from || params?.to) {
    where.scheduledStart = {
      ...(params?.from ? { gte: params.from } : {}),
      ...(params?.to ? { lte: params.to } : {}),
    }
  }
  const surgeries = await prisma.surgery.findMany({
    where,
    include: { ot: true, patient: true, surgeon: true, admission: true },
    orderBy: { scheduledStart: "asc" },
  })
  return toPlain(surgeries)
}

export async function scheduleSurgery(input: SurgeryInput) {
  const data = surgerySchema.parse(input)
  const start = new Date(data.scheduledStart)
  const end = new Date(data.scheduledEnd)
  if (end <= start) throw new Error("End time must be after start time")

  const overlap = await prisma.surgery.findFirst({
    where: {
      otId: data.otId,
      status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      scheduledStart: { lt: end },
      scheduledEnd: { gt: start },
    },
  })
  if (overlap) throw new Error("This theatre is already booked in that time window")

  const surgery = await prisma.surgery.create({
    data: {
      otId: data.otId,
      patientId: data.patientId,
      admissionId: data.admissionId || null,
      surgeonId: data.surgeonId,
      procedureName: data.procedureName,
      anesthesiaType: data.anesthesiaType || null,
      scheduledStart: start,
      scheduledEnd: end,
      notes: data.notes || null,
    },
  })
  revalidatePath("/operations/ot")
  return toPlain(surgery)
}

export async function updateSurgeryStatus(id: string, input: SurgeryStatusInput) {
  const data = surgeryStatusSchema.parse(input)
  const surgery = await prisma.$transaction(async (tx) => {
    const updated = await tx.surgery.update({
      where: { id },
      data: {
        status: data.status,
        actualStart: data.status === "IN_PROGRESS" ? new Date() : undefined,
        actualEnd: data.status === "COMPLETED" ? new Date() : undefined,
      },
    })
    if (data.status === "IN_PROGRESS") {
      await tx.operationTheatre.update({ where: { id: updated.otId }, data: { status: "IN_USE" } })
    } else if (data.status === "COMPLETED" || data.status === "CANCELLED") {
      await tx.operationTheatre.update({ where: { id: updated.otId }, data: { status: "CLEANING" } })
    }
    return updated
  })
  revalidatePath("/operations/ot")
  return toPlain(surgery)
}
