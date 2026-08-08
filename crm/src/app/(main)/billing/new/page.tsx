import { getPackages } from "@/actions/packages"
import { getCorporateAccounts } from "@/actions/corporate"
import { getPatientById } from "@/actions/patients"
import { BillForm } from "@/components/billing/bill-form"

export default async function NewBillPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string; admissionId?: string; appointmentId?: string; type?: string }>
}) {
  const sp = await searchParams
  const [packages, corporateAccounts, patient] = await Promise.all([
    getPackages(true),
    getCorporateAccounts(),
    sp.patientId ? getPatientById(sp.patientId) : Promise.resolve(null),
  ])

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Bill</h1>
        <p className="text-sm text-muted-foreground">GST is computed automatically from each line item&apos;s tax rate.</p>
      </div>
      <BillForm
        packages={packages}
        corporateAccounts={corporateAccounts}
        initialPatient={patient ? { id: patient.id, name: `${patient.firstName} ${patient.lastName ?? ""}`.trim(), uhid: patient.uhid, phone: patient.phone, insurances: patient.insurances } : null}
        defaultAdmissionId={sp.admissionId}
        defaultAppointmentId={sp.appointmentId}
        defaultType={sp.type}
      />
    </div>
  )
}
