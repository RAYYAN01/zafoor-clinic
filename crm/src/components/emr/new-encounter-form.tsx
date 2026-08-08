"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createEncounter } from "@/actions/encounters"

type Doctor = { id: string; name: string; specialization: string | null }

export function NewEncounterForm({ patientId, doctors }: { patientId: string; doctors: Doctor[] }) {
  const router = useRouter()
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? "")
  const [pending, startTransition] = useTransition()

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-1.5">
          <Label>Attending doctor</Label>
          <Select
            items={Object.fromEntries(doctors.map((d) => [d.id, `Dr. ${d.name}${d.specialization ? ` — ${d.specialization}` : ""}`]))}
            value={doctorId}
            onValueChange={(v) => setDoctorId(v ?? "")}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {doctors.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  Dr. {d.name}{d.specialization ? ` — ${d.specialization}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          className="w-full"
          disabled={pending || !doctorId}
          onClick={() =>
            startTransition(async () => {
              try {
                const encounter = await createEncounter({ patientId, doctorId })
                router.push(`/patients/${patientId}/encounters/${encounter.id}`)
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not start consultation")
              }
            })
          }
        >
          {pending ? "Starting…" : "Start Consultation"}
        </Button>
      </CardContent>
    </Card>
  )
}
