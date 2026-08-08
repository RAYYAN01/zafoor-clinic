"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { serializeDecimal } from "@/lib/serialize"
import {
  clinicalReportSchema,
  labResultItemSchema,
  type ClinicalReportInput,
  type LabResultItemInput,
} from "@/lib/validations/emr"

export async function createClinicalReport(
  patientId: string,
  input: ClinicalReportInput,
  labResults: LabResultItemInput[] = [],
  encounterId?: string
) {
  const data = clinicalReportSchema.parse(input)
  const items = labResults.map((r) => labResultItemSchema.parse(r))
  const user = await getCurrentUser()

  const report = await prisma.clinicalReport.create({
    data: {
      patientId,
      doctorId: user.id,
      encounterId,
      type: data.type,
      title: data.title,
      modality: data.modality || null,
      findings: data.findings || null,
      impression: data.impression || null,
      status: data.status,
      reportDate: data.reportDate ? new Date(data.reportDate) : new Date(),
      attachmentUrl: data.attachmentUrl || null,
      labResults: { create: items },
    },
  })

  revalidatePath(`/patients/${patientId}`)
  return report
}

export async function deleteClinicalReport(patientId: string, id: string) {
  await prisma.clinicalReport.delete({ where: { id } })
  revalidatePath(`/patients/${patientId}`)
}

export async function getClinicalReports(patientId: string, type?: "LAB" | "RADIOLOGY") {
  const reports = await prisma.clinicalReport.findMany({
    where: { patientId, type },
    include: { labResults: true, doctor: true },
    orderBy: { reportDate: "desc" },
  })
  return reports.map((r) => ({ ...r, doctor: r.doctor ? serializeDecimal(r.doctor, ["consultationFee"]) : null }))
}
