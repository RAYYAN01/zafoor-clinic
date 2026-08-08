import { getRadiologyOrders } from "@/actions/radiology"
import { getDoctors } from "@/lib/auth"
import { RadiologyBoard } from "@/components/operations/radiology-board"

export default async function RadiologyPage() {
  const [orders, doctors] = await Promise.all([getRadiologyOrders(), getDoctors()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Radiology</h1>
        <p className="text-sm text-muted-foreground">{orders.length} order{orders.length === 1 ? "" : "s"} · imaging orders with PACS attachments.</p>
      </div>
      <RadiologyBoard orders={orders} doctors={doctors} />
    </div>
  )
}
