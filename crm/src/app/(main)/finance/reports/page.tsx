import { getFinancialReport } from "@/actions/finance"
import { ReportDateRange } from "@/components/finance/report-date-range"
import { ExportReportButton } from "@/components/finance/export-report-button"
import { Card, CardContent } from "@/components/ui/card"
import { BarBreakdown } from "@/components/finance/bar-breakdown"
import { formatCurrency, formatDate } from "@/lib/format"
import { billTypeLabels, paymentMethodLabels, expenseCategoryLabels } from "@/lib/labels"

export default async function FinancialReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const sp = await searchParams
  const to = sp.to ? new Date(sp.to) : new Date()
  const from = sp.from ? new Date(sp.from) : new Date(to.getTime() - 29 * 24 * 60 * 60 * 1000)

  const report = await getFinancialReport(from, to)

  const revenueByType = Object.entries(report.revenueByType).map(([type, value]) => ({ label: billTypeLabels[type] ?? type, value }))
  const paymentsByMethod = Object.entries(report.paymentsByMethod).map(([method, value]) => ({ label: paymentMethodLabels[method] ?? method, value }))
  const expensesByCategory = Object.entries(report.expensesByCategory).map(([category, value]) => ({ label: expenseCategoryLabels[category] ?? category, value }))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Financial Reports</h1>
          <p className="text-sm text-muted-foreground">{formatDate(from)} — {formatDate(to)}</p>
        </div>
        <div className="flex items-center gap-2">
          <ReportDateRange from={from} to={to} />
          <ExportReportButton report={report} from={from} to={to} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground uppercase">Revenue</p><p className="text-lg font-semibold mt-1">{formatCurrency(report.totalRevenue)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground uppercase">Collected</p><p className="text-lg font-semibold mt-1">{formatCurrency(report.totalCollected)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground uppercase">Expenses</p><p className="text-lg font-semibold mt-1">{formatCurrency(report.totalExpenses)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground uppercase">Net Profit</p><p className={`text-lg font-semibold mt-1 ${report.netProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}>{formatCurrency(report.netProfit)}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground uppercase">Bills Issued</p><p className="text-lg font-semibold mt-1">{report.billCount}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground uppercase">Discounts Given</p><p className="text-lg font-semibold mt-1">{formatCurrency(report.totalDiscount)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground uppercase">CGST Collected</p><p className="text-lg font-semibold mt-1">{formatCurrency(report.totalCgst)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground uppercase">SGST Collected</p><p className="text-lg font-semibold mt-1">{formatCurrency(report.totalSgst)}</p></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card><CardContent className="pt-6"><BarBreakdown title="Revenue by Bill Type" data={revenueByType} /></CardContent></Card>
        <Card><CardContent className="pt-6"><BarBreakdown title="Payments by Method" data={paymentsByMethod} /></CardContent></Card>
        <Card><CardContent className="pt-6"><BarBreakdown title="Expenses by Category" data={expensesByCategory} /></CardContent></Card>
      </div>
    </div>
  )
}
