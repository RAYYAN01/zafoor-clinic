import { notFound } from "next/navigation"
import Link from "next/link"
import { getPayrollRun } from "@/actions/payroll"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

export default async function PayrollRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const run = await getPayrollRun(id)
  if (!run) notFound()

  const totalGross = run.payslips.reduce((sum, p) => sum + Number(p.grossEarnings), 0)
  const totalNet = run.payslips.reduce((sum, p) => sum + Number(p.netPay), 0)

  return (
    <div className="space-y-6">
      <div>
        <Link href="/hr/payroll" className="text-sm text-primary hover:underline">← Payroll</Link>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">{MONTH_NAMES[run.month - 1]} {run.year} Payroll</h1>
        <p className="text-sm text-muted-foreground">{run.payslips.length} payslips · Gross {formatCurrency(totalGross)} · Net {formatCurrency(totalNet)}</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Payslips</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          {run.payslips.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg px-2 py-2.5 hover:bg-muted text-sm">
              <div>
                <p className="font-medium">{p.employee.user.name}</p>
                <p className="text-xs text-muted-foreground">{p.employee.department?.name ?? "—"}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatCurrency(Number(p.netPay))}</p>
                <p className="text-xs text-muted-foreground">Gross {formatCurrency(Number(p.grossEarnings))}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
