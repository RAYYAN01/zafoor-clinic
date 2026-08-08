"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Wallet } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { paymentMethodLabels } from "@/lib/labels"
import { formatCurrency } from "@/lib/format"
import { collectPayment } from "@/actions/payments"
import { getPatientAdvanceBalance } from "@/actions/payments"

export function CollectPaymentDialog({
  billId,
  patientId,
  balanceDue,
}: {
  billId: string
  patientId: string
  balanceDue: number
}) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(String(balanceDue))
  const [method, setMethod] = useState("CASH")
  const [advanceBalance, setAdvanceBalance] = useState<number | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => {
    if (!open) return
    getPatientAdvanceBalance(patientId).then(setAdvanceBalance)
  }, [open, patientId])

  const methodOptions = { ...paymentMethodLabels }
  delete (methodOptions as Record<string, string>).INSURANCE

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button className="gap-1.5" onClick={() => setOpen(true)}>
        <Wallet className="h-3.5 w-3.5" />
        Collect Payment
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Collect Payment</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              try {
                await collectPayment(billId, patientId, {
                  amount: Number(amount),
                  method: method as never,
                  referenceNumber: String(fd.get("referenceNumber") || "") || undefined,
                  gatewayProvider: method === "CARD" || method === "UPI" || method === "NET_BANKING" ? "Simulated Gateway" : undefined,
                })
                toast.success("Payment collected")
                setOpen(false)
                router.refresh()
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not collect payment")
              }
            })
          }}
        >
          <p className="text-sm text-muted-foreground">Outstanding balance: {formatCurrency(balanceDue)}</p>
          <div className="space-y-1.5">
            <Label htmlFor="pay-amount">Amount</Label>
            <Input id="pay-amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Method</Label>
            <Select items={methodOptions} value={method} onValueChange={(v) => setMethod(v ?? "CASH")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(methodOptions).map(([value, label]) => (
                  <SelectItem key={value} value={value} disabled={value === "ADVANCE" && (advanceBalance ?? 0) <= 0}>
                    {label}{value === "ADVANCE" && advanceBalance != null ? ` (${formatCurrency(advanceBalance)} available)` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {method !== "CASH" && method !== "ADVANCE" && (
            <div className="space-y-1.5">
              <Label htmlFor="referenceNumber">Reference number</Label>
              <Input id="referenceNumber" name="referenceNumber" placeholder="Transaction / UTR / gateway ref" />
            </div>
          )}
          {(method === "CARD" || method === "UPI" || method === "NET_BANKING") && (
            <p className="text-xs text-muted-foreground">
              Simulated payment gateway — no real charge is made. Connect a provider (Razorpay, Stripe) to process live payments.
            </p>
          )}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Processing…" : "Confirm Payment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
