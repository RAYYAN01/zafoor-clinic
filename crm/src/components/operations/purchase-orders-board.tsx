"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency, formatDate } from "@/lib/format"
import { purchaseOrderStatusLabels, purchaseOrderStatusColors } from "@/lib/labels"
import { createPurchaseOrder, updatePurchaseOrderStatus, type getPurchaseOrders, type getVendors, type getMedicines } from "@/actions/pharmacy"

type Orders = Awaited<ReturnType<typeof getPurchaseOrders>>
type Vendors = Awaited<ReturnType<typeof getVendors>>
type Medicines = Awaited<ReturnType<typeof getMedicines>>

export function PurchaseOrdersBoard({ orders, vendors, medicines }: { orders: Orders; vendors: Vendors; medicines: Medicines }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="gap-1.5" onClick={() => setOpen(true)} disabled={vendors.length === 0 || medicines.length === 0}>
          <Plus className="h-4 w-4" />
          New Purchase Order
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No purchase orders yet.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {orders.map((po) => (
            <PoRow key={po.id} po={po} />
          ))}
        </div>
      )}

      <NewPoDialog open={open} onOpenChange={setOpen} vendors={vendors} medicines={medicines} />
    </div>
  )
}

function PoRow({ po }: { po: Orders[number] }) {
  const [pending, startTransition] = useTransition()
  const total = po.items.reduce((sum, it) => sum + it.quantity * Number(it.unitCost), 0)

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{po.poNumber}</p>
            <Badge variant="secondary" className={purchaseOrderStatusColors[po.status]}>{purchaseOrderStatusLabels[po.status]}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {po.vendor.name} · {po.items.length} item{po.items.length === 1 ? "" : "s"} · {formatCurrency(total)}
            {po.expectedDate ? ` · Expected ${formatDate(po.expectedDate)}` : ""}
          </p>
        </div>
        {po.status !== "RECEIVED" && po.status !== "CANCELLED" && (
          <Select
            items={purchaseOrderStatusLabels}
            value={po.status}
            onValueChange={(v) => {
              if (!v) return
              startTransition(async () => {
                try {
                  await updatePurchaseOrderStatus(po.id, { status: v as never })
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not update order")
                }
              })
            }}
          >
            <SelectTrigger className="h-8 w-[160px] text-xs shrink-0" disabled={pending}><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(purchaseOrderStatusLabels).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}
            </SelectContent>
          </Select>
        )}
      </CardContent>
    </Card>
  )
}

type PoLine = { medicineId: string; quantity: string; unitCost: string }

function NewPoDialog({ open, onOpenChange, vendors, medicines }: { open: boolean; onOpenChange: (v: boolean) => void; vendors: Vendors; medicines: Medicines }) {
  const [vendorId, setVendorId] = useState(vendors[0]?.id ?? "")
  const [lines, setLines] = useState<PoLine[]>([{ medicineId: "", quantity: "", unitCost: "" }])
  const [pending, startTransition] = useTransition()

  function updateLine(i: number, field: keyof PoLine, value: string) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Purchase Order</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            const validLines = lines.filter((l) => l.medicineId && Number(l.quantity) > 0)
            if (!vendorId) { toast.error("Select a vendor"); return }
            if (validLines.length === 0) { toast.error("Add at least one item"); return }
            startTransition(async () => {
              try {
                await createPurchaseOrder({
                  vendorId,
                  expectedDate: String(fd.get("expectedDate") || "") || undefined,
                  notes: String(fd.get("notes") || "") || undefined,
                  items: validLines.map((l) => ({
                    medicineId: l.medicineId,
                    quantity: Number(l.quantity),
                    unitCost: Number(l.unitCost) || 0,
                  })),
                })
                toast.success("Purchase order created")
                onOpenChange(false)
                setLines([{ medicineId: "", quantity: "", unitCost: "" }])
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not create purchase order")
              }
            })
          }}
        >
          <div className="space-y-1.5">
            <Label>Vendor</Label>
            <Select items={Object.fromEntries(vendors.map((v) => [v.id, v.name]))} value={vendorId} onValueChange={(v) => setVendorId(v ?? "")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{vendors.map((v) => (<SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            {lines.map((line, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto] gap-2 rounded-lg border p-2.5">
                <div className="grid grid-cols-3 gap-2">
                  <Select items={Object.fromEntries(medicines.map((m) => [m.id, m.name]))} value={line.medicineId} onValueChange={(v) => updateLine(i, "medicineId", v ?? "")}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Medicine" /></SelectTrigger>
                    <SelectContent>{medicines.map((m) => (<SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>))}</SelectContent>
                  </Select>
                  <Input className="h-9 text-xs" type="number" placeholder="Qty" value={line.quantity} onChange={(e) => updateLine(i, "quantity", e.target.value)} />
                  <Input className="h-9 text-xs" type="number" placeholder="Unit cost" value={line.unitCost} onChange={(e) => updateLine(i, "unitCost", e.target.value)} />
                </div>
                <Button type="button" size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))} disabled={lines.length === 1}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => setLines((prev) => [...prev, { medicineId: "", quantity: "", unitCost: "" }])}>
              <Plus className="h-3.5 w-3.5" /> Add Item
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="expectedDate">Expected date</Label><Input id="expectedDate" name="expectedDate" type="date" /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="notes">Notes</Label><Textarea id="notes" name="notes" /></div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Creating…" : "Create Purchase Order"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
