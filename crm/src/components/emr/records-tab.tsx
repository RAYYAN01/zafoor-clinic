"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"
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
import { createClinicalReport, deleteClinicalReport, type getClinicalReports } from "@/actions/reports"
import {
  createDischargeSummary,
  signDischargeSummary,
  createReferralNote,
  signReferralNote,
  createCertificate,
  signCertificate,
  type getPatientRecords,
} from "@/actions/records"

type Reports = Awaited<ReturnType<typeof getClinicalReports>>
type Records = Awaited<ReturnType<typeof getPatientRecords>>
type Admission = { id: string; admittedAt: Date; wardType: string | null; status: string }

export function RecordsTab({
  patientId,
  reports,
  records,
  admissions,
}: {
  patientId: string
  reports: Reports
  records: Records
  admissions: Admission[]
}) {
  const labReports = reports.filter((r) => r.type === "LAB")
  const radiologyReports = reports.filter((r) => r.type === "RADIOLOGY")

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Lab Reports</CardTitle>
          <EntityDialog title="Add Lab Report">
            {(close) => <ReportForm patientId={patientId} type="LAB" onDone={close} />}
          </EntityDialog>
        </CardHeader>
        <CardContent className="space-y-3">
          {labReports.length === 0 && <p className="text-sm text-muted-foreground">None recorded.</p>}
          {labReports.map((r) => (
            <ReportRow key={r.id} patientId={patientId} report={r} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Radiology Reports</CardTitle>
          <EntityDialog title="Add Radiology Report">
            {(close) => <ReportForm patientId={patientId} type="RADIOLOGY" onDone={close} />}
          </EntityDialog>
        </CardHeader>
        <CardContent className="space-y-3">
          {radiologyReports.length === 0 && <p className="text-sm text-muted-foreground">None recorded.</p>}
          {radiologyReports.map((r) => (
            <ReportRow key={r.id} patientId={patientId} report={r} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Discharge Summaries</CardTitle>
          {admissions.length > 0 && (
            <EntityDialog title="Create Discharge Summary">
              {(close) => <DischargeSummaryForm patientId={patientId} admissions={admissions} onDone={close} />}
            </EntityDialog>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {records.dischargeSummaries.length === 0 && <p className="text-sm text-muted-foreground">None recorded.</p>}
          {records.dischargeSummaries.map((d) => (
            <div key={d.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{d.diagnosis || "Discharge Summary"}</p>
                <SignBadge signedAt={d.signedAt} onSign={() => signDischargeSummary(d.id, patientId)} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Dr. {d.doctor.name} · {formatDate(d.createdAt)}</p>
              {d.hospitalCourse && <p className="text-xs text-muted-foreground mt-1">{d.hospitalCourse}</p>}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Referral Notes</CardTitle>
          <EntityDialog title="Create Referral">
            {(close) => <ReferralForm patientId={patientId} onDone={close} />}
          </EntityDialog>
        </CardHeader>
        <CardContent className="space-y-3">
          {records.referralNotes.length === 0 && <p className="text-sm text-muted-foreground">None recorded.</p>}
          {records.referralNotes.map((r) => (
            <div key={r.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Referred to {r.toDoctor}{r.toSpecialty ? ` (${r.toSpecialty})` : ""}</p>
                <SignBadge signedAt={r.signedAt} onSign={() => signReferralNote(r.id, patientId)} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{r.reason}</p>
              <Badge variant="outline" className="mt-1">{r.urgency}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Certificates</CardTitle>
          <EntityDialog title="Issue Certificate">
            {(close) => <CertificateForm patientId={patientId} onDone={close} />}
          </EntityDialog>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {records.certificates.length === 0 && <p className="text-sm text-muted-foreground">None recorded.</p>}
          {records.certificates.map((c) => (
            <div key={c.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{c.title}</p>
                <SignBadge signedAt={c.signedAt} onSign={() => signCertificate(c.id, patientId)} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{c.type} · Dr. {c.doctor.name}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function SignBadge({ signedAt, onSign }: { signedAt: Date | null; onSign: () => Promise<void> }) {
  const [pending, startTransition] = useTransition()
  if (signedAt) return <Badge variant="default">Signed</Badge>
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await onSign()
            toast.success("Signed")
          } catch {
            toast.error("Could not sign")
          }
        })
      }
    >
      {pending ? "Signing…" : "Sign"}
    </Button>
  )
}

function ReportRow({ patientId, report }: { patientId: string; report: Reports[number] }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium">{report.title}</p>
          <p className="text-xs text-muted-foreground">
            {formatDate(report.reportDate)}{report.modality ? ` · ${report.modality}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={report.status === "COMPLETED" ? "default" : "secondary"}>{report.status}</Badge>
          <DeleteButton onDelete={() => deleteClinicalReport(patientId, report.id)} />
        </div>
      </div>
      {report.impression && <p className="text-xs mt-2">{report.impression}</p>}
      {report.labResults.length > 0 && (
        <div className="mt-2 space-y-1">
          {report.labResults.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-xs">
              <span>{item.testName}</span>
              <span className={item.flag !== "NORMAL" ? "font-medium text-red-600" : "text-muted-foreground"}>
                {item.value} {item.unit} {item.flag !== "NORMAL" && `(${item.flag})`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ReportForm({ patientId, type, onDone }: { patientId: string; type: "LAB" | "RADIOLOGY"; onDone: () => void }) {
  const [pending, startTransition] = useTransition()
  const [labResults, setLabResults] = useState<{ testName: string; value: string; unit: string; referenceRange: string; flag: string }[]>([])

  function addRow() {
    setLabResults((prev) => [...prev, { testName: "", value: "", unit: "", referenceRange: "", flag: "NORMAL" }])
  }
  function updateRow(i: number, field: string, value: string) {
    setLabResults((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)))
  }
  function removeRow(i: number) {
    setLabResults((prev) => prev.filter((_, idx) => idx !== i))
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        startTransition(async () => {
          try {
            await createClinicalReport(
              patientId,
              {
                type,
                title: String(fd.get("title") || ""),
                modality: String(fd.get("modality") || "") || undefined,
                findings: String(fd.get("findings") || "") || undefined,
                impression: String(fd.get("impression") || "") || undefined,
                status: String(fd.get("status") || "PENDING") as never,
                reportDate: String(fd.get("reportDate") || "") || undefined,
              },
              labResults.filter((r) => r.testName.trim() && r.value.trim()).map((r) => ({ ...r, flag: r.flag as never }))
            )
            toast.success("Report added")
            onDone()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not add report")
          }
        })
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="rep-title">Title</Label>
        <Input id="rep-title" name="title" required placeholder={type === "LAB" ? "e.g. Complete Blood Count" : "e.g. Chest X-Ray"} />
      </div>
      {type === "RADIOLOGY" && (
        <div className="space-y-1.5">
          <Label htmlFor="rep-modality">Modality</Label>
          <Input id="rep-modality" name="modality" placeholder="X-RAY, CT, MRI, USG…" />
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="rep-reportDate">Report date</Label>
        <Input id="rep-reportDate" name="reportDate" type="date" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rep-findings">Findings</Label>
        <Textarea id="rep-findings" name="findings" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rep-impression">Impression</Label>
        <Textarea id="rep-impression" name="impression" />
      </div>
      <div className="space-y-1.5">
        <Label>Status</Label>
        <Select items={{ PENDING: "Pending", COMPLETED: "Completed" }} name="status" defaultValue="COMPLETED">
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {type === "LAB" && (
        <div className="space-y-2">
          <Label>Lab values</Label>
          {labResults.map((r, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto] gap-2 rounded-lg border p-2">
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Test" value={r.testName} onChange={(e) => updateRow(i, "testName", e.target.value)} />
                <Input placeholder="Value" value={r.value} onChange={(e) => updateRow(i, "value", e.target.value)} />
                <Input placeholder="Unit" value={r.unit} onChange={(e) => updateRow(i, "unit", e.target.value)} />
                <Input placeholder="Reference range" value={r.referenceRange} onChange={(e) => updateRow(i, "referenceRange", e.target.value)} />
                <Select
                  items={{ NORMAL: "Normal", LOW: "Low", HIGH: "High", CRITICAL: "Critical" }}
                  value={r.flag}
                  onValueChange={(v) => updateRow(i, "flag", v ?? "NORMAL")}
                >
                  <SelectTrigger className="w-full h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" size="icon" variant="ghost" onClick={() => removeRow(i)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={addRow}>
            <Plus className="h-3.5 w-3.5" />
            Add Value
          </Button>
        </div>
      )}

      <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Add Report"}</Button>
    </form>
  )
}

function DischargeSummaryForm({ patientId, admissions, onDone }: { patientId: string; admissions: Admission[]; onDone: () => void }) {
  const [pending, startTransition] = useTransition()
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        startTransition(async () => {
          try {
            await createDischargeSummary(String(fd.get("admissionId")), patientId, {
              diagnosis: String(fd.get("diagnosis") || "") || undefined,
              proceduresPerformed: String(fd.get("proceduresPerformed") || "") || undefined,
              hospitalCourse: String(fd.get("hospitalCourse") || "") || undefined,
              medicationsOnDischarge: String(fd.get("medicationsOnDischarge") || "") || undefined,
              followUpInstructions: String(fd.get("followUpInstructions") || "") || undefined,
              conditionAtDischarge: String(fd.get("conditionAtDischarge") || "") || undefined,
            })
            toast.success("Discharge summary created")
            onDone()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not create discharge summary")
          }
        })
      }}
    >
      <div className="space-y-1.5">
        <Label>Admission</Label>
        <Select
          items={Object.fromEntries(admissions.map((a) => [a.id, `${a.wardType ?? "Ward"} · ${formatDate(a.admittedAt)}`]))}
          name="admissionId"
          defaultValue={admissions[0]?.id}
        >
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {admissions.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.wardType ?? "Ward"} · {formatDate(a.admittedAt)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ds-diagnosis">Diagnosis</Label>
        <Input id="ds-diagnosis" name="diagnosis" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ds-procedures">Procedures performed</Label>
        <Textarea id="ds-procedures" name="proceduresPerformed" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ds-course">Hospital course</Label>
        <Textarea id="ds-course" name="hospitalCourse" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ds-meds">Medications on discharge</Label>
        <Textarea id="ds-meds" name="medicationsOnDischarge" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ds-followup">Follow-up instructions</Label>
        <Textarea id="ds-followup" name="followUpInstructions" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ds-condition">Condition at discharge</Label>
        <Input id="ds-condition" name="conditionAtDischarge" placeholder="Stable, improved…" />
      </div>
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Create"}</Button>
    </form>
  )
}

function ReferralForm({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const [pending, startTransition] = useTransition()
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        startTransition(async () => {
          try {
            await createReferralNote(patientId, {
              toDoctor: String(fd.get("toDoctor") || ""),
              toSpecialty: String(fd.get("toSpecialty") || "") || undefined,
              reason: String(fd.get("reason") || ""),
              notes: String(fd.get("notes") || "") || undefined,
              urgency: String(fd.get("urgency") || "ROUTINE") as never,
            })
            toast.success("Referral created")
            onDone()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not create referral")
          }
        })
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="ref-toDoctor">Referred to</Label>
        <Input id="ref-toDoctor" name="toDoctor" required placeholder="Dr. name or hospital" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ref-toSpecialty">Specialty</Label>
        <Input id="ref-toSpecialty" name="toSpecialty" placeholder="e.g. Neurology" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ref-reason">Reason</Label>
        <Textarea id="ref-reason" name="reason" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ref-notes">Notes</Label>
        <Textarea id="ref-notes" name="notes" />
      </div>
      <div className="space-y-1.5">
        <Label>Urgency</Label>
        <Select items={{ ROUTINE: "Routine", URGENT: "Urgent" }} name="urgency" defaultValue="ROUTINE">
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ROUTINE">Routine</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Create Referral"}</Button>
    </form>
  )
}

function CertificateForm({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const [pending, startTransition] = useTransition()
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        startTransition(async () => {
          try {
            await createCertificate(patientId, {
              type: String(fd.get("type") || "MEDICAL") as never,
              title: String(fd.get("title") || ""),
              content: String(fd.get("content") || ""),
              validFrom: String(fd.get("validFrom") || "") || undefined,
              validTo: String(fd.get("validTo") || "") || undefined,
            })
            toast.success("Certificate issued")
            onDone()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not issue certificate")
          }
        })
      }}
    >
      <div className="space-y-1.5">
        <Label>Type</Label>
        <Select
          items={{ FITNESS: "Fitness", SICK_LEAVE: "Sick Leave", MEDICAL: "Medical", VACCINATION: "Vaccination", OTHER: "Other" }}
          name="type"
          defaultValue="MEDICAL"
        >
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="FITNESS">Fitness</SelectItem>
            <SelectItem value="SICK_LEAVE">Sick Leave</SelectItem>
            <SelectItem value="MEDICAL">Medical</SelectItem>
            <SelectItem value="VACCINATION">Vaccination</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cert-title">Title</Label>
        <Input id="cert-title" name="title" required placeholder="e.g. Fitness to Work Certificate" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cert-content">Content</Label>
        <Textarea id="cert-content" name="content" required rows={5} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="cert-validFrom">Valid from</Label>
          <Input id="cert-validFrom" name="validFrom" type="date" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cert-validTo">Valid to</Label>
          <Input id="cert-validTo" name="validTo" type="date" />
        </div>
      </div>
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Issue Certificate"}</Button>
    </form>
  )
}
