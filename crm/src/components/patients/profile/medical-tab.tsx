"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EntityDialog } from "@/components/shared/entity-dialog"
import { DeleteButton } from "@/components/shared/delete-button"
import { formatDate } from "@/lib/format"
import { alertSeverityColors, alertSeverityLabels } from "@/lib/labels"
import {
  addMedicalAlert,
  deleteMedicalAlert,
  addAllergy,
  deleteAllergy,
  addChronicDisease,
  deleteChronicDisease,
  addVaccination,
  deleteVaccination,
} from "@/actions/patients"
import type { getPatientById } from "@/actions/patients"

type Patient = NonNullable<Awaited<ReturnType<typeof getPatientById>>>
const severities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const

export function MedicalTab({ patient }: { patient: Patient }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Medical Alerts</CardTitle>
          <EntityDialog title="Add Medical Alert">
            {(close) => <AlertForm patientId={patient.id} onDone={close} />}
          </EntityDialog>
        </CardHeader>
        <CardContent className="space-y-3">
          {patient.medicalAlerts.length === 0 && <p className="text-sm text-muted-foreground">None recorded.</p>}
          {patient.medicalAlerts.map((a) => (
            <div key={a.id} className="flex items-start justify-between rounded-lg border p-3">
              <div>
                <Badge className={alertSeverityColors[a.severity]} variant="secondary">
                  {alertSeverityLabels[a.severity]}
                </Badge>
                <p className="text-sm mt-1">{a.description}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{a.type} · {a.active ? "Active" : "Inactive"}</p>
              </div>
              <DeleteButton onDelete={() => deleteMedicalAlert(patient.id, a.id)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Allergies</CardTitle>
          <EntityDialog title="Add Allergy">
            {(close) => <AllergyForm patientId={patient.id} onDone={close} />}
          </EntityDialog>
        </CardHeader>
        <CardContent className="space-y-3">
          {patient.allergies.length === 0 && <p className="text-sm text-muted-foreground">None recorded.</p>}
          {patient.allergies.map((a) => (
            <div key={a.id} className="flex items-start justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{a.allergen}</p>
                <p className="text-xs text-muted-foreground">{a.reaction}</p>
                <Badge className={alertSeverityColors[a.severity]} variant="secondary">
                  {alertSeverityLabels[a.severity]}
                </Badge>
              </div>
              <DeleteButton onDelete={() => deleteAllergy(patient.id, a.id)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Chronic Diseases</CardTitle>
          <EntityDialog title="Add Chronic Disease">
            {(close) => <ChronicDiseaseForm patientId={patient.id} onDone={close} />}
          </EntityDialog>
        </CardHeader>
        <CardContent className="space-y-3">
          {patient.chronicDiseases.length === 0 && <p className="text-sm text-muted-foreground">None recorded.</p>}
          {patient.chronicDiseases.map((c) => (
            <div key={c.id} className="flex items-start justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  {c.diagnosedOn ? `Diagnosed ${formatDate(c.diagnosedOn)}` : ""}
                </p>
                <Badge variant="outline">{c.status}</Badge>
              </div>
              <DeleteButton onDelete={() => deleteChronicDisease(patient.id, c.id)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Vaccinations</CardTitle>
          <EntityDialog title="Add Vaccination">
            {(close) => <VaccinationForm patientId={patient.id} onDone={close} />}
          </EntityDialog>
        </CardHeader>
        <CardContent className="space-y-3">
          {patient.vaccinations.length === 0 && <p className="text-sm text-muted-foreground">None recorded.</p>}
          {patient.vaccinations.map((v) => (
            <div key={v.id} className="flex items-start justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{v.vaccineName} — Dose {v.doseNumber}</p>
                <p className="text-xs text-muted-foreground">
                  Given {formatDate(v.dateGiven)}
                  {v.nextDueDate ? ` · Next due ${formatDate(v.nextDueDate)}` : ""}
                </p>
              </div>
              <DeleteButton onDelete={() => deleteVaccination(patient.id, v.id)} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function SeveritySelect({ name, defaultValue = "MEDIUM" }: { name: string; defaultValue?: string }) {
  return (
    <Select items={alertSeverityLabels} name={name} defaultValue={defaultValue}>
      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
      <SelectContent>
        {severities.map((s) => (
          <SelectItem key={s} value={s}>{alertSeverityLabels[s]}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function AlertForm({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const [pending, startTransition] = useTransition()
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        startTransition(async () => {
          try {
            await addMedicalAlert(patientId, {
              type: String(fd.get("type") || "OTHER") as never,
              severity: String(fd.get("severity") || "MEDIUM") as never,
              description: String(fd.get("description") || ""),
            })
            toast.success("Alert added")
            onDone()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not add alert")
          }
        })
      }}
    >
      <div className="space-y-1.5">
        <Label>Type</Label>
        <Select
          items={{ ALLERGY: "ALLERGY", CONDITION: "CONDITION", DEVICE: "DEVICE", BEHAVIORAL: "BEHAVIORAL", OTHER: "OTHER" }}
          name="type"
          defaultValue="OTHER"
        >
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["ALLERGY", "CONDITION", "DEVICE", "BEHAVIORAL", "OTHER"].map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Severity</Label>
        <SeveritySelect name="severity" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="alert-desc">Description</Label>
        <Textarea id="alert-desc" name="description" required />
      </div>
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Add Alert"}</Button>
    </form>
  )
}

function AllergyForm({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const [pending, startTransition] = useTransition()
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        startTransition(async () => {
          try {
            await addAllergy(patientId, {
              allergen: String(fd.get("allergen") || ""),
              reaction: String(fd.get("reaction") || "") || undefined,
              severity: String(fd.get("severity") || "MEDIUM") as never,
            })
            toast.success("Allergy added")
            onDone()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not add allergy")
          }
        })
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="allergen">Allergen</Label>
        <Input id="allergen" name="allergen" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reaction">Reaction</Label>
        <Input id="reaction" name="reaction" />
      </div>
      <div className="space-y-1.5">
        <Label>Severity</Label>
        <SeveritySelect name="severity" />
      </div>
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Add Allergy"}</Button>
    </form>
  )
}

function ChronicDiseaseForm({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const [pending, startTransition] = useTransition()
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        startTransition(async () => {
          try {
            await addChronicDisease(patientId, {
              name: String(fd.get("name") || ""),
              diagnosedOn: fd.get("diagnosedOn") ? new Date(String(fd.get("diagnosedOn"))) : undefined,
              status: String(fd.get("status") || "ACTIVE") as never,
              notes: String(fd.get("notes") || "") || undefined,
            })
            toast.success("Condition added")
            onDone()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not add condition")
          }
        })
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="cd-name">Condition name</Label>
        <Input id="cd-name" name="name" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cd-diagnosedOn">Diagnosed on</Label>
        <Input id="cd-diagnosedOn" name="diagnosedOn" type="date" />
      </div>
      <div className="space-y-1.5">
        <Label>Status</Label>
        <Select
          items={{ ACTIVE: "ACTIVE", MANAGED: "MANAGED", RESOLVED: "RESOLVED" }}
          name="status"
          defaultValue="ACTIVE"
        >
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["ACTIVE", "MANAGED", "RESOLVED"].map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cd-notes">Notes</Label>
        <Textarea id="cd-notes" name="notes" />
      </div>
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Add Condition"}</Button>
    </form>
  )
}

function VaccinationForm({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const [pending, startTransition] = useTransition()
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        startTransition(async () => {
          try {
            await addVaccination(patientId, {
              vaccineName: String(fd.get("vaccineName") || ""),
              doseNumber: Number(fd.get("doseNumber") || 1),
              dateGiven: new Date(String(fd.get("dateGiven"))),
              nextDueDate: fd.get("nextDueDate") ? new Date(String(fd.get("nextDueDate"))) : undefined,
              batchNumber: String(fd.get("batchNumber") || "") || undefined,
              administeredBy: String(fd.get("administeredBy") || "") || undefined,
            })
            toast.success("Vaccination added")
            onDone()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not add vaccination")
          }
        })
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label htmlFor="vaccineName">Vaccine name</Label>
          <Input id="vaccineName" name="vaccineName" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="doseNumber">Dose number</Label>
          <Input id="doseNumber" name="doseNumber" type="number" min={1} defaultValue={1} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dateGiven">Date given</Label>
          <Input id="dateGiven" name="dateGiven" type="date" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nextDueDate">Next due</Label>
          <Input id="nextDueDate" name="nextDueDate" type="date" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="batchNumber">Batch number</Label>
          <Input id="batchNumber" name="batchNumber" />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label htmlFor="administeredBy">Administered by</Label>
          <Input id="administeredBy" name="administeredBy" />
        </div>
      </div>
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Add Vaccination"}</Button>
    </form>
  )
}
