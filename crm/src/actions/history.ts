"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import {
  medicalHistorySchema,
  familyHistorySchema,
  surgicalHistorySchema,
  currentMedicationSchema,
  type MedicalHistoryInput,
  type FamilyHistoryInput,
  type SurgicalHistoryInput,
  type CurrentMedicationInput,
} from "@/lib/validations/emr"

function parseDate(value?: string) {
  return value ? new Date(value) : null
}

// ── Medical history ─────────────────────────────────────────────────────

export async function addMedicalHistory(patientId: string, input: MedicalHistoryInput) {
  const data = medicalHistorySchema.parse(input)
  await prisma.medicalHistory.create({
    data: { patientId, description: data.description, occurredOn: parseDate(data.occurredOn), notes: data.notes || null },
  })
  revalidatePath(`/patients/${patientId}`)
}

export async function deleteMedicalHistory(patientId: string, id: string) {
  await prisma.medicalHistory.delete({ where: { id } })
  revalidatePath(`/patients/${patientId}`)
}

// ── Family history ──────────────────────────────────────────────────────

export async function addFamilyHistory(patientId: string, input: FamilyHistoryInput) {
  const data = familyHistorySchema.parse(input)
  await prisma.familyHistoryEntry.create({ data: { ...data, patientId } })
  revalidatePath(`/patients/${patientId}`)
}

export async function deleteFamilyHistory(patientId: string, id: string) {
  await prisma.familyHistoryEntry.delete({ where: { id } })
  revalidatePath(`/patients/${patientId}`)
}

// ── Surgical history ────────────────────────────────────────────────────

export async function addSurgicalHistory(patientId: string, input: SurgicalHistoryInput) {
  const data = surgicalHistorySchema.parse(input)
  await prisma.surgicalHistory.create({
    data: { ...data, patientId, surgeryDate: parseDate(data.surgeryDate) },
  })
  revalidatePath(`/patients/${patientId}`)
}

export async function deleteSurgicalHistory(patientId: string, id: string) {
  await prisma.surgicalHistory.delete({ where: { id } })
  revalidatePath(`/patients/${patientId}`)
}

// ── Current medications ─────────────────────────────────────────────────

export async function addCurrentMedication(patientId: string, input: CurrentMedicationInput) {
  const data = currentMedicationSchema.parse(input)
  await prisma.currentMedication.create({
    data: { ...data, patientId, startDate: parseDate(data.startDate), endDate: parseDate(data.endDate) },
  })
  revalidatePath(`/patients/${patientId}`)
}

export async function updateMedicationStatus(patientId: string, id: string, status: "ACTIVE" | "STOPPED") {
  await prisma.currentMedication.update({
    where: { id },
    data: { status, endDate: status === "STOPPED" ? new Date() : null },
  })
  revalidatePath(`/patients/${patientId}`)
}

export async function deleteCurrentMedication(patientId: string, id: string) {
  await prisma.currentMedication.delete({ where: { id } })
  revalidatePath(`/patients/${patientId}`)
}

// ── Aggregate for Clinical History tab ─────────────────────────────────

export async function getClinicalHistory(patientId: string) {
  const [medicalHistory, familyHistory, surgicalHistory, currentMedications] = await Promise.all([
    prisma.medicalHistory.findMany({ where: { patientId }, orderBy: { createdAt: "desc" } }),
    prisma.familyHistoryEntry.findMany({ where: { patientId }, orderBy: { createdAt: "desc" } }),
    prisma.surgicalHistory.findMany({ where: { patientId }, orderBy: { createdAt: "desc" } }),
    prisma.currentMedication.findMany({ where: { patientId }, orderBy: { createdAt: "desc" } }),
  ])
  return { medicalHistory, familyHistory, surgicalHistory, currentMedications }
}
