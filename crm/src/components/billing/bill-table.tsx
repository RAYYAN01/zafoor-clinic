import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { billTypeLabels, billStatusLabels, billStatusColors, payerTypeLabels } from "@/lib/labels"
import { formatCurrency, formatDate, patientDisplayName } from "@/lib/format"
import type { getBills } from "@/actions/billing"

type Bills = Awaited<ReturnType<typeof getBills>>["bills"]

export function BillTable({ bills }: { bills: Bills }) {
  if (bills.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">No bills found.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Bill #</TableHead>
          <TableHead>Patient</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Payer</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Net Amount</TableHead>
          <TableHead>Balance Due</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bills.map((bill) => (
          <TableRow key={bill.id} className="cursor-pointer">
            <TableCell>
              <Link href={`/billing/${bill.id}`} className="font-medium hover:underline">
                {bill.billNumber}
              </Link>
            </TableCell>
            <TableCell>
              <Link href={`/patients/${bill.patientId}`} className="hover:underline">
                {patientDisplayName(bill.patient)}
              </Link>
            </TableCell>
            <TableCell>{billTypeLabels[bill.type]}</TableCell>
            <TableCell>{payerTypeLabels[bill.payerType]}</TableCell>
            <TableCell>{formatDate(bill.issuedAt)}</TableCell>
            <TableCell>{formatCurrency(Number(bill.netAmount))}</TableCell>
            <TableCell className={Number(bill.balanceDue) > 0 ? "font-medium text-red-600" : ""}>
              {formatCurrency(Number(bill.balanceDue))}
            </TableCell>
            <TableCell>
              <Badge variant="secondary" className={billStatusColors[bill.status]}>
                {billStatusLabels[bill.status]}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
