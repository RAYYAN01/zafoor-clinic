"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DeleteButton } from "@/components/shared/delete-button"
import { formatDate } from "@/lib/format"
import { equipmentCategoryLabels, equipmentStatusLabels, equipmentStatusColors } from "@/lib/labels"
import { createEquipment, updateEquipmentStatus, deleteEquipment, type getEquipment } from "@/actions/assets"
import type { getVendors } from "@/actions/pharmacy"

type Equipment = Awaited<ReturnType<typeof getEquipment>>
type Vendors = Awaited<ReturnType<typeof getVendors>>

export function EquipmentBoard({ equipment, vendors }: { equipment: Equipment; vendors: Vendors }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Asset
        </Button>
      </div>

      {equipment.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No assets registered yet.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {equipment.map((eq) => (
            <EquipmentRow key={eq.id} eq={eq} />
          ))}
        </div>
      )}

      <AddEquipmentDialog open={open} onOpenChange={setOpen} vendors={vendors} />
    </div>
  )
}

function EquipmentRow({ eq }: { eq: Equipment[number] }) {
  const [pending, startTransition] = useTransition()

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium">{eq.name}</p>
            <span className="text-xs text-muted-foreground">{eq.assetCode}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {equipmentCategoryLabels[eq.category]}
            {eq.department ? ` · ${eq.department}` : ""}
            {eq.location ? ` · ${eq.location}` : ""}
            {eq.nextServiceDue ? ` · Next service ${formatDate(eq.nextServiceDue)}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Select
            items={equipmentStatusLabels}
            value={eq.status}
            onValueChange={(v) => {
              if (!v) return
              startTransition(async () => {
                try {
                  await updateEquipmentStatus(eq.id, { status: v as never })
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not update asset")
                }
              })
            }}
          >
            <SelectTrigger className="h-7 w-[160px] text-xs" disabled={pending}>
              <SelectValue>
                <Badge variant="secondary" className={equipmentStatusColors[eq.status]}>{equipmentStatusLabels[eq.status]}</Badge>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(equipmentStatusLabels).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}
            </SelectContent>
          </Select>
          <DeleteButton onDelete={() => deleteEquipment(eq.id)} />
        </div>
      </CardContent>
    </Card>
  )
}

function AddEquipmentDialog({ open, onOpenChange, vendors }: { open: boolean; onOpenChange: (v: boolean) => void; vendors: Vendors }) {
  const [category, setCategory] = useState("BIOMEDICAL")
  const [vendorId, setVendorId] = useState("")
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Asset</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              try {
                await createEquipment({
                  name: String(fd.get("name") || ""),
                  category: category as never,
                  department: String(fd.get("department") || "") || undefined,
                  location: String(fd.get("location") || "") || undefined,
                  vendorId: vendorId || undefined,
                  purchaseDate: String(fd.get("purchaseDate") || "") || undefined,
                  warrantyExpiry: String(fd.get("warrantyExpiry") || "") || undefined,
                  nextServiceDue: String(fd.get("nextServiceDue") || "") || undefined,
                  notes: String(fd.get("notes") || "") || undefined,
                })
                toast.success("Asset added")
                onOpenChange(false)
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not add asset")
              }
            })
          }}
        >
          <div className="space-y-1.5"><Label htmlFor="name">Asset name</Label><Input id="name" name="name" required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select items={equipmentCategoryLabels} value={category} onValueChange={(v) => setCategory(v ?? "BIOMEDICAL")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(equipmentCategoryLabels).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="department">Department</Label><Input id="department" name="department" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="location">Location</Label><Input id="location" name="location" /></div>
            <div className="space-y-1.5">
              <Label>Vendor</Label>
              <Select items={{ NONE: "None", ...Object.fromEntries(vendors.map((v) => [v.id, v.name])) }} value={vendorId || "NONE"} onValueChange={(v) => setVendorId(v === "NONE" ? "" : v ?? "")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">None</SelectItem>
                  {vendors.map((v) => (<SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label htmlFor="purchaseDate">Purchased</Label><Input id="purchaseDate" name="purchaseDate" type="date" /></div>
            <div className="space-y-1.5"><Label htmlFor="warrantyExpiry">Warranty till</Label><Input id="warrantyExpiry" name="warrantyExpiry" type="date" /></div>
            <div className="space-y-1.5"><Label htmlFor="nextServiceDue">Next service</Label><Input id="nextServiceDue" name="nextServiceDue" type="date" /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="notes">Notes</Label><Textarea id="notes" name="notes" /></div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Add Asset"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
