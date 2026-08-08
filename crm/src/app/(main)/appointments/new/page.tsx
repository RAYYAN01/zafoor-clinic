import { getDoctors } from "@/lib/auth"
import { getPatientById } from "@/actions/patients"
import { BookingForm } from "@/components/appointments/booking-form"
import { patientDisplayName } from "@/lib/format"

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>
}) {
  const sp = await searchParams
  const [doctors, patient] = await Promise.all([
    getDoctors(),
    sp.patientId ? getPatientById(sp.patientId) : Promise.resolve(null),
  ])

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Book Appointment</h1>
        <p className="text-sm text-muted-foreground">Choose a doctor and an available slot.</p>
      </div>
      <BookingForm
        doctors={doctors}
        initialPatient={patient ? { id: patient.id, name: patientDisplayName(patient), uhid: patient.uhid, phone: patient.phone } : null}
      />
    </div>
  )
}
