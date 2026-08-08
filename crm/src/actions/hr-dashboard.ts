"use server"

import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns"
import { prisma } from "@/lib/prisma"
import { toPlain } from "@/lib/serialize"

export async function getHrDashboard() {
  const today = new Date()
  const [
    totalEmployees,
    activeEmployees,
    onLeaveToday,
    pendingLeaveRequests,
    openJobOpenings,
    openTasks,
    upcomingMeetings,
    todayAttendance,
    pendingOnboarding,
    pendingExits,
  ] = await Promise.all([
    prisma.employee.count(),
    prisma.employee.count({ where: { status: "ACTIVE" } }),
    prisma.leaveRequest.count({
      where: { status: "APPROVED", fromDate: { lte: endOfDay(today) }, toDate: { gte: startOfDay(today) } },
    }),
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
    prisma.jobOpening.count({ where: { status: "OPEN" } }),
    prisma.task.count({ where: { status: { in: ["TODO", "IN_PROGRESS"] } } }),
    prisma.meeting.count({ where: { status: "SCHEDULED", startTime: { gte: today } } }),
    prisma.attendanceRecord.count({ where: { date: startOfDay(today), status: "PRESENT" } }),
    prisma.onboardingTask.count({ where: { status: "PENDING" } }),
    prisma.exitRequest.count({ where: { status: "PENDING" } }),
  ])

  const departmentBreakdown = await prisma.department.findMany({
    include: { _count: { select: { employees: true } } },
    orderBy: { name: "asc" },
  })

  return toPlain({
    totalEmployees,
    activeEmployees,
    onLeaveToday,
    pendingLeaveRequests,
    openJobOpenings,
    openTasks,
    upcomingMeetings,
    todayAttendance,
    pendingOnboarding,
    pendingExits,
    departmentBreakdown: departmentBreakdown.map((d) => ({ name: d.name, count: d._count.employees })),
  })
}

/** Aggregated read-only calendar: leaves, shift assignments, meetings, and training for the given month. */
export async function getHrCalendar(monthDate: Date) {
  const from = startOfMonth(monthDate)
  const to = endOfMonth(monthDate)

  const [leaves, meetings, trainings, shiftAssignments] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: { status: "APPROVED", fromDate: { lte: to }, toDate: { gte: from } },
      include: { employee: { include: { user: true } }, leaveType: true },
    }),
    prisma.meeting.findMany({
      where: { startTime: { gte: from, lte: to }, status: { not: "CANCELLED" } },
      include: { organizer: true },
    }),
    prisma.trainingProgram.findMany({
      where: { scheduledAt: { gte: from, lte: to }, status: { not: "CANCELLED" } },
    }),
    prisma.shiftAssignment.findMany({
      where: { date: { gte: from, lte: to } },
      include: { employee: { include: { user: true } }, shift: true },
    }),
  ])

  const events: { date: Date; type: string; label: string }[] = []
  for (const l of leaves) events.push({ date: l.fromDate, type: "leave", label: `${l.employee.user.name} — ${l.leaveType.name}` })
  for (const m of meetings) events.push({ date: m.startTime, type: "meeting", label: m.title })
  for (const t of trainings) events.push({ date: t.scheduledAt, type: "training", label: t.title })
  for (const s of shiftAssignments) events.push({ date: s.date, type: "shift", label: `${s.employee.user.name} — ${s.shift.name}` })

  events.sort((a, b) => a.date.getTime() - b.date.getTime())
  return toPlain(events)
}
