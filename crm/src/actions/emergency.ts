"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { toPlain } from "@/lib/serialize"
import { generateCaseNumber } from "@/lib/sequence"
import {
  emergencyCaseSchema,
  emergencyUpdateSchema,
  type EmergencyCaseInput,
  type EmergencyUpdateInput,
} from "@/lib/validations/operations"

export async function getEmergencyCases(status?: string) {
  const cases = await prisma.emergencyCase.findMany({
    where: status ? { status: status as never } : { status: { notIn: ["DISCHARGED", "REFERRED_OUT", "LEFT_WITHOUT_TREATMENT"] } },
    include: { patient: true, attendingDoctor: true, bed: { include: { ward: true } } },
    orderBy: [{ triageLevel: "asc" }, { arrivedAt: "asc" }],
  })
  return toPlain(cases)
}

export async function getAllEmergencyCases() {
  const cases = await prisma.emergencyCase.findMany({
    include: { patient: true, attendingDoctor: true, bed: { include: { ward: true } } },
    orderBy: { arrivedAt: "desc" },
    take: 100,
  })
  return toPlain(cases)
}

export async function createEmergencyCase(input: EmergencyCaseInput) {
  const data = emergencyCaseSchema.parse(input)
  if (!data.patientId && !data.walkInName) {
    throw new Error("Select a registered patient or enter a walk-in name")
  }

  const emergencyCase = await prisma.$transaction(async (tx) => {
    const caseNumber = await generateCaseNumber(tx)
    return tx.emergencyCase.create({
      data: {
        caseNumber,
        patientId: data.patientId || null,
        walkInName: data.walkInName || null,
        walkInPhone: data.walkInPhone || null,
        triageLevel: data.triageLevel,
        chiefComplaint: data.chiefComplaint,
        arrivalMode: data.arrivalMode,
        broughtBy: data.broughtBy || null,
        attendingDoctorId: data.attendingDoctorId || null,
      },
    })
  })
  revalidatePath("/operations/emergency")
  return toPlain(emergencyCase)
}

export async function updateEmergencyCase(id: string, input: EmergencyUpdateInput) {
  const data = emergencyUpdateSchema.parse(input)

  await prisma.$transaction(async (tx) => {
    const existing = await tx.emergencyCase.findUniqueOrThrow({ where: { id } })

    if (data.bedId && data.bedId !== existing.bedId) {
      const bed = await tx.bed.findUniqueOrThrow({ where: { id: data.bedId } })
      if (bed.status !== "AVAILABLE") throw new Error("Selected bed is not available")
      if (existing.bedId) await tx.bed.update({ where: { id: existing.bedId }, data: { status: "CLEANING" } })
      await tx.bed.update({ where: { id: data.bedId }, data: { status: "OCCUPIED" } })
    }

    const isClosing = ["DISCHARGED", "REFERRED_OUT", "LEFT_WITHOUT_TREATMENT"].includes(data.status)
    if (isClosing && existing.bedId) {
      await tx.bed.update({ where: { id: existing.bedId }, data: { status: "CLEANING" } })
    }

    await tx.emergencyCase.update({
      where: { id },
      data: {
        status: data.status,
        attendingDoctorId: data.attendingDoctorId || existing.attendingDoctorId,
        bedId: data.bedId ?? existing.bedId,
        disposition: data.disposition || null,
        notes: data.notes || null,
        seenAt: existing.seenAt ?? (data.status !== "WAITING" ? new Date() : null),
        dischargedAt: isClosing ? new Date() : null,
      },
    })
  })

  revalidatePath("/operations/emergency")
}
