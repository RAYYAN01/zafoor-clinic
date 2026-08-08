"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
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
import { PatientPicker } from "@/components/appointments/patient-picker"
import { patientDisplayName, formatRelative } from "@/lib/format"
import {
  triageLevelLabels,
  triageLevelColors,
  arrivalModeLabels,
  emergencyStatusLabels,
  emergencyStatusColors,
} from "@/lib/labels"
import { createEmergencyCase, updateEmergencyCase, type getEmergencyCases } from "@/actions/emergency"
import type { getAvailableBeds } from "@/actions/beds"

type Cases = Awaited<ReturnType<typeof getEmergencyCases>>
type Beds = Awaited<ReturnType<typeof getAvailableBeds>>
type Doctors = { id: string; name: string }[]

export function EmergencyBoard({ cases, beds, doctors }: { cases: Cases; beds: Beds; doctors: Doctors }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Register Emergency Case
        </Button>
      </div>

      {cases.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No active emergency cases.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => (
            <CaseRow key={c.id} emergencyCase={c} beds={beds} doctors={doctors} />
          ))}
        </div>
      )}

      <NewCaseDialog open={open} onOpenChange={setOpen} doctors={doctors} />
    </div>
  )
}

function CaseRow({ emergencyCase, beds, doctors }: { emergencyCase: Cases[number]; beds: Beds; doctors: Doctors }) {
  const [detailOpen, setDetailOpen] = useState(false)
  const name = emergencyCase.patient ? patientDisplayName(emergencyCase.patient) : (emergencyCase.walkInName ?? "Unknown")

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium">{name}</p>
            <Badge variant="secondary" className={triageLevelColors[emergencyCase.triageLevel]}>{triageLevelLabels[emergencyCase.triageLevel]}</Badge>
            <Badge variant="secondary" className={emergencyStatusColors[emergencyCase.status]}>{emergencyStatusLabels[emergencyCase.status]}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {emergencyCase.caseNumber} · {emergencyCase.chiefComplaint} · {arrivalModeLabels[emergencyCase.arrivalMode]}
            {emergencyCase.bed ? ` · Bed ${emergencyCase.bed.bedNumber}` : ""}
            {emergencyCase.attendingDoctor ? ` · Dr. ${emergencyCase.attendingDoctor.name}` : ""}
          </p>
          <p className="text-xs text-muted-foreground/80">Arrived {formatRelative(emergencyCase.arrivedAt)}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {emergencyCase.patient && (
            <Link href={`/patients/${emergencyCase.patientId}`} className="text-xs text-primary hover:underline">Chart</Link>
          )}
          <Button size="sm" variant="outline" onClick={() => setDetailOpen(true)}>Update</Button>
        </div>
      </CardContent>
      <UpdateCaseDialog open={detailOpen} onOpenChange={setDetailOpen} emergencyCase={emergencyCase} beds={beds} doctors={doctors} />
    </Card>
  )
}

function NewCaseDialog({ open, onOpenChange, doctors }: { open: boolean; onOpenChange: (v: boolean) => void; doctors: Doctors }) {
  const [patientId, setPatientId] = useState("")
  const [walkIn, setWalkIn] = useState(false)
  const [triageLevel, setTriageLevel] = useState("URGENT")
  const [arrivalMode, setArrivalMode] = useState("WALK_IN")
  const [doctorId, setDoctorId] = useState("")
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Register Emergency Case</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              try {
                await createEmergencyCase({
                  patientId: !walkIn ? patientId || undefined : undefined,
                  walkInName: walkIn ? String(fd.get("walkInName") || "") || undefined : undefined,
                  walkInPhone: walkIn ? String(fd.get("walkInPhone") || "") || undefined : undefined,
                  triageLevel: triageLevel as never,
                  chiefComplaint: String(fd.get("chiefComplaint") || ""),
                  arrivalMode: arrivalMode as never,
                  broughtBy: String(fd.get("broughtBy") || "") || undefined,
                  attendingDoctorId: doctorId || undefined,
                })
                toast.success("Emergency case registered")
                onOpenChange(false)
                setPatientId("")
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not register case")
              }
            })
          }}
        >
          <div className="flex items-center gap-2">
            <button type="button" className={`text-xs rounded-md px-2 py-1 border ${!walkIn ? "bg-primary text-primary-foreground" : ""}`} onClick={() => setWalkIn(false)}>Registered Patient</button>
            <button type="button" className={`text-xs rounded-md px-2 py-1 border ${walkIn ? "bg-primary text-primary-foreground" : ""}`} onClick={() => setWalkIn(true)}>Walk-in / Unregistered</button>
          </div>
          {walkIn ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label htmlFor="walkInName">Name</Label><Input id="walkInName" name="walkInName" required={walkIn} /></div>
              <div className="space-y-1.5"><Label htmlFor="walkInPhone">Phone</Label><Input id="walkInPhone" name="walkInPhone" /></div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Patient</Label>
              <PatientPicker value={patientId} onChange={setPatientId} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Triage level</Label>
              <Select items={triageLevelLabels} value={triageLevel} onValueChange={(v) => setTriageLevel(v ?? "URGENT")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(triageLevelLabels).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Arrival mode</Label>
              <Select items={arrivalModeLabels} value={arrivalMode} onValueChange={(v) => setArrivalMode(v ?? "WALK_IN")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(arrivalModeLabels).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="chiefComplaint">Chief complaint</Label><Textarea id="chiefComplaint" name="chiefComplaint" required /></div>
          <div className="space-y-1.5"><Label htmlFor="broughtBy">Brought by</Label><Input id="broughtBy" name="broughtBy" /></div>
          <div className="space-y-1.5">
            <Label>Attending doctor</Label>
            <Select items={{ NONE: "Unassigned", ...Object.fromEntries(doctors.map((d) => [d.id, d.name])) }} value={doctorId || "NONE"} onValueChange={(v) => setDoctorId(v === "NONE" ? "" : v ?? "")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Unassigned</SelectItem>
                {doctors.map((d) => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Registering…" : "Register Case"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function UpdateCaseDialog({
  open,
  onOpenChange,
  emergencyCase,
  beds,
  doctors,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  emergencyCase: Cases[number]
  beds: Beds
  doctors: Doctors
}) {
  const [status, setStatus] = useState(emergencyCase.status)
  const [bedId, setBedId] = useState(emergencyCase.bedId ?? "")
  const [doctorId, setDoctorId] = useState(emergencyCase.attendingDoctorId ?? "")
  const [pending, startTransition] = useTransition()

  const bedOptions = emergencyCase.bed ? [{ id: emergencyCase.bed.id, bedNumber: emergencyCase.bed.bedNumber, ward: emergencyCase.bed.ward }, ...beds] : beds

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Update Case {emergencyCase.caseNumber}</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              try {
                await updateEmergencyCase(emergencyCase.id, {
                  status: status as never,
                  attendingDoctorId: doctorId || undefined,
                  bedId: bedId || undefined,
                  disposition: String(fd.get("disposition") || "") || undefined,
                  notes: String(fd.get("notes") || "") || undefined,
                })
                toast.success("Case updated")
                onOpenChange(false)
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not update case")
              }
            })
          }}
        >
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select items={emergencyStatusLabels} value={status} onValueChange={(v) => setStatus((v ?? "WAITING") as typeof status)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(emergencyStatusLabels).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Attending doctor</Label>
            <Select items={{ NONE: "Unassigned", ...Object.fromEntries(doctors.map((d) => [d.id, d.name])) }} value={doctorId || "NONE"} onValueChange={(v) => setDoctorId(v === "NONE" ? "" : v ?? "")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Unassigned</SelectItem>
                {doctors.map((d) => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Bed</Label>
            <Select items={{ NONE: "No bed", ...Object.fromEntries(bedOptions.map((b) => [b.id, `${b.bedNumber} — ${b.ward.name}`])) }} value={bedId || "NONE"} onValueChange={(v) => setBedId(v === "NONE" ? "" : v ?? "")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">No bed</SelectItem>
                {bedOptions.map((b) => (<SelectItem key={b.id} value={b.id}>{b.bedNumber} — {b.ward.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label htmlFor="disposition">Disposition</Label><Input id="disposition" name="disposition" defaultValue={emergencyCase.disposition ?? ""} /></div>
          <div className="space-y-1.5"><Label htmlFor="notes">Notes</Label><Textarea id="notes" name="notes" defaultValue={emergencyCase.notes ?? ""} /></div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Update Case"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
