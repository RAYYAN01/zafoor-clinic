import { getFacilityTickets } from "@/actions/facility"
import { getEquipment } from "@/actions/assets"
import { getAllStaff } from "@/lib/auth"
import { FacilityTicketsBoard } from "@/components/operations/facility-tickets-board"

export default async function FacilityPage() {
  const [tickets, equipment, staff] = await Promise.all([getFacilityTickets(), getEquipment(), getAllStaff()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Facility — Housekeeping, Laundry & Maintenance</h1>
        <p className="text-sm text-muted-foreground">{tickets.length} ticket{tickets.length === 1 ? "" : "s"} logged.</p>
      </div>
      <FacilityTicketsBoard tickets={tickets} equipment={equipment} staff={staff} />
    </div>
  )
}
