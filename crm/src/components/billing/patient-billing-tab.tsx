"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EntityDialog } from "@/components/shared/entity-dialog"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format"
import { billTypeLabels, billStatusLabels, billStatusColors, refundStatusLabels, refundStatusColors, paymentMethodLabels } from "@/lib/labels"
import { addAdvance } from "@/actions/payments"
import type { getPatientBillingSummary } from "@/actions/billing"

type Summary = Awaited<ReturnType<typeof getPatientBillingSummary>>

export function PatientBillingTab({ patientId, summary }: { patientId: string; summary: Summary }) {
  const totalAdvanceBalance = summary.advances.reduce((sum, a) => sum + Number(a.balance), 0)

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground uppercase">Bills</p><p className="text-lg font-semibold mt-1">{summary.bills.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground uppercase">Outstanding</p><p className="text-lg font-semibold mt-1 text-red-600">{formatCurrency(summary.bills.reduce((sum, b) => sum + Number(b.balanceDue), 0))}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground uppercase">Advance Balance</p><p className="text-lg font-semibold mt-1 text-emerald-700">{formatCurrency(totalAdvanceBalance)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Bills</CardTitle>
          <Button
            size="sm"
            className="gap-1.5"
            nativeButton={false}
            render={<Link href={`/billing/new?patientId=${patientId}`}><Plus className="h-3.5 w-3.5" />New Bill</Link>}
          />
        </CardHeader>
        <CardContent className="space-y-2">
          {summary.bills.length === 0 && <p className="text-sm text-muted-foreground">No bills yet.</p>}
          {summary.bills.map((bill) => (
            <Link key={bill.id} href={`/billing/${bill.id}`} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted transition-colors">
              <div>
                <p className="text-sm font-medium">{bill.billNumber}</p>
                <p className="text-xs text-muted-foreground">{billTypeLabels[bill.type]} · {formatDate(bill.issuedAt)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{formatCurrency(Number(bill.netAmount))}</p>
                <Badge variant="secondary" className={billStatusColors[bill.status]}>{billStatusLabels[bill.status]}</Badge>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Advance Payments</CardTitle>
          <EntityDialog title="Add Advance Payment">
            {(close) => <AddAdvanceForm patientId={patientId} onDone={close} />}
          </EntityDialog>
        </CardHeader>
        <CardContent className="space-y-2">
          {summary.advances.length === 0 && <p className="text-sm text-muted-foreground">No advance payments recorded.</p>}
          {summary.advances.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{formatCurrency(Number(a.amount))} via {paymentMethodLabels[a.method]}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(a.paidAt)}</p>
              </div>
              <Badge variant={Number(a.balance) > 0 ? "default" : "secondary"}>
                {formatCurrency(Number(a.balance))} available
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {summary.refunds.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Refunds</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {summary.refunds.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm">{formatCurrency(Number(r.amount))} — {r.reason}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(r.requestedAt)}</p>
                </div>
                <Badge variant="secondary" className={refundStatusColors[r.status]}>{refundStatusLabels[r.status]}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function AddAdvanceForm({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const [method, setMethod] = useState("CASH")
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        startTransition(async () => {
          try {
            await addAdvance(patientId, {
              amount: Number(fd.get("amount") || 0),
              method,
              referenceNumber: String(fd.get("referenceNumber") || "") || undefined,
              notes: String(fd.get("notes") || "") || undefined,
            })
            toast.success("Advance payment recorded")
            onDone()
            router.refresh()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not record advance")
          }
        })
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="adv-amount">Amount</Label>
        <Input id="adv-amount" name="amount" type="number" required />
      </div>
      <div className="space-y-1.5">
        <Label>Method</Label>
        <Select
          items={{ CASH: paymentMethodLabels.CASH, CARD: paymentMethodLabels.CARD, UPI: paymentMethodLabels.UPI, NET_BANKING: paymentMethodLabels.NET_BANKING, WALLET: paymentMethodLabels.WALLET }}
          value={method}
          onValueChange={(v) => setMethod(v ?? "CASH")}
        >
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="CASH">{paymentMethodLabels.CASH}</SelectItem>
            <SelectItem value="CARD">{paymentMethodLabels.CARD}</SelectItem>
            <SelectItem value="UPI">{paymentMethodLabels.UPI}</SelectItem>
            <SelectItem value="NET_BANKING">{paymentMethodLabels.NET_BANKING}</SelectItem>
            <SelectItem value="WALLET">{paymentMethodLabels.WALLET}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="adv-ref">Reference number</Label>
        <Input id="adv-ref" name="referenceNumber" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="adv-notes">Notes</Label>
        <Textarea id="adv-notes" name="notes" />
      </div>
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Record Advance"}</Button>
    </form>
  )
}
