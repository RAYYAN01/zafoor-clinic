import { getOpenCashSession, getCashSessionHistory } from "@/actions/cash-counter"
import { getPayments } from "@/actions/payments"
import { CashCounterPanel } from "@/components/finance/cash-counter-panel"

export default async function CashCounterPage() {
  const [openSession, history] = await Promise.all([getOpenCashSession(), getCashSessionHistory(10)])
  const sessionPayments = openSession ? (await getPayments({ cashSessionId: openSession.id, pageSize: 100 })).payments : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cash Counter</h1>
        <p className="text-sm text-muted-foreground">Open a session at shift start, close it with daily reconciliation.</p>
      </div>
      <CashCounterPanel openSession={openSession} sessionPayments={sessionPayments} history={history} />
    </div>
  )
}
