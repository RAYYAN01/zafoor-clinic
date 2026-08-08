"use client"

import { useState, useTransition } from "react"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { EntityDialog } from "@/components/shared/entity-dialog"
import { createEncounterPrescription } from "@/actions/encounters"
import { formatDateTime } from "@/lib/format"

type Item = { medicineName: string; dosage?: string; frequency?: string; duration?: string; instructions?: string }
type Prescription = {
  id: string
  diagnosis: string | null
  notes: string | null
  issuedAt: Date
  items: { id: string; medicineName: string; dosage: string | null; frequency: string | null; duration: string | null }[]
}

export function EncounterPrescriptionsPanel({
  encounterId,
  patientId,
  doctorId,
  prescriptions,
  readOnly,
}: {
  encounterId: string
  patientId: string
  doctorId: string
  prescriptions: Prescription[]
  readOnly: boolean
}) {
  return (
    <div className="space-y-3">
      {!readOnly && (
        <EntityDialog title="New Prescription" triggerLabel="New Prescription">
          {(close) => (
            <PrescriptionForm encounterId={encounterId} patientId={patientId} doctorId={doctorId} onDone={close} />
          )}
        </EntityDialog>
      )}
      <div className="space-y-2">
        {prescriptions.length === 0 && <p className="text-sm text-muted-foreground">No prescriptions issued yet.</p>}
        {prescriptions.map((p) => (
          <div key={p.id} className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{p.diagnosis || "Prescription"}</p>
              <span className="text-xs text-muted-foreground">{formatDateTime(p.issuedAt)}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {p.items.map((i) => (
                <Badge key={i.id} variant="outline">
                  {i.medicineName}{i.dosage ? ` · ${i.dosage}` : ""}{i.frequency ? ` · ${i.frequency}` : ""}
                </Badge>
              ))}
            </div>
            {p.notes && <p className="text-xs text-muted-foreground mt-2">{p.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

function PrescriptionForm({
  encounterId,
  patientId,
  doctorId,
  onDone,
}: {
  encounterId: string
  patientId: string
  doctorId: string
  onDone: () => void
}) {
  const [items, setItems] = useState<Item[]>([{ medicineName: "" }])
  const [pending, startTransition] = useTransition()

  function updateItem(index: number, field: keyof Item, value: string) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)))
  }

  function addRow() {
    setItems((prev) => [...prev, { medicineName: "" }])
  }

  function removeRow(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        const validItems = items.filter((it) => it.medicineName.trim())
        if (validItems.length === 0) {
          toast.error("Add at least one medicine")
          return
        }
        startTransition(async () => {
          try {
            await createEncounterPrescription(encounterId, patientId, doctorId, {
              diagnosis: String(fd.get("diagnosis") || "") || undefined,
              notes: String(fd.get("notes") || "") || undefined,
              items: validItems,
            })
            toast.success("Prescription issued")
            onDone()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not create prescription")
          }
        })
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="rx-diagnosis">Diagnosis / heading</Label>
        <Input id="rx-diagnosis" name="diagnosis" placeholder="Optional" />
      </div>

      <div className="space-y-3">
        <Label>Medicines</Label>
        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-[1fr_auto] gap-2 rounded-lg border p-3">
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Medicine name"
                value={item.medicineName}
                onChange={(e) => updateItem(index, "medicineName", e.target.value)}
                className="col-span-2"
              />
              <Input
                placeholder="Dosage (e.g. 500mg)"
                value={item.dosage ?? ""}
                onChange={(e) => updateItem(index, "dosage", e.target.value)}
              />
              <Input
                placeholder="Frequency (e.g. BID)"
                value={item.frequency ?? ""}
                onChange={(e) => updateItem(index, "frequency", e.target.value)}
              />
              <Input
                placeholder="Duration (e.g. 5 days)"
                value={item.duration ?? ""}
                onChange={(e) => updateItem(index, "duration", e.target.value)}
              />
              <Input
                placeholder="Instructions"
                value={item.instructions ?? ""}
                onChange={(e) => updateItem(index, "instructions", e.target.value)}
              />
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => removeRow(index)}
              disabled={items.length === 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={addRow}>
          <Plus className="h-3.5 w-3.5" />
          Add Medicine
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rx-notes">Notes</Label>
        <Textarea id="rx-notes" name="notes" placeholder="Optional" />
      </div>

      <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Issue Prescription"}</Button>
    </form>
  )
}
