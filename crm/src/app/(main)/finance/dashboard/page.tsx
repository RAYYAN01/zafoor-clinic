import { DollarSign, TrendingUp, Receipt, AlertCircle } from "lucide-react"
import { getRevenueDashboard } from "@/actions/finance"
import { StatCard } from "@/components/dashboard/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendBars } from "@/components/finance/trend-bars"
import { BarBreakdown } from "@/components/finance/bar-breakdown"
import { formatCurrency } from "@/lib/format"
import { billTypeLabels, paymentMethodLabels } from "@/lib/labels"

export default async function FinanceDashboardPage() {
  const stats = await getRevenueDashboard()

  const revenueByType = Object.entries(stats.revenueByType).map(([type, value]) => ({
    label: billTypeLabels[type] ?? type,
    value,
  }))
  const collectionsByMethod = Object.entries(stats.collectionsByMethod).map(([method, value]) => ({
    label: paymentMethodLabels[method] ?? method,
    value,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Finance Dashboard</h1>
        <p className="text-sm text-muted-foreground">Revenue and collections overview.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Today's Revenue" value={formatCurrency(stats.todayRevenue)} icon={DollarSign} tone="default" />
        <StatCard label="Today's Collections" value={formatCurrency(stats.todayCollected)} icon={Receipt} tone="success" />
        <StatCard label="30-Day Revenue" value={formatCurrency(stats.monthRevenue)} icon={TrendingUp} tone="info" />
        <StatCard label="Outstanding Dues" value={formatCurrency(stats.totalOutstanding)} icon={AlertCircle} tone="danger" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Revenue Trend (14 days)</CardTitle></CardHeader>
        <CardContent>
          <TrendBars data={stats.revenueByDay} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <BarBreakdown title="Revenue by Bill Type (30 days)" data={revenueByType} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <BarBreakdown title="Collections by Method (30 days)" data={collectionsByMethod} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase">30-Day GST Collected</p>
            <p className="text-xl font-semibold mt-1">{formatCurrency(stats.monthGst)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase">30-Day Expenses</p>
            <p className="text-xl font-semibold mt-1">{formatCurrency(stats.monthExpenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground uppercase">30-Day Net Collected</p>
            <p className="text-xl font-semibold mt-1">{formatCurrency(stats.monthCollected - stats.monthExpenses)}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
