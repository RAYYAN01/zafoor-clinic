"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EntityDialog } from "@/components/shared/entity-dialog"
import { DeleteButton } from "@/components/shared/delete-button"
import { addDiagnosis, deleteDiagnosis, updateDiagnosisStatus } from "@/actions/encounters"

type Diagnosis = {
  id: string
  description: string
  icdCode: string | null
  type: string
  status: string
}

const typeLabels: Record<string, string> = { PRIMARY: "Primary", SECONDARY: "Secondary", DIFFERENTIAL: "Differential" }

export function DiagnosesPanel({
  encounterId,
  patientId,
  diagnoses,
  readOnly,
}: {
  encounterId: string
  patientId: string
  diagnoses: Diagnosis[]
  readOnly: boolean
}) {
  return (
    <div className="space-y-3">
      {!readOnly && (
        <EntityDialog title="Add Diagnosis" triggerLabel="Add Diagnosis">
          {(close) => <DiagnosisForm encounterId={encounterId} patientId={patientId} onDone={close} />}
        </EntityDialog>
      )}
      <div className="space-y-2">
        {diagnoses.length === 0 && <p className="text-sm text-muted-foreground">No diagnoses recorded.</p>}
        {diagnoses.map((d) => (
          <DiagnosisRow key={d.id} encounterId={encounterId} diagnosis={d} readOnly={readOnly} />
        ))}
      </div>
    </div>
  )
}

function DiagnosisRow({ encounterId, diagnosis, readOnly }: { encounterId: string; diagnosis: Diagnosis; readOnly: boolean }) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex items-start justify-between gap-2 rounded-lg border p-3">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{typeLabels[diagnosis.type]}</Badge>
          {diagnosis.icdCode && <Badge variant="outline" className="font-mono text-xs">{diagnosis.icdCode}</Badge>}
        </div>
        <p className="text-sm mt-1">{diagnosis.description}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          size="sm"
          variant={diagnosis.status === "ACTIVE" ? "secondary" : "outline"}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              try {
                await updateDiagnosisStatus(encounterId, diagnosis.id, diagnosis.status === "ACTIVE" ? "RESOLVED" : "ACTIVE")
              } catch {
                toast.error("Could not update diagnosis")
              }
            })
          }
        >
          {diagnosis.status === "ACTIVE" ? "Active" : "Resolved"}
        </Button>
        {!readOnly && (
          <DeleteButton onDelete={() => deleteDiagnosis(encounterId, diagnosis.id)} />
        )}
      </div>
    </div>
  )
}

function DiagnosisForm({ encounterId, patientId, onDone }: { encounterId: string; patientId: string; onDone: () => void }) {
  const [pending, startTransition] = useTransition()

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        startTransition(async () => {
          try {
            await addDiagnosis(encounterId, patientId, {
              description: String(fd.get("description") || ""),
              icdCode: String(fd.get("icdCode") || "") || undefined,
              type: String(fd.get("type") || "PRIMARY") as never,
              status: "ACTIVE",
            })
            toast.success("Diagnosis added")
            onDone()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not add diagnosis")
          }
        })
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="dx-description">Description</Label>
        <Input id="dx-description" name="description" required placeholder="e.g. Type 2 Diabetes Mellitus" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="dx-icd">ICD-10 code (optional)</Label>
        <Input id="dx-icd" name="icdCode" placeholder="e.g. E11.9" />
      </div>
      <div className="space-y-1.5">
        <Label>Type</Label>
        <Select items={{ PRIMARY: "Primary", SECONDARY: "Secondary", DIFFERENTIAL: "Differential" }} name="type" defaultValue="PRIMARY">
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="PRIMARY">Primary</SelectItem>
            <SelectItem value="SECONDARY">Secondary</SelectItem>
            <SelectItem value="DIFFERENTIAL">Differential</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Add Diagnosis"}</Button>
    </form>
  )
}
