"use client"

import Link from "next/link"
import { useTransition } from "react"
import { toast } from "sonner"
import { Printer, Ban } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CollectPaymentDialog } from "@/components/billing/collect-payment-dialog"
import { RequestRefundDialog } from "@/components/billing/request-refund-dialog"
import { formatCurrency, formatDate, formatDateTime, patientDisplayName } from "@/lib/format"
import { billStatusLabels, billStatusColors, paymentMethodLabels, refundStatusColors, refundStatusLabels } from "@/lib/labels"
import { CLINIC_INFO } from "@/lib/hospital-info"
import { cancelBill, type getBill } from "@/actions/billing"

type Bill = NonNullable<Awaited<ReturnType<typeof getBill>>>

export function InvoiceView({ bill }: { bill: Bill }) {
  const [pending, startTransition] = useTransition()
  const canCollect = bill.status !== "CANCELLED" && bill.status !== "REFUNDED" && Number(bill.balanceDue) > 0
  const canCancel = bill.status === "PENDING"

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/billing" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Billing
        </Link>
        <div className="flex flex-wrap gap-2">
          {canCollect && <CollectPaymentDialog billId={bill.id} patientId={bill.patientId} balanceDue={Number(bill.balanceDue)} />}
          <RequestRefundDialog patientId={bill.patientId} billId={bill.id} maxAmount={Number(bill.amountPaid)} />
          {canCancel && (
            <Button
              variant="outline"
              className="gap-1.5 text-destructive"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  try {
                    await cancelBill(bill.id, bill.patientId)
                    toast.success("Bill cancelled")
                  } catch {
                    toast.error("Could not cancel bill")
                  }
                })
              }
            >
              <Ban className="h-3.5 w-3.5" />
              Cancel Bill
            </Button>
          )}
          <Button variant="outline" className="gap-1.5" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold">{CLINIC_INFO.name}</h1>
              <p className="text-sm text-muted-foreground">{CLINIC_INFO.address}</p>
              <p className="text-sm text-muted-foreground">{CLINIC_INFO.phone} · {CLINIC_INFO.email}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold tracking-tight">INVOICE</p>
              <p className="text-sm mt-1">{bill.billNumber}</p>
              <p className="text-sm text-muted-foreground">{formatDate(bill.issuedAt)}</p>
              <Badge variant="secondary" className={`mt-2 ${billStatusColors[bill.status]}`}>
                {billStatusLabels[bill.status]}
              </Badge>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 rounded-lg border p-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Billed To</p>
              <p className="text-sm font-medium mt-1">{patientDisplayName(bill.patient)}</p>
              <p className="text-sm text-muted-foreground">{bill.patient.uhid} · {bill.patient.phone}</p>
              {bill.patient.addressLine1 && (
                <p className="text-sm text-muted-foreground">
                  {[bill.patient.addressLine1, bill.patient.city, bill.patient.state].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Billing Details</p>
              {bill.service && <p className="text-sm mt-1">{bill.service.name}</p>}
              {bill.insurance && (
                <p className="text-sm text-muted-foreground">{bill.insurance.provider} — {bill.insurance.policyNumber}</p>
              )}
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Tax %</TableHead>
                <TableHead>Tax Amt</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bill.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{formatCurrency(Number(item.unitPrice))}</TableCell>
                  <TableCell>{Number(item.taxRatePercent)}%</TableCell>
                  <TableCell>{formatCurrency(Number(item.taxAmount))}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(item.amount))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(Number(bill.totalAmount))}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-{formatCurrency(Number(bill.discountAmount))}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatCurrency(Number(bill.taxAmount))}</span></div>
              <div className="flex justify-between font-semibold text-base border-t pt-1.5"><span>Net Amount</span><span>{formatCurrency(Number(bill.netAmount))}</span></div>
              <div className="flex justify-between text-emerald-700"><span>Amount Paid</span><span>{formatCurrency(Number(bill.amountPaid))}</span></div>
              <div className="flex justify-between font-semibold text-red-600"><span>Balance Due</span><span>{formatCurrency(Number(bill.balanceDue))}</span></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="print:hidden">
        <CardContent className="pt-6">
          <p className="text-sm font-medium mb-3">Payment History</p>
          {bill.payments.length === 0 && <p className="text-sm text-muted-foreground">No payments recorded yet.</p>}
          {bill.payments.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Received By</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bill.payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link href={`/billing/payments/${p.id}/receipt`} className="text-primary hover:underline">
                        {p.receiptNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{paymentMethodLabels[p.method]}</TableCell>
                    <TableCell>{formatCurrency(Number(p.amount))}</TableCell>
                    <TableCell>{p.receivedBy?.name ?? "—"}</TableCell>
                    <TableCell>{formatDateTime(p.paidAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {bill.refunds.length > 0 && (
        <Card className="print:hidden">
          <CardContent className="pt-6">
            <p className="text-sm font-medium mb-3">Refunds</p>
            <div className="space-y-2">
              {bill.refunds.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <div>
                    <p>{formatCurrency(Number(r.amount))} — {r.reason}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(r.requestedAt)}</p>
                  </div>
                  <Badge variant="secondary" className={refundStatusColors[r.status]}>{refundStatusLabels[r.status]}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
