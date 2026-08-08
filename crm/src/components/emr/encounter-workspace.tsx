import Link from "next/link"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChiefComplaintsEditor } from "@/components/emr/chief-complaints-editor"
import { VitalsForm } from "@/components/emr/vitals-form"
import { DiagnosesPanel } from "@/components/emr/diagnoses-panel"
import { SoapNoteEditor } from "@/components/emr/soap-note-editor"
import { EncounterPrescriptionsPanel } from "@/components/emr/encounter-prescriptions-panel"
import { SignEncounterDialog } from "@/components/emr/sign-encounter-dialog"
import { calculateAge, formatDateTime, patientDisplayName } from "@/lib/format"
import { alertSeverityColors, alertSeverityLabels } from "@/lib/labels"
import type { getEncounter } from "@/actions/encounters"

type Encounter = NonNullable<Awaited<ReturnType<typeof getEncounter>>>
type Template = { id: string; name: string; subjective: string | null; objective: string | null; assessment: string | null; plan: string | null }

export function EncounterWorkspace({
  encounter,
  templates,
  signatureUrl,
}: {
  encounter: Encounter
  templates: Template[]
  signatureUrl: string | null
}) {
  const readOnly = encounter.status === "FINALIZED"
  const activeAlerts = encounter.patient.medicalAlerts.filter((a) => a.active)
  const latestVitals = encounter.vitals[0] ?? null

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/patients/${encounter.patientId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to patient profile
        </Link>
      </div>

      <div className="rounded-xl border bg-background p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{patientDisplayName(encounter.patient)}</h1>
              <Badge variant="outline" className="font-mono text-xs">{encounter.patient.uhid}</Badge>
              <Badge variant={readOnly ? "default" : "secondary"}>{readOnly ? "Finalized" : "Draft"}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {calculateAge(encounter.patient.dob) ?? "—"} yrs · {encounter.patient.gender ?? "—"} · Dr. {encounter.doctor.name}
              {" · "}
              {formatDateTime(encounter.encounterDate)}
            </p>
          </div>
          {!readOnly && (
            <SignEncounterDialog encounterId={encounter.id} doctorName={encounter.doctor.name} signatureUrl={signatureUrl} />
          )}
          {readOnly && signatureUrl && (
            <div className="text-right">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={signatureUrl} alt="Doctor signature" className="h-10 ml-auto" />
              <p className="text-xs text-muted-foreground">Signed by Dr. {encounter.doctor.name}</p>
            </div>
          )}
        </div>

        {(activeAlerts.length > 0 || encounter.patient.allergies.length > 0) && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
            <div className="flex items-center gap-1.5 text-red-700 dark:text-red-400 text-xs font-medium">
              <AlertTriangle className="h-3.5 w-3.5" />
              Safety Alerts
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {activeAlerts.map((a) => (
                <Badge key={a.id} className={alertSeverityColors[a.severity]} variant="secondary">
                  {alertSeverityLabels[a.severity]} · {a.description}
                </Badge>
              ))}
              {encounter.patient.allergies.map((a) => (
                <Badge key={a.id} className={alertSeverityColors[a.severity]} variant="secondary">
                  Allergy: {a.allergen}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <CardHeader><CardTitle className="text-base">Chief Complaints</CardTitle></CardHeader>
            <CardContent>
              <ChiefComplaintsEditor encounterId={encounter.id} initial={encounter.chiefComplaints} readOnly={readOnly} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Vitals</CardTitle></CardHeader>
            <CardContent>
              <VitalsForm
                encounterId={encounter.id}
                patientId={encounter.patientId}
                initial={latestVitals}
                readOnly={readOnly}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Diagnoses</CardTitle></CardHeader>
            <CardContent>
              <DiagnosesPanel
                encounterId={encounter.id}
                patientId={encounter.patientId}
                diagnoses={encounter.diagnoses}
                readOnly={readOnly}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <SoapNoteEditor
                encounterId={encounter.id}
                initial={{
                  subjective: encounter.clinicalNote?.subjective ?? "",
                  objective: encounter.clinicalNote?.objective ?? "",
                  assessment: encounter.clinicalNote?.assessment ?? "",
                  plan: encounter.clinicalNote?.plan ?? "",
                }}
                templates={templates}
                versions={encounter.clinicalNote?.versions ?? []}
                readOnly={readOnly}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Prescriptions</CardTitle></CardHeader>
            <CardContent>
              <EncounterPrescriptionsPanel
                encounterId={encounter.id}
                patientId={encounter.patientId}
                doctorId={encounter.doctorId}
                prescriptions={encounter.prescriptions}
                readOnly={readOnly}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
