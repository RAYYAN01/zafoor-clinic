import { PatientForm } from "@/components/patients/patient-form"

export default function NewPatientPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Register Patient</h1>
        <p className="text-sm text-muted-foreground">
          A unique UHID will be generated automatically once you save.
        </p>
      </div>
      <PatientForm />
    </div>
  )
}
