"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Undo2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { paymentMethodLabels } from "@/lib/labels"
import { requestRefund } from "@/actions/payments"

export function RequestRefundDialog({
  patientId,
  billId,
  paymentId,
  maxAmount,
}: {
  patientId: string
  billId?: string
  paymentId?: string
  maxAmount: number
}) {
  const [open, setOpen] = useState(false)
  const [method, setMethod] = useState("CASH")
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  if (maxAmount <= 0) return null

  const methodOptions = { ...paymentMethodLabels }
  delete (methodOptions as Record<string, string>).ADVANCE

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" className="gap-1.5" onClick={() => setOpen(true)}>
        <Undo2 className="h-3.5 w-3.5" />
        Request Refund
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Refund</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            const amount = Number(fd.get("amount"))
            if (amount > maxAmount) {
              toast.error(`Amount exceeds paid amount of ₹${maxAmount.toFixed(2)}`)
              return
            }
            startTransition(async () => {
              try {
                await requestRefund(
                  patientId,
                  { amount, reason: String(fd.get("reason") || ""), method: method as never },
                  billId,
                  paymentId
                )
                toast.success("Refund requested")
                setOpen(false)
                router.refresh()
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not request refund")
              }
            })
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="refund-amount">Amount (max {maxAmount.toFixed(2)})</Label>
            <Input id="refund-amount" name="amount" type="number" max={maxAmount} required defaultValue={maxAmount} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="refund-reason">Reason</Label>
            <Textarea id="refund-reason" name="reason" required />
          </div>
          <div className="space-y-1.5">
            <Label>Refund method</Label>
            <Select items={methodOptions} value={method} onValueChange={(v) => setMethod(v ?? "CASH")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(methodOptions).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Submitting…" : "Submit Refund Request"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
