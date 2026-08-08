"use server"

import { revalidatePath } from "next/cache"
import { startOfWeek, endOfWeek } from "date-fns"
import { prisma } from "@/lib/prisma"
import { toPlain } from "@/lib/serialize"
import { shiftSchema, shiftAssignmentSchema, type ShiftInput, type ShiftAssignmentInput } from "@/lib/validations/hr"

export async function getShifts() {
  const shifts = await prisma.shift.findMany({ orderBy: { startTime: "asc" } })
  return toPlain(shifts)
}

export async function createShift(input: ShiftInput) {
  const data = shiftSchema.parse(input)
  const shift = await prisma.shift.create({ data })
  revalidatePath("/hr/shifts")
  return toPlain(shift)
}

export async function getShiftAssignments(weekOf: Date) {
  const from = startOfWeek(weekOf, { weekStartsOn: 1 })
  const to = endOfWeek(weekOf, { weekStartsOn: 1 })
  const assignments = await prisma.shiftAssignment.findMany({
    where: { date: { gte: from, lte: to } },
    include: { employee: { include: { user: true } }, shift: true },
    orderBy: { date: "asc" },
  })
  return toPlain(assignments)
}

export async function assignShift(input: ShiftAssignmentInput) {
  const data = shiftAssignmentSchema.parse(input)
  const assignment = await prisma.shiftAssignment.upsert({
    where: { employeeId_date: { employeeId: data.employeeId, date: new Date(data.date) } },
    create: { employeeId: data.employeeId, shiftId: data.shiftId, date: new Date(data.date) },
    update: { shiftId: data.shiftId },
  })
  revalidatePath("/hr/shifts")
  return toPlain(assignment)
}

export async function removeShiftAssignment(id: string) {
  await prisma.shiftAssignment.delete({ where: { id } })
  revalidatePath("/hr/shifts")
}
