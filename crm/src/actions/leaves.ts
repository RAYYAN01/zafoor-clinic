"use server"

import { revalidatePath } from "next/cache"
import { differenceInCalendarDays } from "date-fns"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { toPlain } from "@/lib/serialize"
import {
  leaveTypeSchema,
  leaveRequestSchema,
  leaveDecisionSchema,
  type LeaveTypeInput,
  type LeaveRequestInput,
  type LeaveDecisionInput,
} from "@/lib/validations/hr"

// ── Leave Types ─────────────────────────────────────────────────────────

export async function getLeaveTypes() {
  const types = await prisma.leaveType.findMany({ orderBy: { name: "asc" } })
  return toPlain(types)
}

export async function createLeaveType(input: LeaveTypeInput) {
  const data = leaveTypeSchema.parse(input)
  const type = await prisma.leaveType.create({ data })
  revalidatePath("/hr/leaves")
  return toPlain(type)
}

// ── Leave Balances ──────────────────────────────────────────────────────

export async function getLeaveBalances(employeeId: string, year = new Date().getFullYear()) {
  const balances = await prisma.leaveBalance.findMany({
    where: { employeeId, year },
    include: { leaveType: true },
  })
  return toPlain(balances)
}

export async function allocateLeaveBalance(employeeId: string, leaveTypeId: string, year: number, allocated: number) {
  const balance = await prisma.leaveBalance.upsert({
    where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId, year } },
    create: { employeeId, leaveTypeId, year, allocated },
    update: { allocated },
  })
  revalidatePath("/hr/leaves")
  return toPlain(balance)
}

// ── Leave Requests ──────────────────────────────────────────────────────

export async function getLeaveRequests(status?: string) {
  const requests = await prisma.leaveRequest.findMany({
    where: status ? { status: status as never } : undefined,
    include: { employee: { include: { user: true, department: true } }, leaveType: true, approvedBy: true },
    orderBy: { createdAt: "desc" },
  })
  return toPlain(requests)
}

export async function requestLeave(input: LeaveRequestInput) {
  const data = leaveRequestSchema.parse(input)
  const fromDate = new Date(data.fromDate)
  const toDate = new Date(data.toDate)
  if (toDate < fromDate) throw new Error("To date must be on or after the from date")
  const days = differenceInCalendarDays(toDate, fromDate) + 1

  const request = await prisma.leaveRequest.create({
    data: {
      employeeId: data.employeeId,
      leaveTypeId: data.leaveTypeId,
      fromDate,
      toDate,
      days,
      reason: data.reason || null,
    },
  })
  revalidatePath("/hr/leaves")
  return toPlain(request)
}

export async function decideLeaveRequest(id: string, input: LeaveDecisionInput) {
  const data = leaveDecisionSchema.parse(input)
  const user = await getCurrentUser()

  await prisma.$transaction(async (tx) => {
    const request = await tx.leaveRequest.findUniqueOrThrow({ where: { id } })

    if (data.status === "APPROVED" && request.status !== "APPROVED") {
      const year = request.fromDate.getFullYear()
      await tx.leaveBalance.upsert({
        where: { employeeId_leaveTypeId_year: { employeeId: request.employeeId, leaveTypeId: request.leaveTypeId, year } },
        create: { employeeId: request.employeeId, leaveTypeId: request.leaveTypeId, year, allocated: 0, used: request.days },
        update: { used: { increment: request.days } },
      })
    }

    await tx.leaveRequest.update({
      where: { id },
      data: { status: data.status, approvedById: user.id, approvedAt: new Date() },
    })
  })

  revalidatePath("/hr/leaves")
}
