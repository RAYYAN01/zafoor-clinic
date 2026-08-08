"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { toPlain } from "@/lib/serialize"
import { corporateAccountSchema, type CorporateAccountInput } from "@/lib/validations/billing"

export async function getCorporateAccounts() {
  const accounts = await prisma.corporateAccount.findMany({
    include: { _count: { select: { patients: true, bills: true } } },
    orderBy: { companyName: "asc" },
  })
  return toPlain(accounts)
}

export async function getCorporateAccount(id: string) {
  const account = await prisma.corporateAccount.findUnique({
    where: { id },
    include: { patients: { include: { patient: true } }, bills: { orderBy: { issuedAt: "desc" } } },
  })
  if (!account) return null
  return toPlain(account)
}

export async function createCorporateAccount(input: CorporateAccountInput) {
  const data = corporateAccountSchema.parse(input)
  const account = await prisma.corporateAccount.create({ data })
  revalidatePath("/finance/corporate-accounts")
  return toPlain(account)
}

export async function linkPatientToCorporate(corporateAccountId: string, patientId: string, employeeId?: string) {
  await prisma.corporatePatient.create({ data: { corporateAccountId, patientId, employeeId } })
  revalidatePath(`/finance/corporate-accounts/${corporateAccountId}`)
}

export async function unlinkPatientFromCorporate(id: string, corporateAccountId: string) {
  await prisma.corporatePatient.delete({ where: { id } })
  revalidatePath(`/finance/corporate-accounts/${corporateAccountId}`)
}

export async function getPatientCorporateLinks(patientId: string) {
  const links = await prisma.corporatePatient.findMany({
    where: { patientId },
    include: { corporateAccount: true },
  })
  return toPlain(links)
}
