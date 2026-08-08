import { getServices } from "@/actions/services"
import { getPatientById } from "@/actions/patients"
import { BillForm } from "@/components/billing/bill-form"

export default async function NewBillPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string; appointmentId?: string }>
}) {
  const sp = await searchParams
  const [services, patient] = await Promise.all([
    getServices(true),
    sp.patientId ? getPatientById(sp.patientId) : Promise.resolve(null),
  ])

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Bill</h1>
        <p className="text-sm text-muted-foreground">Tax is computed automatically from each line item&apos;s tax rate.</p>
      </div>
      <BillForm
        services={services}
        initialPatient={patient ? { id: patient.id, name: `${patient.firstName} ${patient.lastName ?? ""}`.trim(), uhid: patient.uhid, phone: patient.phone, insurances: patient.insurances } : null}
        defaultAppointmentId={sp.appointmentId}
      />
    </div>
  )
}
