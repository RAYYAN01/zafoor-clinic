"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EntityDialog } from "@/components/shared/entity-dialog"
import { DeleteButton } from "@/components/shared/delete-button"
import { formatDate } from "@/lib/format"
import {
  addMedicalHistory,
  deleteMedicalHistory,
  addFamilyHistory,
  deleteFamilyHistory,
  addSurgicalHistory,
  deleteSurgicalHistory,
  addCurrentMedication,
  updateMedicationStatus,
  deleteCurrentMedication,
} from "@/actions/history"
import type { getClinicalHistory } from "@/actions/history"

type ClinicalHistory = Awaited<ReturnType<typeof getClinicalHistory>>

export function ClinicalHistoryTab({ patientId, data }: { patientId: string; data: ClinicalHistory }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Medical History</CardTitle>
          <EntityDialog title="Add Medical History">
            {(close) => <MedicalHistoryForm patientId={patientId} onDone={close} />}
          </EntityDialog>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.medicalHistory.length === 0 && <p className="text-sm text-muted-foreground">None recorded.</p>}
          {data.medicalHistory.map((h) => (
            <div key={h.id} className="flex items-start justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{h.description}</p>
                {h.occurredOn && <p className="text-xs text-muted-foreground">{formatDate(h.occurredOn)}</p>}
                {h.notes && <p className="text-xs text-muted-foreground mt-0.5">{h.notes}</p>}
              </div>
              <DeleteButton onDelete={() => deleteMedicalHistory(patientId, h.id)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Family History</CardTitle>
          <EntityDialog title="Add Family History">
            {(close) => <FamilyHistoryForm patientId={patientId} onDone={close} />}
          </EntityDialog>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.familyHistory.length === 0 && <p className="text-sm text-muted-foreground">None recorded.</p>}
          {data.familyHistory.map((h) => (
            <div key={h.id} className="flex items-start justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{h.condition}</p>
                <p className="text-xs text-muted-foreground">{h.relation}{h.notes ? ` · ${h.notes}` : ""}</p>
              </div>
              <DeleteButton onDelete={() => deleteFamilyHistory(patientId, h.id)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Surgical History</CardTitle>
          <EntityDialog title="Add Surgical History">
            {(close) => <SurgicalHistoryForm patientId={patientId} onDone={close} />}
          </EntityDialog>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.surgicalHistory.length === 0 && <p className="text-sm text-muted-foreground">None recorded.</p>}
          {data.surgicalHistory.map((h) => (
            <div key={h.id} className="flex items-start justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{h.procedure}</p>
                <p className="text-xs text-muted-foreground">
                  {h.surgeryDate ? formatDate(h.surgeryDate) : ""}
                  {h.surgeon ? ` · ${h.surgeon}` : ""}
                  {h.hospital ? ` · ${h.hospital}` : ""}
                </p>
              </div>
              <DeleteButton onDelete={() => deleteSurgicalHistory(patientId, h.id)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Current Medications</CardTitle>
          <EntityDialog title="Add Medication">
            {(close) => <MedicationForm patientId={patientId} onDone={close} />}
          </EntityDialog>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.currentMedications.length === 0 && <p className="text-sm text-muted-foreground">None recorded.</p>}
          {data.currentMedications.map((m) => (
            <MedicationRow key={m.id} patientId={patientId} medication={m} />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function MedicationRow({
  patientId,
  medication,
}: {
  patientId: string
  medication: ClinicalHistory["currentMedications"][number]
}) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex items-start justify-between rounded-lg border p-3">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{medication.medicineName}</p>
          <Badge
            variant={medication.status === "ACTIVE" ? "secondary" : "outline"}
            className="cursor-pointer"
            onClick={() =>
              startTransition(async () => {
                try {
                  await updateMedicationStatus(patientId, medication.id, medication.status === "ACTIVE" ? "STOPPED" : "ACTIVE")
                } catch {
                  toast.error("Could not update medication")
                }
              })
            }
          >
            {pending ? "…" : medication.status}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {medication.dosage}{medication.frequency ? ` · ${medication.frequency}` : ""}
          {medication.prescribedBy ? ` · ${medication.prescribedBy}` : ""}
        </p>
      </div>
      <DeleteButton onDelete={() => deleteCurrentMedication(patientId, medication.id)} />
    </div>
  )
}

function MedicalHistoryForm({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const [pending, startTransition] = useTransition()
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        startTransition(async () => {
          try {
            await addMedicalHistory(patientId, {
              description: String(fd.get("description") || ""),
              occurredOn: String(fd.get("occurredOn") || "") || undefined,
              notes: String(fd.get("notes") || "") || undefined,
            })
            toast.success("Added")
            onDone()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not add")
          }
        })
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="mh-description">Description</Label>
        <Input id="mh-description" name="description" required placeholder="e.g. Tuberculosis, treated" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="mh-occurredOn">Occurred on</Label>
        <Input id="mh-occurredOn" name="occurredOn" type="date" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="mh-notes">Notes</Label>
        <Textarea id="mh-notes" name="notes" />
      </div>
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Add"}</Button>
    </form>
  )
}

function FamilyHistoryForm({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const [pending, startTransition] = useTransition()
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        startTransition(async () => {
          try {
            await addFamilyHistory(patientId, {
              relation: String(fd.get("relation") || ""),
              condition: String(fd.get("condition") || ""),
              notes: String(fd.get("notes") || "") || undefined,
            })
            toast.success("Added")
            onDone()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not add")
          }
        })
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="fh-relation">Relation</Label>
        <Input id="fh-relation" name="relation" required placeholder="e.g. Mother" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fh-condition">Condition</Label>
        <Input id="fh-condition" name="condition" required placeholder="e.g. Hypertension" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fh-notes">Notes</Label>
        <Textarea id="fh-notes" name="notes" />
      </div>
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Add"}</Button>
    </form>
  )
}

function SurgicalHistoryForm({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const [pending, startTransition] = useTransition()
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        startTransition(async () => {
          try {
            await addSurgicalHistory(patientId, {
              procedure: String(fd.get("procedure") || ""),
              surgeryDate: String(fd.get("surgeryDate") || "") || undefined,
              surgeon: String(fd.get("surgeon") || "") || undefined,
              hospital: String(fd.get("hospital") || "") || undefined,
              notes: String(fd.get("notes") || "") || undefined,
            })
            toast.success("Added")
            onDone()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not add")
          }
        })
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="sh-procedure">Procedure</Label>
        <Input id="sh-procedure" name="procedure" required placeholder="e.g. Appendectomy" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="sh-surgeryDate">Date</Label>
        <Input id="sh-surgeryDate" name="surgeryDate" type="date" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="sh-surgeon">Surgeon</Label>
        <Input id="sh-surgeon" name="surgeon" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="sh-hospital">Hospital</Label>
        <Input id="sh-hospital" name="hospital" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="sh-notes">Notes</Label>
        <Textarea id="sh-notes" name="notes" />
      </div>
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Add"}</Button>
    </form>
  )
}

function MedicationForm({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const [pending, startTransition] = useTransition()
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        startTransition(async () => {
          try {
            await addCurrentMedication(patientId, {
              medicineName: String(fd.get("medicineName") || ""),
              dosage: String(fd.get("dosage") || "") || undefined,
              frequency: String(fd.get("frequency") || "") || undefined,
              startDate: String(fd.get("startDate") || "") || undefined,
              status: "ACTIVE",
              prescribedBy: String(fd.get("prescribedBy") || "") || undefined,
            })
            toast.success("Added")
            onDone()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not add")
          }
        })
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="med-name">Medicine name</Label>
        <Input id="med-name" name="medicineName" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="med-dosage">Dosage</Label>
          <Input id="med-dosage" name="dosage" placeholder="500mg" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="med-frequency">Frequency</Label>
          <Input id="med-frequency" name="frequency" placeholder="OD" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="med-startDate">Start date</Label>
        <Input id="med-startDate" name="startDate" type="date" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="med-prescribedBy">Prescribed by</Label>
        <Input id="med-prescribedBy" name="prescribedBy" />
      </div>
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Add"}</Button>
    </form>
  )
}
