import { notFound } from "next/navigation"
import { getPatientById } from "@/actions/patients"
import { PatientForm } from "@/components/patients/patient-form"

export default async function EditPatientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const patient = await getPatientById(id)
  if (!patient) notFound()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Patient</h1>
        <p className="text-sm text-muted-foreground">{patient.uhid}</p>
      </div>
      <PatientForm
        patientId={patient.id}
        defaultValues={{
          firstName: patient.firstName,
          lastName: patient.lastName ?? "",
          dob: patient.dob,
          gender: patient.gender ?? undefined,
          bloodGroup: patient.bloodGroup ?? "UNKNOWN",
          occupation: patient.occupation ?? "",
          phone: patient.phone,
          alternatePhone: patient.alternatePhone ?? "",
          email: patient.email ?? "",
          addressLine1: patient.addressLine1 ?? "",
          addressLine2: patient.addressLine2 ?? "",
          city: patient.city ?? "",
          state: patient.state ?? "",
          postalCode: patient.postalCode ?? "",
          country: patient.country ?? "India",
          photoUrl: patient.photoUrl ?? "",
        }}
      />
    </div>
  )
}
