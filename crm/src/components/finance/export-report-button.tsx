"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import type { getFinancialReport } from "@/actions/finance"

type Report = Awaited<ReturnType<typeof getFinancialReport>>

export function ExportReportButton({ report, from, to }: { report: Report; from: Date; to: Date }) {
  function exportCsv() {
    const rows: [string, string | number][] = [
      ["Period", `${format(from, "yyyy-MM-dd")} to ${format(to, "yyyy-MM-dd")}`],
      ["Bills Issued", report.billCount],
      ["Total Revenue", report.totalRevenue],
      ["Total Collected", report.totalCollected],
      ["Total Discount", report.totalDiscount],
      ["Total CGST", report.totalCgst],
      ["Total SGST", report.totalSgst],
      ["Total Expenses", report.totalExpenses],
      ["Net Profit", report.netProfit],
      ["", ""],
      ["Revenue by Bill Type", ""],
      ...Object.entries(report.revenueByType),
      ["", ""],
      ["Payments by Method", ""],
      ...Object.entries(report.paymentsByMethod),
      ["", ""],
      ["Expenses by Category", ""],
      ...Object.entries(report.expensesByCategory),
    ]

    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `financial-report-${format(from, "yyyy-MM-dd")}-to-${format(to, "yyyy-MM-dd")}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCsv}>
      <Download className="h-3.5 w-3.5" />
      Export CSV
    </Button>
  )
}
