import { getEquipment } from "@/actions/assets"
import { getVendors } from "@/actions/pharmacy"
import { EquipmentBoard } from "@/components/operations/equipment-board"

export default async function AssetsPage() {
  const [equipment, vendors] = await Promise.all([getEquipment(), getVendors()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Equipment & Biomedical Assets</h1>
        <p className="text-sm text-muted-foreground">{equipment.length} asset{equipment.length === 1 ? "" : "s"} tracked.</p>
      </div>
      <EquipmentBoard equipment={equipment} vendors={vendors} />
    </div>
  )
}
