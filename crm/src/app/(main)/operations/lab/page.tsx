import { getLabOrders } from "@/actions/lab"
import { getDoctors } from "@/lib/auth"
import { LabOrdersBoard } from "@/components/operations/lab-orders-board"

export default async function LabPage() {
  const [orders, doctors] = await Promise.all([getLabOrders(), getDoctors()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Laboratory</h1>
        <p className="text-sm text-muted-foreground">{orders.length} order{orders.length === 1 ? "" : "s"} · sample tracking with barcodes.</p>
      </div>
      <LabOrdersBoard orders={orders} doctors={doctors} />
    </div>
  )
}
