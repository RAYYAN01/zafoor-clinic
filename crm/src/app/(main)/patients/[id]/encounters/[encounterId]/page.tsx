import { notFound } from "next/navigation"
import { getEncounter } from "@/actions/encounters"
import { getDoctorTemplates } from "@/actions/templates"
import { getDoctorSignature } from "@/actions/signature"
import { EncounterWorkspace } from "@/components/emr/encounter-workspace"

export default async function EncounterPage({
  params,
}: {
  params: Promise<{ id: string; encounterId: string }>
}) {
  const { id: patientId, encounterId } = await params
  const encounter = await getEncounter(encounterId)
  if (!encounter || encounter.patientId !== patientId) notFound()

  const [templates, signature] = await Promise.all([
    getDoctorTemplates(encounter.doctorId, "SOAP"),
    getDoctorSignature(encounter.doctorId),
  ])

  return (
    <EncounterWorkspace
      encounter={encounter}
      templates={templates}
      signatureUrl={signature?.signatureUrl ?? null}
    />
  )
}
