"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { toPlain } from "@/lib/serialize"
import { insuranceClaimUpdateSchema, type InsuranceClaimUpdateInput } from "@/lib/validations/billing"

export async function getInsuranceClaims(status?: string) {
  const claims = await prisma.insuranceClaim.findMany({
    where: status ? { status: status as never } : undefined,
    include: { patient: true, insurance: true, bill: true },
    orderBy: { createdAt: "desc" },
  })
  return toPlain(claims)
}

export async function getInsuranceClaim(id: string) {
  const claim = await prisma.insuranceClaim.findUnique({
    where: { id },
    include: { patient: true, insurance: true, bill: { include: { items: true } } },
  })
  if (!claim) return null
  return toPlain(claim)
}

export async function updateInsuranceClaim(id: string, input: InsuranceClaimUpdateInput) {
  const data = insuranceClaimUpdateSchema.parse(input)
  const claim = await prisma.insuranceClaim.update({
    where: { id },
    data: {
      status: data.status,
      approvedAmount: data.approvedAmount,
      rejectionReason: data.rejectionReason || null,
      notes: data.notes || null,
      submittedAt: data.status === "SUBMITTED" ? new Date() : undefined,
      settledAt: data.status === "SETTLED" ? new Date() : undefined,
    },
  })
  revalidatePath("/billing/claims")
  revalidatePath(`/billing/${claim.billId}`)
  return toPlain(claim)
}
