import { getAllDoctorsWithAvailability } from "@/actions/appointments"
import { DoctorAvailabilityCard } from "@/components/appointments/doctor-availability-card"

export default async function AvailabilityPage() {
  const doctors = await getAllDoctorsWithAvailability()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Doctor Availability</h1>
        <p className="text-sm text-muted-foreground">Manage weekly schedules and leave for each doctor.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {doctors.map((doctor) => (
          <DoctorAvailabilityCard key={doctor.id} doctor={doctor} />
        ))}
      </div>
    </div>
  )
}
