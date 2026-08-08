import Link from "next/link"
import { Plus, Stethoscope } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDateTime } from "@/lib/format"
import type { getEncountersForPatient } from "@/actions/encounters"

type Encounters = Awaited<ReturnType<typeof getEncountersForPatient>>

export function EncountersTab({ patientId, encounters }: { patientId: string; encounters: Encounters }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          className="gap-1.5"
          nativeButton={false}
          render={
            <Link href={`/patients/${patientId}/encounters/new`}>
              <Plus className="h-4 w-4" />
              New Consultation
            </Link>
          }
        />
      </div>

      {encounters.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No consultations recorded yet.
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {encounters.map((e) => {
          const primaryDx = e.diagnoses.find((d) => d.type === "PRIMARY") ?? e.diagnoses[0]
          return (
            <Link key={e.id} href={`/patients/${patientId}/encounters/${e.id}`}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Stethoscope className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {e.chiefComplaints.length > 0 ? e.chiefComplaints.join(", ") : "Consultation"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      Dr. {e.doctor.name} · {formatDateTime(e.encounterDate)}
                      {primaryDx ? ` · ${primaryDx.description}` : ""}
                    </p>
                  </div>
                  <Badge variant={e.status === "FINALIZED" ? "default" : "secondary"}>
                    {e.status === "FINALIZED" ? "Signed" : "Draft"}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
