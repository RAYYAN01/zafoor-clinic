"use client"

import { useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDateTime, patientDisplayName } from "@/lib/format"
import { refundStatusLabels, refundStatusColors, paymentMethodLabels } from "@/lib/labels"
import { processRefund, type getRefunds } from "@/actions/payments"

type Refunds = Awaited<ReturnType<typeof getRefunds>>

export function RefundsQueue({ refunds }: { refunds: Refunds }) {
  if (refunds.length === 0) {
    return <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No refund requests.</CardContent></Card>
  }

  return (
    <div className="space-y-3">
      {refunds.map((r) => (
        <RefundRow key={r.id} refund={r} />
      ))}
    </div>
  )
}

function RefundRow({ refund }: { refund: Refunds[number] }) {
  const [pending, startTransition] = useTransition()

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 py-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href={`/patients/${refund.patientId}`} className="text-sm font-medium hover:underline">
              {patientDisplayName(refund.patient)}
            </Link>
            {refund.bill && (
              <Link href={`/billing/${refund.bill.id}`} className="text-xs text-primary hover:underline">
                {refund.bill.billNumber}
              </Link>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{refund.reason}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatCurrency(Number(refund.amount))} via {paymentMethodLabels[refund.method]} · {formatDateTime(refund.requestedAt)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="secondary" className={refundStatusColors[refund.status]}>{refundStatusLabels[refund.status]}</Badge>
          {refund.status === "PENDING" && (
            <>
              <Button
                size="sm"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    try {
                      await processRefund(refund.id, "COMPLETE")
                      toast.success("Refund completed")
                    } catch {
                      toast.error("Could not process refund")
                    }
                  })
                }
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    try {
                      await processRefund(refund.id, "REJECT")
                      toast.success("Refund rejected")
                    } catch {
                      toast.error("Could not reject refund")
                    }
                  })
                }
              >
                Reject
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
