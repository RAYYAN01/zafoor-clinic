"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PatientPicker } from "@/components/appointments/patient-picker"
import { formatDate, formatCurrency } from "@/lib/format"
import { medicineUnitLabels } from "@/lib/labels"
import { createMedicine, addMedicineBatch, dispenseMedicines, type getMedicines } from "@/actions/pharmacy"

type Medicines = Awaited<ReturnType<typeof getMedicines>>

export function MedicinesBoard({ medicines }: { medicines: Medicines }) {
  const [addMedOpen, setAddMedOpen] = useState(false)
  const [addBatchOpen, setAddBatchOpen] = useState(false)
  const [dispenseOpen, setDispenseOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" className="gap-1.5" onClick={() => setAddMedOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Medicine
        </Button>
        <Button variant="outline" className="gap-1.5" onClick={() => setAddBatchOpen(true)} disabled={medicines.length === 0}>
          <Plus className="h-4 w-4" />
          Receive Stock
        </Button>
        <Button className="gap-1.5" onClick={() => setDispenseOpen(true)} disabled={medicines.length === 0}>
          <Plus className="h-4 w-4" />
          Dispense
        </Button>
      </div>

      {medicines.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No medicines added yet.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {medicines.map((m) => (
            <Card key={m.id}>
              <CardContent className="py-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{m.name}</p>
                      {m.lowStock && <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Low Stock</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {m.genericName ? `${m.genericName} · ` : ""}{medicineUnitLabels[m.unit]}
                      {m.category ? ` · ${m.category}` : ""} · Reorder level {m.reorderLevel}
                    </p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">{m.totalStock} in stock</p>
                </div>
                {m.batches.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {m.batches.map((b) => (
                      <span key={b.id} className="text-xs rounded-md bg-muted px-2 py-1 text-muted-foreground">
                        {b.batchNumber} · {b.quantity} units · exp {formatDate(b.expiryDate)} · {formatCurrency(Number(b.mrp))}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddMedicineDialog open={addMedOpen} onOpenChange={setAddMedOpen} />
      <AddBatchDialog open={addBatchOpen} onOpenChange={setAddBatchOpen} medicines={medicines} />
      <DispenseDialog open={dispenseOpen} onOpenChange={setDispenseOpen} medicines={medicines} />
    </div>
  )
}

function AddMedicineDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [unit, setUnit] = useState("TABLET")
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Medicine</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              try {
                await createMedicine({
                  name: String(fd.get("name") || ""),
                  genericName: String(fd.get("genericName") || "") || undefined,
                  category: String(fd.get("category") || "") || undefined,
                  unit: unit as never,
                  hsnCode: String(fd.get("hsnCode") || "") || undefined,
                  reorderLevel: fd.get("reorderLevel") ? Number(fd.get("reorderLevel")) : 10,
                })
                toast.success("Medicine added")
                onOpenChange(false)
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not add medicine")
              }
            })
          }}
        >
          <div className="space-y-1.5"><Label htmlFor="name">Name</Label><Input id="name" name="name" required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="genericName">Generic name</Label><Input id="genericName" name="genericName" /></div>
            <div className="space-y-1.5"><Label htmlFor="category">Category</Label><Input id="category" name="category" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Select items={medicineUnitLabels} value={unit} onValueChange={(v) => setUnit(v ?? "TABLET")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(medicineUnitLabels).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="reorderLevel">Reorder level</Label><Input id="reorderLevel" name="reorderLevel" type="number" defaultValue={10} /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="hsnCode">HSN code</Label><Input id="hsnCode" name="hsnCode" /></div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Add Medicine"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AddBatchDialog({ open, onOpenChange, medicines }: { open: boolean; onOpenChange: (v: boolean) => void; medicines: Medicines }) {
  const [medicineId, setMedicineId] = useState(medicines[0]?.id ?? "")
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Receive Stock</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            if (!medicineId) { toast.error("Select a medicine"); return }
            startTransition(async () => {
              try {
                await addMedicineBatch({
                  medicineId,
                  batchNumber: String(fd.get("batchNumber") || ""),
                  expiryDate: String(fd.get("expiryDate") || ""),
                  quantity: Number(fd.get("quantity") || 0),
                  mrp: Number(fd.get("mrp") || 0),
                  purchasePrice: fd.get("purchasePrice") ? Number(fd.get("purchasePrice")) : undefined,
                })
                toast.success("Stock received")
                onOpenChange(false)
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not receive stock")
              }
            })
          }}
        >
          <div className="space-y-1.5">
            <Label>Medicine</Label>
            <Select items={Object.fromEntries(medicines.map((m) => [m.id, m.name]))} value={medicineId} onValueChange={(v) => setMedicineId(v ?? "")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{medicines.map((m) => (<SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label htmlFor="batchNumber">Batch number</Label><Input id="batchNumber" name="batchNumber" required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="quantity">Quantity</Label><Input id="quantity" name="quantity" type="number" required /></div>
            <div className="space-y-1.5"><Label htmlFor="expiryDate">Expiry date</Label><Input id="expiryDate" name="expiryDate" type="date" required /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="mrp">MRP</Label><Input id="mrp" name="mrp" type="number" required /></div>
            <div className="space-y-1.5"><Label htmlFor="purchasePrice">Purchase price</Label><Input id="purchasePrice" name="purchasePrice" type="number" /></div>
          </div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Receive Stock"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

type DispenseLine = { medicineId: string; batchId: string; quantity: string; unitPrice: string }

function DispenseDialog({ open, onOpenChange, medicines }: { open: boolean; onOpenChange: (v: boolean) => void; medicines: Medicines }) {
  const [patientId, setPatientId] = useState("")
  const [lines, setLines] = useState<DispenseLine[]>([{ medicineId: "", batchId: "", quantity: "1", unitPrice: "" }])
  const [pending, startTransition] = useTransition()

  function updateLine(i: number, field: keyof DispenseLine, value: string) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Dispense Medicines</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (!patientId) { toast.error("Select a patient"); return }
            const validLines = lines.filter((l) => l.medicineId && l.batchId && Number(l.quantity) > 0)
            if (validLines.length === 0) { toast.error("Add at least one item"); return }
            startTransition(async () => {
              try {
                await dispenseMedicines({
                  patientId,
                  items: validLines.map((l) => ({
                    medicineId: l.medicineId,
                    batchId: l.batchId,
                    quantity: Number(l.quantity),
                    unitPrice: Number(l.unitPrice) || 0,
                  })),
                })
                toast.success("Medicines dispensed")
                onOpenChange(false)
                setPatientId("")
                setLines([{ medicineId: "", batchId: "", quantity: "1", unitPrice: "" }])
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not dispense")
              }
            })
          }}
        >
          <div className="space-y-1.5">
            <Label>Patient</Label>
            <PatientPicker value={patientId} onChange={setPatientId} />
          </div>
          <div className="space-y-2">
            {lines.map((line, i) => {
              const medicine = medicines.find((m) => m.id === line.medicineId)
              const batches = medicine?.batches.filter((b) => b.quantity > 0) ?? []
              return (
                <div key={i} className="grid grid-cols-[1fr_auto] gap-2 rounded-lg border p-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      items={Object.fromEntries(medicines.map((m) => [m.id, m.name]))}
                      value={line.medicineId}
                      onValueChange={(v) => { updateLine(i, "medicineId", v ?? ""); updateLine(i, "batchId", "") }}
                    >
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Medicine" /></SelectTrigger>
                      <SelectContent>{medicines.map((m) => (<SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>))}</SelectContent>
                    </Select>
                    <Select
                      items={Object.fromEntries(batches.map((b) => [b.id, `${b.batchNumber} (${b.quantity})`]))}
                      value={line.batchId}
                      onValueChange={(v) => updateLine(i, "batchId", v ?? "")}
                    >
                      <SelectTrigger className="h-9 text-xs" disabled={!medicine}><SelectValue placeholder="Batch" /></SelectTrigger>
                      <SelectContent>{batches.map((b) => (<SelectItem key={b.id} value={b.id}>{b.batchNumber} ({b.quantity})</SelectItem>))}</SelectContent>
                    </Select>
                    <Input className="h-9 text-xs" type="number" placeholder="Qty" value={line.quantity} onChange={(e) => updateLine(i, "quantity", e.target.value)} />
                    <Input className="h-9 text-xs" type="number" placeholder="Unit price" value={line.unitPrice} onChange={(e) => updateLine(i, "unitPrice", e.target.value)} />
                  </div>
                  <Button type="button" size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))} disabled={lines.length === 1}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
            <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => setLines((prev) => [...prev, { medicineId: "", batchId: "", quantity: "1", unitPrice: "" }])}>
              <Plus className="h-3.5 w-3.5" /> Add Item
            </Button>
          </div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Dispensing…" : "Dispense"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
