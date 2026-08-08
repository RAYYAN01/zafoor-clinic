"use client"

import Link from "next/link"
import { Printer } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDateTime, patientDisplayName } from "@/lib/format"
import { paymentMethodLabels } from "@/lib/labels"
import { HOSPITAL_INFO } from "@/lib/hospital-info"
import type { getReceipt } from "@/actions/payments"

type Payment = NonNullable<Awaited<ReturnType<typeof getReceipt>>>

export function ReceiptView({ payment }: { payment: Payment }) {
  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="flex items-center justify-between print:hidden">
        {payment.billId ? (
          <Link href={`/billing/${payment.billId}`} className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to bill
          </Link>
        ) : <span />}
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
          <Printer className="h-3.5 w-3.5" />
          Print
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4 text-sm">
          <div className="text-center">
            <p className="font-semibold">{HOSPITAL_INFO.name}</p>
            <p className="text-xs text-muted-foreground">{HOSPITAL_INFO.address}</p>
            <p className="text-xs text-muted-foreground">GSTIN: {HOSPITAL_INFO.gstin}</p>
          </div>
          <div className="text-center border-y py-2">
            <p className="font-medium">PAYMENT RECEIPT</p>
            <p className="text-xs text-muted-foreground">{payment.receiptNumber}</p>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between"><span className="text-muted-foreground">Patient</span><span>{patientDisplayName(payment.patient)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">UHID</span><span>{payment.patient.uhid}</span></div>
            {payment.bill && (
              <div className="flex justify-between"><span className="text-muted-foreground">Bill #</span><span>{payment.bill.billNumber}</span></div>
            )}
            <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{formatDateTime(payment.paidAt)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Method</span><span>{paymentMethodLabels[payment.method]}</span></div>
            {payment.referenceNumber && (
              <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span>{payment.referenceNumber}</span></div>
            )}
            {payment.receivedBy && (
              <div className="flex justify-between"><span className="text-muted-foreground">Received by</span><span>{payment.receivedBy.name}</span></div>
            )}
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold text-base">
            <span>Amount Paid</span>
            <span>{formatCurrency(Number(payment.amount))}</span>
          </div>
          <p className="text-center text-xs text-muted-foreground pt-2">This is a computer-generated receipt.</p>
        </CardContent>
      </Card>
    </div>
  )
}
