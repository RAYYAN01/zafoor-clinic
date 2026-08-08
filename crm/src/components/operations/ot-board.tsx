"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PatientPicker } from "@/components/appointments/patient-picker"
import { patientDisplayName, formatDateTime } from "@/lib/format"
import { otStatusLabels, otStatusColors, surgeryStatusLabels, surgeryStatusColors } from "@/lib/labels"
import {
  createTheatre,
  updateTheatreStatus,
  scheduleSurgery,
  updateSurgeryStatus,
  type getTheatres,
  type getSurgeries,
} from "@/actions/ot"

type Theatres = Awaited<ReturnType<typeof getTheatres>>
type Surgeries = Awaited<ReturnType<typeof getSurgeries>>
type Doctors = { id: string; name: string }[]

export function OtBoard({ theatres, surgeries, doctors }: { theatres: Theatres; surgeries: Surgeries; doctors: Doctors }) {
  const [addTheatreOpen, setAddTheatreOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <Button variant="outline" className="gap-1.5" onClick={() => setAddTheatreOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Theatre
        </Button>
        <Button className="gap-1.5" onClick={() => setScheduleOpen(true)} disabled={theatres.length === 0}>
          <Plus className="h-4 w-4" />
          Schedule Surgery
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {theatres.map((ot) => (
          <TheatreCard key={ot.id} ot={ot} />
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Surgery Schedule</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {surgeries.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No surgeries scheduled.</p>}
          {surgeries.map((s) => (
            <SurgeryRow key={s.id} surgery={s} />
          ))}
        </CardContent>
      </Card>

      <AddTheatreDialog open={addTheatreOpen} onOpenChange={setAddTheatreOpen} />
      <ScheduleSurgeryDialog open={scheduleOpen} onOpenChange={setScheduleOpen} theatres={theatres} doctors={doctors} />
    </div>
  )
}

function TheatreCard({ ot }: { ot: Theatres[number] }) {
  const [pending, startTransition] = useTransition()
  const current = ot.surgeries[0]

  return (
    <Card>
      <CardContent className="py-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{ot.name}</p>
          <Select
            items={otStatusLabels}
            value={ot.status}
            onValueChange={(v) => {
              if (!v) return
              startTransition(async () => {
                try {
                  await updateTheatreStatus(ot.id, { status: v as never })
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not update theatre")
                }
              })
            }}
          >
            <SelectTrigger className="h-6 w-fit border-none px-0 text-xs shadow-none" disabled={pending}>
              <SelectValue>
                <Badge variant="secondary" className={otStatusColors[ot.status]}>{otStatusLabels[ot.status]}</Badge>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(otStatusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {ot.location && <p className="text-xs text-muted-foreground">{ot.location}</p>}
        {current && (
          <p className="text-xs text-muted-foreground truncate">
            {current.procedureName} — {patientDisplayName(current.patient)}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function SurgeryRow({ surgery }: { surgery: Surgeries[number] }) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{surgery.procedureName}</p>
          <Badge variant="secondary" className={surgeryStatusColors[surgery.status]}>{surgeryStatusLabels[surgery.status]}</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          <Link href={`/patients/${surgery.patientId}`} className="hover:underline">{patientDisplayName(surgery.patient)}</Link>
          {" · "}Dr. {surgery.surgeon.name} · {surgery.ot.name} · {formatDateTime(surgery.scheduledStart)}
        </p>
      </div>
      <Select
        items={surgeryStatusLabels}
        value={surgery.status}
        onValueChange={(v) => {
          if (!v) return
          startTransition(async () => {
            try {
              await updateSurgeryStatus(surgery.id, { status: v as never })
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Could not update surgery")
            }
          })
        }}
      >
        <SelectTrigger className="h-8 w-[140px] text-xs shrink-0" disabled={pending}><SelectValue /></SelectTrigger>
        <SelectContent>
          {Object.entries(surgeryStatusLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function AddTheatreDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Operation Theatre</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              try {
                await createTheatre({
                  name: String(fd.get("name") || ""),
                  location: String(fd.get("location") || "") || undefined,
                })
                toast.success("Theatre added")
                onOpenChange(false)
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not add theatre")
              }
            })
          }}
        >
          <div className="space-y-1.5"><Label htmlFor="ot-name">Theatre name</Label><Input id="ot-name" name="name" required /></div>
          <div className="space-y-1.5"><Label htmlFor="ot-location">Location</Label><Input id="ot-location" name="location" /></div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Add Theatre"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ScheduleSurgeryDialog({
  open,
  onOpenChange,
  theatres,
  doctors,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  theatres: Theatres
  doctors: Doctors
}) {
  const [patientId, setPatientId] = useState("")
  const [otId, setOtId] = useState(theatres[0]?.id ?? "")
  const [surgeonId, setSurgeonId] = useState(doctors[0]?.id ?? "")
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Schedule Surgery</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            if (!patientId) { toast.error("Select a patient"); return }
            startTransition(async () => {
              try {
                await scheduleSurgery({
                  otId,
                  patientId,
                  surgeonId,
                  procedureName: String(fd.get("procedureName") || ""),
                  anesthesiaType: String(fd.get("anesthesiaType") || "") || undefined,
                  scheduledStart: String(fd.get("scheduledStart") || ""),
                  scheduledEnd: String(fd.get("scheduledEnd") || ""),
                  notes: String(fd.get("notes") || "") || undefined,
                })
                toast.success("Surgery scheduled")
                onOpenChange(false)
                setPatientId("")
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not schedule surgery")
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
              <Label>Theatre</Label>
              <Select items={Object.fromEntries(theatres.map((o) => [o.id, o.name]))} value={otId} onValueChange={(v) => setOtId(v ?? "")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {theatres.map((o) => (<SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Surgeon</Label>
              <Select items={Object.fromEntries(doctors.map((d) => [d.id, d.name]))} value={surgeonId} onValueChange={(v) => setSurgeonId(v ?? "")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="procedureName">Procedure</Label><Input id="procedureName" name="procedureName" required /></div>
          <div className="space-y-1.5"><Label htmlFor="anesthesiaType">Anesthesia type</Label><Input id="anesthesiaType" name="anesthesiaType" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="scheduledStart">Start</Label><Input id="scheduledStart" name="scheduledStart" type="datetime-local" required /></div>
            <div className="space-y-1.5"><Label htmlFor="scheduledEnd">End</Label><Input id="scheduledEnd" name="scheduledEnd" type="datetime-local" required /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="notes">Notes</Label><Textarea id="notes" name="notes" /></div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Scheduling…" : "Schedule Surgery"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
