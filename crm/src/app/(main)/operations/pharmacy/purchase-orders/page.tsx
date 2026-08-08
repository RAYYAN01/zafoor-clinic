import { getPurchaseOrders } from "@/actions/pharmacy"
import { getVendors } from "@/actions/pharmacy"
import { getMedicines } from "@/actions/pharmacy"
import { PurchaseOrdersBoard } from "@/components/operations/purchase-orders-board"

export default async function PurchaseOrdersPage() {
  const [orders, vendors, medicines] = await Promise.all([getPurchaseOrders(), getVendors(), getMedicines()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Purchase Orders</h1>
        <p className="text-sm text-muted-foreground">{orders.length} order{orders.length === 1 ? "" : "s"} · receiving updates stock automatically.</p>
      </div>
      <PurchaseOrdersBoard orders={orders} vendors={vendors} medicines={medicines} />
    </div>
  )
}
