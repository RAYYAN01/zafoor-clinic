"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus } from "lucide-react"
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
import { expenseCategoryLabels, paymentMethodLabels } from "@/lib/labels"
import { addExpense } from "@/actions/finance"

export function AddExpenseDialog() {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState("OTHER")
  const [method, setMethod] = useState("CASH")
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const methodOptions = { CASH: paymentMethodLabels.CASH, CARD: paymentMethodLabels.CARD, UPI: paymentMethodLabels.UPI, NET_BANKING: paymentMethodLabels.NET_BANKING }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add Expense
      </Button>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              try {
                await addExpense({
                  category: category as never,
                  description: String(fd.get("description") || ""),
                  amount: Number(fd.get("amount") || 0),
                  expenseDate: String(fd.get("expenseDate") || "") || undefined,
                  paidTo: String(fd.get("paidTo") || "") || undefined,
                  method: method as never,
                  referenceNumber: String(fd.get("referenceNumber") || "") || undefined,
                })
                toast.success("Expense recorded")
                setOpen(false)
                router.refresh()
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not add expense")
              }
            })
          }}
        >
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select items={expenseCategoryLabels} value={category} onValueChange={(v) => setCategory(v ?? "OTHER")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(expenseCategoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="exp-description">Description</Label>
            <Input id="exp-description" name="description" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="exp-amount">Amount</Label>
              <Input id="exp-amount" name="amount" type="number" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-date">Date</Label>
              <Input id="exp-date" name="expenseDate" type="date" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="exp-paidTo">Paid to</Label>
            <Input id="exp-paidTo" name="paidTo" placeholder="Vendor / payee" />
          </div>
          <div className="space-y-1.5">
            <Label>Method</Label>
            <Select items={methodOptions} value={method} onValueChange={(v) => setMethod(v ?? "CASH")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(methodOptions).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="exp-ref">Reference number</Label>
            <Input id="exp-ref" name="referenceNumber" />
          </div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Add Expense"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
