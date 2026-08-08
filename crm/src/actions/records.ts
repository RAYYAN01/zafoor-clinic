"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { serializeDecimal } from "@/lib/serialize"
import {
  dischargeSummarySchema,
  referralNoteSchema,
  certificateSchema,
  type DischargeSummaryInput,
  type ReferralNoteInput,
  type CertificateInput,
} from "@/lib/validations/emr"

// ── Discharge summary ───────────────────────────────────────────────────

export async function createDischargeSummary(admissionId: string, patientId: string, input: DischargeSummaryInput) {
  const data = dischargeSummarySchema.parse(input)
  const user = await getCurrentUser()
  const record = await prisma.dischargeSummaryRecord.create({
    data: { ...data, admissionId, patientId, doctorId: user.id },
  })
  revalidatePath(`/patients/${patientId}`)
  return record
}

export async function signDischargeSummary(id: string, patientId: string) {
  await prisma.dischargeSummaryRecord.update({ where: { id }, data: { signedAt: new Date() } })
  revalidatePath(`/patients/${patientId}`)
}

export async function getDischargeSummaries(patientId: string) {
  const records = await prisma.dischargeSummaryRecord.findMany({
    where: { patientId },
    include: { doctor: true, admission: true },
    orderBy: { createdAt: "desc" },
  })
  return records.map((r) => ({ ...r, doctor: serializeDecimal(r.doctor, ["consultationFee"]) }))
}

// ── Referral notes ──────────────────────────────────────────────────────

export async function createReferralNote(patientId: string, input: ReferralNoteInput) {
  const data = referralNoteSchema.parse(input)
  const user = await getCurrentUser()
  const referral = await prisma.referralNote.create({ data: { ...data, patientId, fromDoctorId: user.id } })
  revalidatePath(`/patients/${patientId}`)
  return referral
}

export async function signReferralNote(id: string, patientId: string) {
  await prisma.referralNote.update({ where: { id }, data: { signedAt: new Date() } })
  revalidatePath(`/patients/${patientId}`)
}

export async function getReferralNotes(patientId: string) {
  const referrals = await prisma.referralNote.findMany({
    where: { patientId },
    include: { fromDoctor: true },
    orderBy: { createdAt: "desc" },
  })
  return referrals.map((r) => ({ ...r, fromDoctor: serializeDecimal(r.fromDoctor, ["consultationFee"]) }))
}

// ── Certificates ─────────────────────────────────────────────────────────

export async function createCertificate(patientId: string, input: CertificateInput) {
  const data = certificateSchema.parse(input)
  const user = await getCurrentUser()
  const certificate = await prisma.certificate.create({
    data: {
      ...data,
      patientId,
      doctorId: user.id,
      validFrom: data.validFrom ? new Date(data.validFrom) : null,
      validTo: data.validTo ? new Date(data.validTo) : null,
    },
  })
  revalidatePath(`/patients/${patientId}`)
  return certificate
}

export async function signCertificate(id: string, patientId: string) {
  await prisma.certificate.update({ where: { id }, data: { signedAt: new Date() } })
  revalidatePath(`/patients/${patientId}`)
}

export async function getCertificates(patientId: string) {
  const certificates = await prisma.certificate.findMany({
    where: { patientId },
    include: { doctor: true },
    orderBy: { createdAt: "desc" },
  })
  return certificates.map((c) => ({ ...c, doctor: serializeDecimal(c.doctor, ["consultationFee"]) }))
}

// ── Aggregate for Records tab ──────────────────────────────────────────

export async function getPatientRecords(patientId: string) {
  const [dischargeSummaries, referralNotes, certificates] = await Promise.all([
    getDischargeSummaries(patientId),
    getReferralNotes(patientId),
    getCertificates(patientId),
  ])
  return { dischargeSummaries, referralNotes, certificates }
}
