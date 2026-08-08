import { getRefunds } from "@/actions/payments"
import { RefundsQueue } from "@/components/billing/refunds-queue"

export default async function RefundsPage() {
  const refunds = await getRefunds()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Refunds</h1>
        <p className="text-sm text-muted-foreground">{refunds.length} refund request{refunds.length === 1 ? "" : "s"}</p>
      </div>
      <RefundsQueue refunds={refunds} />
    </div>
  )
}
