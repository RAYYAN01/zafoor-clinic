"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { toPlain } from "@/lib/serialize"
import { icuRoundSchema, type IcuRoundInput } from "@/lib/validations/operations"

export async function getIcuBoard() {
  const admissions = await prisma.admission.findMany({
    where: { status: "ADMITTED", bed: { type: "ICU" } },
    include: {
      patient: true,
      doctor: true,
      bed: { include: { ward: true } },
      icuRounds: { orderBy: { recordedAt: "desc" }, take: 1 },
    },
    orderBy: { admittedAt: "asc" },
  })
  return toPlain(admissions)
}

export async function getIcuRounds(admissionId: string) {
  const rounds = await prisma.icuRound.findMany({
    where: { admissionId },
    include: { recordedBy: true },
    orderBy: { recordedAt: "desc" },
  })
  return toPlain(rounds)
}

export async function recordIcuRound(admissionId: string, input: IcuRoundInput) {
  const data = icuRoundSchema.parse(input)
  const user = await getCurrentUser()
  const round = await prisma.icuRound.create({
    data: { ...data, admissionId, recordedById: user.id },
  })
  revalidatePath("/operations/icu")
  return toPlain(round)
}
