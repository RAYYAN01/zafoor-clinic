"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getCurrentUser, requireRole } from "@/lib/auth"
import { generateUHID } from "@/lib/sequence"
import { serializeDecimal } from "@/lib/serialize"
import {
  patientCoreSchema,
  familyMemberSchema,
  insuranceSchema,
  emergencyContactSchema,
  medicalAlertSchema,
  allergySchema,
  chronicDiseaseSchema,
  communicationPreferenceSchema,
  documentSchema,
  type PatientCoreInput,
  type FamilyMemberInput,
  type InsuranceInput,
  type EmergencyContactInput,
  type MedicalAlertInput,
  type AllergyInput,
  type ChronicDiseaseInput,
  type CommunicationPreferenceInput,
  type DocumentInput,
} from "@/lib/validations/patient"

function cleanEmail(email?: string) {
  return email && email.length > 0 ? email : undefined
}

function parseDob(dob?: string) {
  return dob ? new Date(dob) : null
}

export async function createPatient(input: PatientCoreInput) {
  const data = patientCoreSchema.parse(input)
  const user = await getCurrentUser()

  const patient = await prisma.$transaction(async (tx) => {
    const uhid = await generateUHID(tx)
    return tx.patient.create({
      data: {
        uhid,
        firstName: data.firstName,
        lastName: data.lastName || null,
        dob: parseDob(data.dob),
        gender: data.gender,
        bloodGroup: data.bloodGroup ?? "UNKNOWN",
        occupation: data.occupation || null,
        phone: data.phone,
        alternatePhone: data.alternatePhone || null,
        email: cleanEmail(data.email),
        addressLine1: data.addressLine1 || null,
        addressLine2: data.addressLine2 || null,
        city: data.city || null,
        state: data.state || null,
        postalCode: data.postalCode || null,
        country: data.country || "India",
        photoUrl: data.photoUrl || null,
        registeredById: user.id,
        communicationPreference: {
          create: {
            preferredChannel: "SMS",
          },
        },
      },
    })
  })

  revalidatePath("/patients")
  return patient
}

export async function updatePatientCore(patientId: string, input: PatientCoreInput) {
  const data = patientCoreSchema.parse(input)
  const patient = await prisma.patient.update({
    where: { id: patientId },
    data: {
      firstName: data.firstName,
      lastName: data.lastName || null,
      dob: parseDob(data.dob),
      gender: data.gender,
      bloodGroup: data.bloodGroup ?? "UNKNOWN",
      occupation: data.occupation || null,
      phone: data.phone,
      alternatePhone: data.alternatePhone || null,
      email: cleanEmail(data.email),
      addressLine1: data.addressLine1 || null,
      addressLine2: data.addressLine2 || null,
      city: data.city || null,
      state: data.state || null,
      postalCode: data.postalCode || null,
      country: data.country || "India",
      photoUrl: data.photoUrl || null,
    },
  })
  revalidatePath(`/patients/${patientId}`)
  revalidatePath("/patients")
  return patient
}

export async function updatePatientStatus(patientId: string, status: "ACTIVE" | "INACTIVE") {
  await requireRole("ADMIN", "DOCTOR")
  await prisma.patient.update({ where: { id: patientId }, data: { status } })
  revalidatePath(`/patients/${patientId}`)
  revalidatePath("/patients")
}

export async function getPatients(params: {
  query?: string
  status?: string
  tagId?: string
  page?: number
  pageSize?: number
}) {
  const { query, status, tagId, page = 1, pageSize = 20 } = params

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (tagId) where.tags = { some: { tagId } }
  if (query) {
    where.OR = [
      { firstName: { contains: query, mode: "insensitive" } },
      { lastName: { contains: query, mode: "insensitive" } },
      { uhid: { contains: query, mode: "insensitive" } },
      { phone: { contains: query } },
      { email: { contains: query, mode: "insensitive" } },
    ]
  }

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      include: { tags: { include: { tag: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.patient.count({ where }),
  ])

  return { patients, total, page, pageSize }
}

export async function getPatientById(patientId: string) {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      tags: { include: { tag: true } },
      familyMembers: { orderBy: { createdAt: "desc" } },
      insurances: { orderBy: { createdAt: "desc" } },
      emergencyContacts: { orderBy: { createdAt: "desc" } },
      medicalAlerts: { orderBy: { createdAt: "desc" } },
      allergies: { orderBy: { notedOn: "desc" } },
      chronicDiseases: { orderBy: { createdAt: "desc" } },
      documents: { orderBy: { uploadedAt: "desc" } },
      communicationPreference: true,
      registeredBy: true,
    },
  })
  if (!patient) return null
  return {
    ...patient,
    insurances: patient.insurances.map((i) => serializeDecimal(i, ["coverageAmount"])),
    registeredBy: patient.registeredBy ? serializeDecimal(patient.registeredBy, ["consultationFee"]) : null,
  }
}

export async function getPatientInsurances(patientId: string) {
  const insurances = await prisma.insurance.findMany({ where: { patientId }, orderBy: { isPrimary: "desc" } })
  return insurances.map((i) => serializeDecimal(i, ["coverageAmount"]))
}

export async function listAllTags() {
  return prisma.tag.findMany({ orderBy: { name: "asc" } })
}

export async function createTag(name: string, color: string) {
  const tag = await prisma.tag.create({ data: { name, color } })
  revalidatePath("/patients")
  return tag
}

export async function togglePatientTag(patientId: string, tagId: string) {
  const existing = await prisma.patientTag.findUnique({
    where: { patientId_tagId: { patientId, tagId } },
  })
  if (existing) {
    await prisma.patientTag.delete({ where: { patientId_tagId: { patientId, tagId } } })
  } else {
    await prisma.patientTag.create({ data: { patientId, tagId } })
  }
  revalidatePath(`/patients/${patientId}`)
}

// ── Family members ─────────────────────────────────────────────────────

export async function addFamilyMember(patientId: string, input: FamilyMemberInput) {
  const data = familyMemberSchema.parse(input)
  await prisma.familyMember.create({ data: { ...data, patientId } })
  revalidatePath(`/patients/${patientId}`)
}

export async function deleteFamilyMember(patientId: string, id: string) {
  await prisma.familyMember.delete({ where: { id } })
  revalidatePath(`/patients/${patientId}`)
}

// ── Insurance ───────────────────────────────────────────────────────────

export async function addInsurance(patientId: string, input: InsuranceInput) {
  const data = insuranceSchema.parse(input)
  await prisma.insurance.create({ data: { ...data, patientId } })
  revalidatePath(`/patients/${patientId}`)
}

export async function deleteInsurance(patientId: string, id: string) {
  await prisma.insurance.delete({ where: { id } })
  revalidatePath(`/patients/${patientId}`)
}

// ── Emergency contacts ──────────────────────────────────────────────────

export async function addEmergencyContact(patientId: string, input: EmergencyContactInput) {
  const data = emergencyContactSchema.parse(input)
  await prisma.emergencyContact.create({ data: { ...data, patientId } })
  revalidatePath(`/patients/${patientId}`)
}

export async function deleteEmergencyContact(patientId: string, id: string) {
  await prisma.emergencyContact.delete({ where: { id } })
  revalidatePath(`/patients/${patientId}`)
}

// ── Medical alerts ──────────────────────────────────────────────────────

export async function addMedicalAlert(patientId: string, input: MedicalAlertInput) {
  const data = medicalAlertSchema.parse(input)
  await prisma.medicalAlert.create({ data: { ...data, patientId } })
  revalidatePath(`/patients/${patientId}`)
}

export async function toggleMedicalAlert(patientId: string, id: string, active: boolean) {
  await prisma.medicalAlert.update({ where: { id }, data: { active } })
  revalidatePath(`/patients/${patientId}`)
}

export async function deleteMedicalAlert(patientId: string, id: string) {
  await prisma.medicalAlert.delete({ where: { id } })
  revalidatePath(`/patients/${patientId}`)
}

// ── Allergies ───────────────────────────────────────────────────────────

export async function addAllergy(patientId: string, input: AllergyInput) {
  const data = allergySchema.parse(input)
  await prisma.allergy.create({ data: { ...data, patientId } })
  revalidatePath(`/patients/${patientId}`)
}

export async function deleteAllergy(patientId: string, id: string) {
  await prisma.allergy.delete({ where: { id } })
  revalidatePath(`/patients/${patientId}`)
}

// ── Chronic diseases ────────────────────────────────────────────────────

export async function addChronicDisease(patientId: string, input: ChronicDiseaseInput) {
  const data = chronicDiseaseSchema.parse(input)
  await prisma.chronicDisease.create({ data: { ...data, patientId } })
  revalidatePath(`/patients/${patientId}`)
}

export async function deleteChronicDisease(patientId: string, id: string) {
  await prisma.chronicDisease.delete({ where: { id } })
  revalidatePath(`/patients/${patientId}`)
}

// ── Documents ───────────────────────────────────────────────────────────

export async function addDocument(patientId: string, input: DocumentInput) {
  const data = documentSchema.parse(input)
  const user = await getCurrentUser()
  await prisma.document.create({
    data: { ...data, patientId, uploadedById: user.id },
  })
  revalidatePath(`/patients/${patientId}`)
}

export async function deleteDocument(patientId: string, id: string) {
  await prisma.document.delete({ where: { id } })
  revalidatePath(`/patients/${patientId}`)
}

// ── Communication preferences ──────────────────────────────────────────

export async function upsertCommunicationPreference(patientId: string, input: CommunicationPreferenceInput) {
  const data = communicationPreferenceSchema.parse(input)
  await prisma.communicationPreference.upsert({
    where: { patientId },
    create: { ...data, patientId },
    update: data,
  })
  revalidatePath(`/patients/${patientId}`)
}
