"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { UserPlus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PatientPicker } from "@/components/appointments/patient-picker"
import { createWalkIn } from "@/actions/appointments"

type Doctor = { id: string; name: string; specialization: string | null }

export function WalkInDialog({ doctors }: { doctors: Doctor[] }) {
  const [open, setOpen] = useState(false)
  const [patientId, setPatientId] = useState("")
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? "")
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-1.5">
            <UserPlus className="h-4 w-4" />
            New Walk-in
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register Walk-in</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            if (!patientId) {
              toast.error("Select a patient")
              return
            }
            startTransition(async () => {
              try {
                const apt = await createWalkIn({
                  patientId,
                  doctorId,
                  reason: String(fd.get("reason") || "") || undefined,
                })
                toast.success(`${apt.appointmentCode} added to the queue`)
                setOpen(false)
                setPatientId("")
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not register walk-in")
              }
            })
          }}
        >
          <div className="space-y-1.5">
            <Label>Patient</Label>
            <PatientPicker value={patientId} onChange={setPatientId} />
          </div>
          <div className="space-y-1.5">
            <Label>Doctor</Label>
            <Select
              items={Object.fromEntries(doctors.map((d) => [d.id, `Dr. ${d.name}${d.specialization ? ` — ${d.specialization}` : ""}`]))}
              value={doctorId}
              onValueChange={(value) => setDoctorId(value ?? "")}
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
          <div className="space-y-1.5">
            <Label htmlFor="wi-reason">Reason</Label>
            <Textarea id="wi-reason" name="reason" />
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Issuing token…" : "Check In Now"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
