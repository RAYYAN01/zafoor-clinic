import { AlertTriangle, HeartPulse, ShieldCheck, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { alertSeverityColors, alertSeverityLabels } from "@/lib/labels"
import { formatDate } from "@/lib/format"
import type { getPatientById } from "@/actions/patients"

type Patient = NonNullable<Awaited<ReturnType<typeof getPatientById>>>

export function OverviewTab({ patient }: { patient: Patient }) {
  const activeAlerts = patient.medicalAlerts.filter((a) => a.active)
  const primaryInsurance = patient.insurances.find((i) => i.isPrimary) ?? patient.insurances[0]
  const primaryEmergencyContact = patient.emergencyContacts[0]

  return (
    <div className="space-y-4">
      {activeAlerts.length > 0 && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <CardTitle className="text-base text-red-700 dark:text-red-400">Medical Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-2 text-sm">
                <Badge className={alertSeverityColors[alert.severity]} variant="secondary">
                  {alertSeverityLabels[alert.severity]}
                </Badge>
                <span>{alert.description}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <HeartPulse className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Allergies & Conditions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {patient.allergies.length === 0 && patient.chronicDiseases.length === 0 && (
              <p className="text-muted-foreground">None recorded</p>
            )}
            {patient.allergies.map((a) => (
              <div key={a.id} className="flex items-center justify-between">
                <span>{a.allergen}</span>
                <Badge variant="secondary" className={alertSeverityColors[a.severity]}>
                  {alertSeverityLabels[a.severity]}
                </Badge>
              </div>
            ))}
            {patient.chronicDiseases.map((c) => (
              <div key={c.id} className="flex items-center justify-between">
                <span>{c.name}</span>
                <Badge variant="outline">{c.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Insurance</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            {!primaryInsurance && <p className="text-muted-foreground">No insurance on file</p>}
            {primaryInsurance && (
              <>
                <p className="font-medium">{primaryInsurance.provider}</p>
                <p className="text-muted-foreground">Policy {primaryInsurance.policyNumber}</p>
                {primaryInsurance.validTo && (
                  <p className="text-muted-foreground">Valid till {formatDate(primaryInsurance.validTo)}</p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            {!primaryEmergencyContact && <p className="text-muted-foreground">None recorded</p>}
            {primaryEmergencyContact && (
              <>
                <p className="font-medium">{primaryEmergencyContact.name}</p>
                <p className="text-muted-foreground">
                  {primaryEmergencyContact.relation} · {primaryEmergencyContact.phone}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registration</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1 text-muted-foreground">
            <p>Registered on {formatDate(patient.createdAt)}</p>
            {patient.registeredBy && <p>By {patient.registeredBy.name}</p>}
            <p>
              {[patient.addressLine1, patient.addressLine2, patient.city, patient.state, patient.postalCode]
                .filter(Boolean)
                .join(", ") || "No address on file"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Family Members</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            {patient.familyMembers.length === 0 && <p className="text-muted-foreground">None recorded</p>}
            {patient.familyMembers.map((f) => (
              <div key={f.id} className="flex justify-between">
                <span>{f.name}</span>
                <span className="text-muted-foreground">{f.relation}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
