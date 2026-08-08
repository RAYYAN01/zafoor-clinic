"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Activity } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { patientDisplayName, formatRelative } from "@/lib/format"
import { recordIcuRound, type getIcuBoard } from "@/actions/icu"

type Admissions = Awaited<ReturnType<typeof getIcuBoard>>

export function IcuBoard({ admissions }: { admissions: Admissions }) {
  if (admissions.length === 0) {
    return <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No patients currently occupy an ICU bed.</CardContent></Card>
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {admissions.map((a) => (
        <IcuCard key={a.id} admission={a} />
      ))}
    </div>
  )
}

function IcuCard({ admission }: { admission: Admissions[number] }) {
  const [open, setOpen] = useState(false)
  const latest = admission.icuRounds[0]

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="flex items-start justify-between">
          <div>
            <Link href={`/patients/${admission.patientId}`} className="text-sm font-medium hover:underline">
              {patientDisplayName(admission.patient)}
            </Link>
            <p className="text-xs text-muted-foreground mt-0.5">
              Bed {admission.bed?.bedNumber} · {admission.bed?.ward.name}
              {admission.doctor ? ` · Dr. ${admission.doctor.name}` : ""}
            </p>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setOpen(true)}>
            <Activity className="h-3.5 w-3.5" />
            Record Round
          </Button>
        </div>

        {latest ? (
          <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted p-3 text-xs">
            <Vital label="Pulse" value={latest.pulseBpm ? `${latest.pulseBpm} bpm` : "—"} />
            <Vital label="BP" value={latest.bpSystolic && latest.bpDiastolic ? `${latest.bpSystolic}/${latest.bpDiastolic}` : "—"} />
            <Vital label="SpO2" value={latest.spo2 ? `${latest.spo2}%` : "—"} />
            <Vital label="Temp" value={latest.temperatureC ? `${Number(latest.temperatureC)}°C` : "—"} />
            <Vital label="RR" value={latest.respiratoryRate ? `${latest.respiratoryRate}/min` : "—"} />
            <Vital label="GCS" value={latest.gcsScore ? String(latest.gcsScore) : "—"} />
            <p className="col-span-3 text-muted-foreground">Last recorded {formatRelative(latest.recordedAt)}</p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No rounds recorded yet.</p>
        )}
      </CardContent>
      <RecordRoundDialog open={open} onOpenChange={setOpen} admissionId={admission.id} />
    </Card>
  )
}

function Vital({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  )
}

function RecordRoundDialog({ open, onOpenChange, admissionId }: { open: boolean; onOpenChange: (v: boolean) => void; admissionId: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Record ICU Round</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              try {
                await recordIcuRound(admissionId, {
                  pulseBpm: fd.get("pulseBpm") ? Number(fd.get("pulseBpm")) : undefined,
                  bpSystolic: fd.get("bpSystolic") ? Number(fd.get("bpSystolic")) : undefined,
                  bpDiastolic: fd.get("bpDiastolic") ? Number(fd.get("bpDiastolic")) : undefined,
                  spo2: fd.get("spo2") ? Number(fd.get("spo2")) : undefined,
                  temperatureC: fd.get("temperatureC") ? Number(fd.get("temperatureC")) : undefined,
                  respiratoryRate: fd.get("respiratoryRate") ? Number(fd.get("respiratoryRate")) : undefined,
                  ventilatorMode: String(fd.get("ventilatorMode") || "") || undefined,
                  gcsScore: fd.get("gcsScore") ? Number(fd.get("gcsScore")) : undefined,
                  notes: String(fd.get("notes") || "") || undefined,
                })
                toast.success("Round recorded")
                onOpenChange(false)
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not record round")
              }
            })
          }}
        >
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label htmlFor="pulseBpm">Pulse</Label><Input id="pulseBpm" name="pulseBpm" type="number" /></div>
            <div className="space-y-1.5"><Label htmlFor="bpSystolic">BP Sys</Label><Input id="bpSystolic" name="bpSystolic" type="number" /></div>
            <div className="space-y-1.5"><Label htmlFor="bpDiastolic">BP Dia</Label><Input id="bpDiastolic" name="bpDiastolic" type="number" /></div>
            <div className="space-y-1.5"><Label htmlFor="spo2">SpO2 %</Label><Input id="spo2" name="spo2" type="number" /></div>
            <div className="space-y-1.5"><Label htmlFor="temperatureC">Temp °C</Label><Input id="temperatureC" name="temperatureC" type="number" step="0.1" /></div>
            <div className="space-y-1.5"><Label htmlFor="respiratoryRate">RR</Label><Input id="respiratoryRate" name="respiratoryRate" type="number" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="ventilatorMode">Ventilator mode</Label><Input id="ventilatorMode" name="ventilatorMode" placeholder="e.g. SIMV" /></div>
            <div className="space-y-1.5"><Label htmlFor="gcsScore">GCS score</Label><Input id="gcsScore" name="gcsScore" type="number" min={3} max={15} /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="notes">Notes</Label><Textarea id="notes" name="notes" /></div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Save Round"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
