import { getEmergencyCases } from "@/actions/emergency"
import { getAvailableBeds } from "@/actions/beds"
import { getDoctors } from "@/lib/auth"
import { EmergencyBoard } from "@/components/operations/emergency-board"

export default async function EmergencyPage() {
  const [cases, beds, doctors] = await Promise.all([getEmergencyCases(), getAvailableBeds(), getDoctors()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Emergency</h1>
        <p className="text-sm text-muted-foreground">{cases.length} active case{cases.length === 1 ? "" : "s"}, triage-sorted.</p>
      </div>
      <EmergencyBoard cases={cases} beds={beds} doctors={doctors} />
    </div>
  )
}
