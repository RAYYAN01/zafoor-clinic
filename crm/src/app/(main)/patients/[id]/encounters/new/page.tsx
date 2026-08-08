import { redirect } from "next/navigation"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { createEncounter, getActiveEncounterForAppointment } from "@/actions/encounters"
import { getDoctors } from "@/lib/auth"
import { getPatientById } from "@/actions/patients"
import { NewEncounterForm } from "@/components/emr/new-encounter-form"

export default async function NewEncounterPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ appointmentId?: string }>
}) {
  const { id: patientId } = await params
  const { appointmentId } = await searchParams

  const patient = await getPatientById(patientId)
  if (!patient) notFound()

  if (appointmentId) {
    const existing = await getActiveEncounterForAppointment(appointmentId)
    if (existing) redirect(`/patients/${patientId}/encounters/${existing.id}`)

    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } })
    if (appointment) {
      const encounter = await createEncounter({ patientId, doctorId: appointment.doctorId, appointmentId })
      redirect(`/patients/${patientId}/encounters/${encounter.id}`)
    }
  }

  const doctors = await getDoctors()

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Consultation</h1>
        <p className="text-sm text-muted-foreground">{patient.firstName} {patient.lastName} · {patient.uhid}</p>
      </div>
      <NewEncounterForm patientId={patientId} doctors={doctors} />
    </div>
  )
}
