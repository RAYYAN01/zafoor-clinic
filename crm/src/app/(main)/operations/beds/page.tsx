import { getWards, getBeds, getBedOccupancySummary } from "@/actions/beds"
import { BedsBoard } from "@/components/operations/beds-board"

export default async function BedsPage() {
  const [wards, beds, summary] = await Promise.all([getWards(), getBeds(), getBedOccupancySummary()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bed & Ward Management</h1>
        <p className="text-sm text-muted-foreground">
          {summary.occupied}/{summary.total} beds occupied ({summary.occupancyRate}%) across {wards.length} ward{wards.length === 1 ? "" : "s"}.
        </p>
      </div>
      <BedsBoard wards={wards} beds={beds} />
    </div>
  )
}
