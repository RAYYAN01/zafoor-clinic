"use server"

import { startOfDay, endOfDay } from "date-fns"
import { prisma } from "@/lib/prisma"

export async function getDashboardStats() {
  const now = new Date()
  const dayStart = startOfDay(now)
  const dayEnd = endOfDay(now)

  const [
    newPatientsToday,
    todayAppointments,
    waitingQueueCount,
    inProgressCount,
    noShowToday,
    overdueScheduled,
    followUpsDue,
    totalActivePatients,
  ] = await Promise.all([
    prisma.patient.count({ where: { createdAt: { gte: dayStart, lte: dayEnd } } }),
    prisma.appointment.findMany({
      where: {
        scheduledAt: { gte: dayStart, lte: dayEnd },
        status: { notIn: ["CANCELLED", "RESCHEDULED"] },
      },
      include: { patient: true, doctor: true },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.appointment.count({
      where: { checkedInAt: { gte: dayStart, lte: dayEnd }, status: "ARRIVED" },
    }),
    prisma.appointment.count({
      where: { status: "IN_CONSULTATION" },
    }),
    prisma.appointment.count({
      where: { scheduledAt: { gte: dayStart, lte: dayEnd }, status: "NO_SHOW" },
    }),
    prisma.appointment.count({
      where: {
        scheduledAt: { gte: dayStart, lt: now },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    }),
    prisma.followUp.findMany({
      where: { status: "PENDING", dueDate: { lte: dayEnd } },
      include: { patient: true, assignedTo: true },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
    prisma.patient.count({ where: { status: "ACTIVE" } }),
  ])

  const todayPatientIds = [...new Set(todayAppointments.map((a) => a.patientId))]
  const priorVisits = todayPatientIds.length
    ? await prisma.appointment.findMany({
        where: {
          patientId: { in: todayPatientIds },
          status: "COMPLETED",
          scheduledAt: { lt: dayStart },
        },
        select: { patientId: true },
        distinct: ["patientId"],
      })
    : []
  const returningPatientIds = new Set(priorVisits.map((v) => v.patientId))

  return {
    newPatientsToday,
    returningPatientsToday: returningPatientIds.size,
    todayAppointmentsCount: todayAppointments.length,
    todayAppointments,
    waitingQueueCount,
    inProgressCount,
    missedAppointmentsCount: noShowToday + overdueScheduled,
    followUpsDue,
    followUpsDueCount: followUpsDue.length,
    totalActivePatients,
  }
}

export async function getRecentPatients(limit = 8) {
  return prisma.patient.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { tags: { include: { tag: true } } },
  })
}
