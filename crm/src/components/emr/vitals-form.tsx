"use client"

import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { saveVitals } from "@/actions/encounters"

type Vitals = {
  heightCm: number | null
  weightKg: number | null
  bmi: number | null
  temperatureC: number | null
  pulseBpm: number | null
  bpSystolic: number | null
  bpDiastolic: number | null
  spo2: number | null
  respiratoryRate: number | null
} | null

export function VitalsForm({
  encounterId,
  patientId,
  initial,
  readOnly,
}: {
  encounterId: string
  patientId: string
  initial: Vitals
  readOnly: boolean
}) {
  const [form, setForm] = useState({
    heightCm: initial?.heightCm?.toString() ?? "",
    weightKg: initial?.weightKg?.toString() ?? "",
    temperatureC: initial?.temperatureC?.toString() ?? "",
    pulseBpm: initial?.pulseBpm?.toString() ?? "",
    bpSystolic: initial?.bpSystolic?.toString() ?? "",
    bpDiastolic: initial?.bpDiastolic?.toString() ?? "",
    spo2: initial?.spo2?.toString() ?? "",
    respiratoryRate: initial?.respiratoryRate?.toString() ?? "",
  })
  const [pending, startTransition] = useTransition()

  const bmi = useMemo(() => {
    const h = Number(form.heightCm)
    const w = Number(form.weightKg)
    if (!h || !w) return null
    const m = h / 100
    return Math.round((w / (m * m)) * 10) / 10
  }, [form.heightCm, form.weightKg])

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function save() {
    startTransition(async () => {
      try {
        await saveVitals(encounterId, patientId, {
          heightCm: form.heightCm ? Number(form.heightCm) : null,
          weightKg: form.weightKg ? Number(form.weightKg) : null,
          temperatureC: form.temperatureC ? Number(form.temperatureC) : null,
          pulseBpm: form.pulseBpm ? Number(form.pulseBpm) : null,
          bpSystolic: form.bpSystolic ? Number(form.bpSystolic) : null,
          bpDiastolic: form.bpDiastolic ? Number(form.bpDiastolic) : null,
          spo2: form.spo2 ? Number(form.spo2) : null,
          respiratoryRate: form.respiratoryRate ? Number(form.respiratoryRate) : null,
        })
        toast.success("Vitals saved")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not save vitals")
      }
    })
  }

  const fields: { key: keyof typeof form; label: string; unit: string }[] = [
    { key: "heightCm", label: "Height", unit: "cm" },
    { key: "weightKg", label: "Weight", unit: "kg" },
    { key: "temperatureC", label: "Temp", unit: "°C" },
    { key: "pulseBpm", label: "Pulse", unit: "bpm" },
    { key: "bpSystolic", label: "BP Systolic", unit: "mmHg" },
    { key: "bpDiastolic", label: "BP Diastolic", unit: "mmHg" },
    { key: "spo2", label: "SpO2", unit: "%" },
    { key: "respiratoryRate", label: "Resp. Rate", unit: "/min" },
  ]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {fields.map((f) => (
          <div key={f.key} className="space-y-1">
            <Label className="text-xs text-muted-foreground">{f.label} ({f.unit})</Label>
            <Input
              type="number"
              value={form[f.key]}
              onChange={(e) => set(f.key, e.target.value)}
              disabled={readOnly}
              className="h-8"
            />
          </div>
        ))}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">BMI</Label>
          <Input value={bmi ?? ""} disabled className="h-8 bg-muted" />
        </div>
      </div>
      {!readOnly && (
        <Button type="button" size="sm" onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save Vitals"}
        </Button>
      )}
    </div>
  )
}
