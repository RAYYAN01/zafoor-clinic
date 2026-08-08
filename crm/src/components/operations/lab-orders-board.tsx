"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Plus, Barcode } from "lucide-react"
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
  labOrderStatusLabels,
  labOrderStatusColors,
  sampleStatusLabels,
  sampleStatusColors,
  sampleTypeLabels,
  orderPriorityLabels,
  orderPriorityColors,
} from "@/lib/labels"
import { createLabOrder, updateLabOrderStatus, updateSampleStatus, type getLabOrders } from "@/actions/lab"

type Orders = Awaited<ReturnType<typeof getLabOrders>>
type Doctors = { id: string; name: string }[]

export function LabOrdersBoard({ orders, doctors }: { orders: Orders; doctors: Doctors }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          New Lab Order
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No lab orders yet.</CardContent></Card>
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
  const [orderPending, startOrderTransition] = useTransition()
  const [samplePending, startSampleTransition] = useTransition()

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium">{order.testName}</p>
            <Badge variant="secondary" className={orderPriorityColors[order.priority]}>{orderPriorityLabels[order.priority]}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {order.orderNumber} · <Link href={`/patients/${order.patientId}`} className="hover:underline">{patientDisplayName(order.patient)}</Link>
            {order.doctor ? ` · Dr. ${order.doctor.name}` : ""} · {formatRelative(order.orderedAt)}
          </p>
          {order.sample && (
            <p className="text-xs text-muted-foreground/80 mt-0.5 flex items-center gap-1">
              <Barcode className="h-3 w-3" /> {order.sample.barcode} · {sampleTypeLabels[order.sample.type]}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {order.sample && order.status !== "RESULTED" && order.status !== "CANCELLED" && (
            <Select
              items={sampleStatusLabels}
              value={order.sample.status}
              onValueChange={(v) => {
                if (!v) return
                startSampleTransition(async () => {
                  try {
                    await updateSampleStatus(order.sample!.id, { status: v as never })
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Could not update sample")
                  }
                })
              }}
            >
              <SelectTrigger className="h-7 w-[150px] text-xs" disabled={samplePending}>
                <SelectValue>
                  <Badge variant="secondary" className={sampleStatusColors[order.sample.status]}>{sampleStatusLabels[order.sample.status]}</Badge>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(sampleStatusLabels).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}
              </SelectContent>
            </Select>
          )}
          <Select
            items={labOrderStatusLabels}
            value={order.status}
            onValueChange={(v) => {
              if (!v) return
              startOrderTransition(async () => {
                try {
                  await updateLabOrderStatus(order.id, { status: v as never })
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not update order")
                }
              })
            }}
          >
            <SelectTrigger className="h-7 w-[150px] text-xs" disabled={orderPending}>
              <SelectValue>
                <Badge variant="secondary" className={labOrderStatusColors[order.status]}>{labOrderStatusLabels[order.status]}</Badge>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(labOrderStatusLabels).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}

function NewOrderDialog({ open, onOpenChange, doctors }: { open: boolean; onOpenChange: (v: boolean) => void; doctors: Doctors }) {
  const [patientId, setPatientId] = useState("")
  const [doctorId, setDoctorId] = useState("")
  const [priority, setPriority] = useState("ROUTINE")
  const [sampleType, setSampleType] = useState("BLOOD")
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Lab Order</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            if (!patientId) { toast.error("Select a patient"); return }
            startTransition(async () => {
              try {
                await createLabOrder({
                  patientId,
                  doctorId: doctorId || undefined,
                  testName: String(fd.get("testName") || ""),
                  priority: priority as never,
                  sampleType: sampleType as never,
                })
                toast.success("Lab order created")
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
          <div className="space-y-1.5"><Label htmlFor="testName">Test name</Label><Input id="testName" name="testName" required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select items={orderPriorityLabels} value={priority} onValueChange={(v) => setPriority(v ?? "ROUTINE")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(orderPriorityLabels).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sample type</Label>
              <Select items={sampleTypeLabels} value={sampleType} onValueChange={(v) => setSampleType(v ?? "BLOOD")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(sampleTypeLabels).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
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
