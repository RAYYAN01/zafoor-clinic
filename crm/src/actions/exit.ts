"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { toPlain } from "@/lib/serialize"
import { exitRequestSchema, exitUpdateSchema, type ExitRequestInput, type ExitUpdateInput } from "@/lib/validations/hr"

export async function getExitRequests() {
  const requests = await prisma.exitRequest.findMany({
    include: { employee: { include: { user: true, department: true } }, approvedBy: true },
    orderBy: { createdAt: "desc" },
  })
  return toPlain(requests)
}

export async function initiateExit(input: ExitRequestInput) {
  const data = exitRequestSchema.parse(input)
  const request = await prisma.exitRequest.create({
    data: {
      employeeId: data.employeeId,
      resignationDate: new Date(data.resignationDate),
      lastWorkingDate: new Date(data.lastWorkingDate),
      reason: data.reason || null,
    },
  })
  await prisma.employee.update({ where: { id: data.employeeId }, data: { status: "ON_LEAVE" } })
  revalidatePath("/hr/exit")
  return toPlain(request)
}

export async function updateExitRequest(id: string, input: ExitUpdateInput) {
  const data = exitUpdateSchema.parse(input)
  const user = await getCurrentUser()

  const request = await prisma.$transaction(async (tx) => {
    const updated = await tx.exitRequest.update({
      where: { id },
      data: { ...data, approvedById: data.status === "APPROVED" || data.status === "COMPLETED" ? user.id : undefined },
    })
    if (data.status === "COMPLETED") {
      await tx.employee.update({ where: { id: updated.employeeId }, data: { status: "EXITED" } })
    } else if (data.status === "WITHDRAWN") {
      await tx.employee.update({ where: { id: updated.employeeId }, data: { status: "ACTIVE" } })
    }
    return updated
  })

  revalidatePath("/hr/exit")
  return toPlain(request)
}
