"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PatientPicker } from "@/components/appointments/patient-picker"
import { getAvailableSlots, bookAppointment } from "@/actions/appointments"
import { appointmentTypeLabels } from "@/lib/labels"

type Doctor = { id: string; name: string; specialization: string | null }
type InitialPatient = { id: string; name: string; uhid: string; phone: string } | null

export function BookingForm({ doctors, initialPatient }: { doctors: Doctor[]; initialPatient: InitialPatient }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [patientId, setPatientId] = useState(initialPatient?.id ?? "")
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? "")
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [type, setType] = useState<"IN_PERSON" | "VIDEO">("IN_PERSON")
  const [reason, setReason] = useState("")
  const [slots, setSlots] = useState<Date[]>([])
  const [onLeave, setOnLeave] = useState<{ onLeave: boolean; reason?: string | null }>({ onLeave: false })
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)

  useEffect(() => {
    if (!doctorId || !date) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading indicator for the async slot fetch below
    setLoadingSlots(true)
    setSelectedSlot(null)
    getAvailableSlots(doctorId, new Date(`${date}T00:00:00`))
      .then((res) => {
        setSlots(res.slots)
        setOnLeave({ onLeave: res.onLeave, reason: res.reason })
      })
      .finally(() => setLoadingSlots(false))
  }, [doctorId, date])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!patientId) {
      toast.error("Select a patient")
      return
    }
    if (!selectedSlot) {
      toast.error("Select a time slot")
      return
    }
    startTransition(async () => {
      try {
        await bookAppointment({
          patientId,
          doctorId,
          scheduledAt: new Date(selectedSlot),
          durationMinutes: 15,
          type,
          reason,
        })
        toast.success("Appointment booked")
        router.push(`/patients/${patientId}`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not book appointment")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Patient</CardTitle></CardHeader>
        <CardContent>
          <PatientPicker value={patientId} onChange={setPatientId} initial={initialPatient} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Doctor & Type</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
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
            <Label>Consultation type</Label>
            <Select
              items={{ IN_PERSON: appointmentTypeLabels.IN_PERSON, VIDEO: appointmentTypeLabels.VIDEO }}
              value={type}
              onValueChange={(v) => setType((v ?? "IN_PERSON") as "IN_PERSON" | "VIDEO")}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="IN_PERSON">{appointmentTypeLabels.IN_PERSON}</SelectItem>
                <SelectItem value="VIDEO">{appointmentTypeLabels.VIDEO}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Date & Time</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={date} min={format(new Date(), "yyyy-MM-dd")} onChange={(e) => setDate(e.target.value)} className="w-48" />
          </div>

          {loadingSlots && <p className="text-sm text-muted-foreground">Loading available slots…</p>}
          {!loadingSlots && onLeave.onLeave && (
            <p className="text-sm text-amber-600">Doctor is on leave{onLeave.reason ? `: ${onLeave.reason}` : ""}.</p>
          )}
          {!loadingSlots && !onLeave.onLeave && slots.length === 0 && (
            <p className="text-sm text-muted-foreground">No slots available for this date.</p>
          )}
          {!loadingSlots && slots.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => {
                const iso = slot.toISOString()
                const isSelected = selectedSlot === iso
                return (
                  <Button
                    key={iso}
                    type="button"
                    size="sm"
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => setSelectedSlot(iso)}
                  >
                    {format(slot, "hh:mm a")}
                  </Button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Reason for visit</CardTitle></CardHeader>
        <CardContent>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional" />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={pending}>{pending ? "Booking…" : "Book Appointment"}</Button>
      </div>
    </form>
  )
}
