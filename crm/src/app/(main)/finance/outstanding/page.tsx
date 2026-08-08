import Link from "next/link"
import { getOutstandingDues } from "@/actions/finance"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate, patientDisplayName } from "@/lib/format"

export default async function OutstandingDuesPage() {
  const { rows, buckets, totalOutstanding } = await getOutstandingDues()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Outstanding Dues</h1>
        <p className="text-sm text-muted-foreground">{formatCurrency(totalOutstanding)} total outstanding across {rows.length} bill{rows.length === 1 ? "" : "s"}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground uppercase">0–30 days</p><p className="text-lg font-semibold mt-1">{formatCurrency(buckets.current)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground uppercase">31–60 days</p><p className="text-lg font-semibold mt-1 text-amber-600">{formatCurrency(buckets.days30)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground uppercase">61–90 days</p><p className="text-lg font-semibold mt-1 text-orange-600">{formatCurrency(buckets.days60)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground uppercase">90+ days</p><p className="text-lg font-semibold mt-1 text-red-600">{formatCurrency(buckets.days90plus)}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {rows.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">No outstanding dues. Everything is settled.</p>}
          {rows.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill #</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead className="text-right">Balance Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell>
                      <Link href={`/billing/${bill.id}`} className="font-medium hover:underline">{bill.billNumber}</Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/patients/${bill.patientId}`} className="hover:underline">{patientDisplayName(bill.patient)}</Link>
                      <p className="text-xs text-muted-foreground">{bill.patient.phone}</p>
                    </TableCell>
                    <TableCell>{bill.service?.name ?? "—"}</TableCell>
                    <TableCell>{formatDate(bill.issuedAt)}</TableCell>
                    <TableCell>
                      <Badge variant={bill.ageDays > 60 ? "secondary" : "outline"} className={bill.ageDays > 60 ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" : ""}>
                        {bill.ageDays}d
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(Number(bill.balanceDue))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
