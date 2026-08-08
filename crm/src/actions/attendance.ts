"use server"

import { revalidatePath } from "next/cache"
import { startOfDay, endOfDay } from "date-fns"
import { prisma } from "@/lib/prisma"
import { toPlain } from "@/lib/serialize"
import {
  attendanceMarkSchema,
  biometricLogSchema,
  type AttendanceMarkInput,
  type BiometricLogInput,
} from "@/lib/validations/hr"

// ── Attendance ──────────────────────────────────────────────────────────

export async function getAttendanceForDate(date: Date) {
  const day = startOfDay(date)
  const records = await prisma.attendanceRecord.findMany({
    where: { date: day },
    include: { employee: { include: { user: true, department: true } } },
  })

  const employees = await prisma.employee.findMany({
    where: { status: { in: ["ACTIVE", "ON_LEAVE"] } },
    include: { user: true, department: true },
    orderBy: { user: { name: "asc" } },
  })

  const recordByEmployee = new Map(records.map((r) => [r.employeeId, r]))
  const rows = employees.map((e) => ({ employee: e, record: recordByEmployee.get(e.id) ?? null }))

  return toPlain(rows)
}

export async function markAttendance(input: AttendanceMarkInput) {
  const data = attendanceMarkSchema.parse(input)
  const day = startOfDay(new Date(data.date))

  let workHours: number | undefined
  if (data.checkIn && data.checkOut) {
    const inTime = new Date(data.checkIn)
    const outTime = new Date(data.checkOut)
    workHours = Math.max(0, (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60))
  }

  const record = await prisma.attendanceRecord.upsert({
    where: { employeeId_date: { employeeId: data.employeeId, date: day } },
    create: {
      employeeId: data.employeeId,
      date: day,
      checkIn: data.checkIn ? new Date(data.checkIn) : null,
      checkOut: data.checkOut ? new Date(data.checkOut) : null,
      status: data.status,
      source: "MANUAL",
      workHours,
      notes: data.notes || null,
    },
    update: {
      checkIn: data.checkIn ? new Date(data.checkIn) : null,
      checkOut: data.checkOut ? new Date(data.checkOut) : null,
      status: data.status,
      workHours,
      notes: data.notes || null,
    },
  })

  revalidatePath("/hr/attendance")
  return toPlain(record)
}

export async function getAttendanceSummary(from: Date, to: Date) {
  const records = await prisma.attendanceRecord.findMany({
    where: { date: { gte: startOfDay(from), lte: endOfDay(to) } },
  })
  const present = records.filter((r) => r.status === "PRESENT").length
  const absent = records.filter((r) => r.status === "ABSENT").length
  const late = records.filter((r) => r.status === "LATE").length
  const onLeave = records.filter((r) => r.status === "ON_LEAVE").length
  return { total: records.length, present, absent, late, onLeave }
}

// ── Biometric ───────────────────────────────────────────────────────────

export async function getBiometricDevices() {
  const devices = await prisma.biometricDevice.findMany({ orderBy: { name: "asc" } })
  return toPlain(devices)
}

export async function createBiometricDevice(name: string, location?: string) {
  const device = await prisma.biometricDevice.create({ data: { name, location: location || null } })
  revalidatePath("/hr/attendance")
  return toPlain(device)
}

export async function getBiometricLogs(date: Date) {
  const day = startOfDay(date)
  const logs = await prisma.biometricLog.findMany({
    where: { punchTime: { gte: day, lte: endOfDay(date) } },
    include: { employee: { include: { user: true } }, device: true },
    orderBy: { punchTime: "desc" },
  })
  return toPlain(logs)
}

export async function recordBiometricPunch(input: BiometricLogInput) {
  const data = biometricLogSchema.parse(input)
  const log = await prisma.biometricLog.create({
    data: { ...data, punchTime: new Date(data.punchTime) },
  })
  revalidatePath("/hr/attendance")
  return toPlain(log)
}

/** Reconciles a day's raw punches (earliest IN / latest OUT) into an AttendanceRecord. */
export async function syncBiometricToAttendance(date: Date) {
  const day = startOfDay(date)
  const logs = await prisma.biometricLog.findMany({
    where: { punchTime: { gte: day, lte: endOfDay(date) } },
    orderBy: { punchTime: "asc" },
  })

  const byEmployee = new Map<string, { in?: Date; out?: Date }>()
  for (const log of logs) {
    const entry = byEmployee.get(log.employeeId) ?? {}
    if (log.punchType === "IN" && !entry.in) entry.in = log.punchTime
    if (log.punchType === "OUT") entry.out = log.punchTime
    byEmployee.set(log.employeeId, entry)
  }

  let synced = 0
  for (const [employeeId, times] of byEmployee) {
    if (!times.in) continue
    const workHours = times.out ? Math.max(0, (times.out.getTime() - times.in.getTime()) / (1000 * 60 * 60)) : undefined
    await prisma.attendanceRecord.upsert({
      where: { employeeId_date: { employeeId, date: day } },
      create: {
        employeeId,
        date: day,
        checkIn: times.in,
        checkOut: times.out ?? null,
        status: "PRESENT",
        source: "BIOMETRIC",
        workHours,
      },
      update: {
        checkIn: times.in,
        checkOut: times.out ?? null,
        status: "PRESENT",
        source: "BIOMETRIC",
        workHours,
      },
    })
    synced++
  }

  revalidatePath("/hr/attendance")
  return { synced }
}
