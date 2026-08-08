"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Plus, ImagePlus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PatientPicker } from "@/components/appointments/patient-picker"
import { patientDisplayName, formatRelative } from "@/lib/format"
import {
  radiologyModalityLabels,
  radiologyOrderStatusLabels,
  radiologyOrderStatusColors,
  orderPriorityLabels,
  orderPriorityColors,
} from "@/lib/labels"
import { createRadiologyOrder, updateRadiologyOrderStatus, addPacsImage, type getRadiologyOrders } from "@/actions/radiology"

type Orders = Awaited<ReturnType<typeof getRadiologyOrders>>
type Doctors = { id: string; name: string }[]

export function RadiologyBoard({ orders, doctors }: { orders: Orders; doctors: Doctors }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          New Radiology Order
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No radiology orders yet.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {orders.map((o) => (
            <OrderRow key={o.id} order={o} />
          ))}
        </div>
      )}

      <NewOrderDialog open={open} onOpenChange={setOpen} doctors={doctors} />
    </div>
  )
}

function OrderRow({ order }: { order: Orders[number] }) {
  const [pending, startTransition] = useTransition()
  const [imageOpen, setImageOpen] = useState(false)

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium">{radiologyModalityLabels[order.modality]} — {order.bodyPart}</p>
            <Badge variant="secondary" className={orderPriorityColors[order.priority]}>{orderPriorityLabels[order.priority]}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {order.orderNumber} · <Link href={`/patients/${order.patientId}`} className="hover:underline">{patientDisplayName(order.patient)}</Link>
            {order.doctor ? ` · Dr. ${order.doctor.name}` : ""} · {formatRelative(order.orderedAt)}
            {order.images.length > 0 ? ` · ${order.images.length} image${order.images.length === 1 ? "" : "s"}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => setImageOpen(true)}>
            <ImagePlus className="h-3.5 w-3.5" /> PACS
          </Button>
          <Select
            items={radiologyOrderStatusLabels}
            value={order.status}
            onValueChange={(v) => {
              if (!v) return
              startTransition(async () => {
                try {
                  await updateRadiologyOrderStatus(order.id, { status: v as never })
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not update order")
                }
              })
            }}
          >
            <SelectTrigger className="h-7 w-[150px] text-xs" disabled={pending}>
              <SelectValue>
                <Badge variant="secondary" className={radiologyOrderStatusColors[order.status]}>{radiologyOrderStatusLabels[order.status]}</Badge>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(radiologyOrderStatusLabels).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <AddImageDialog open={imageOpen} onOpenChange={setImageOpen} orderId={order.id} images={order.images} />
    </Card>
  )
}

function AddImageDialog({
  open,
  onOpenChange,
  orderId,
  images,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  orderId: string
  images: Orders[number]["images"]
}) {
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>PACS Images</DialogTitle></DialogHeader>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {images.length === 0 && <p className="text-sm text-muted-foreground">No images attached yet.</p>}
          {images.map((img) => (
            <a key={img.id} href={img.imageUrl} target="_blank" rel="noreferrer" className="block truncate text-xs text-primary hover:underline">
              {img.seriesDescription || img.imageUrl}
            </a>
          ))}
        </div>
        <form
          className="space-y-3 pt-2 border-t"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              try {
                await addPacsImage(orderId, {
                  imageUrl: String(fd.get("imageUrl") || ""),
                  seriesDescription: String(fd.get("seriesDescription") || "") || undefined,
                })
                toast.success("Image attached")
                ;(e.target as HTMLFormElement).reset()
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not attach image")
              }
            })
          }}
        >
          <div className="space-y-1.5"><Label htmlFor="imageUrl">Image URL</Label><Input id="imageUrl" name="imageUrl" required /></div>
          <div className="space-y-1.5"><Label htmlFor="seriesDescription">Series description</Label><Input id="seriesDescription" name="seriesDescription" /></div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Attaching…" : "Attach Image"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function NewOrderDialog({ open, onOpenChange, doctors }: { open: boolean; onOpenChange: (v: boolean) => void; doctors: Doctors }) {
  const [patientId, setPatientId] = useState("")
  const [doctorId, setDoctorId] = useState("")
  const [modality, setModality] = useState("XRAY")
  const [priority, setPriority] = useState("ROUTINE")
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Radiology Order</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            if (!patientId) { toast.error("Select a patient"); return }
            startTransition(async () => {
              try {
                await createRadiologyOrder({
                  patientId,
                  doctorId: doctorId || undefined,
                  modality: modality as never,
                  bodyPart: String(fd.get("bodyPart") || ""),
                  priority: priority as never,
                })
                toast.success("Radiology order created")
                onOpenChange(false)
                setPatientId("")
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not create order")
              }
            })
          }}
        >
          <div className="space-y-1.5">
            <Label>Patient</Label>
            <PatientPicker value={patientId} onChange={setPatientId} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Modality</Label>
              <Select items={radiologyModalityLabels} value={modality} onValueChange={(v) => setModality(v ?? "XRAY")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(radiologyModalityLabels).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="bodyPart">Body part / region</Label><Input id="bodyPart" name="bodyPart" required /></div>
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select items={orderPriorityLabels} value={priority} onValueChange={(v) => setPriority(v ?? "ROUTINE")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(orderPriorityLabels).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Ordering doctor</Label>
            <Select items={{ NONE: "None", ...Object.fromEntries(doctors.map((d) => [d.id, d.name])) }} value={doctorId || "NONE"} onValueChange={(v) => setDoctorId(v === "NONE" ? "" : v ?? "")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">None</SelectItem>
                {doctors.map((d) => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Creating…" : "Create Order"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
