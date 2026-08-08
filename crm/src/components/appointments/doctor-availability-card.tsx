"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
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
import {
  addAvailability,
  deleteAvailability,
  addDoctorLeave,
  deleteDoctorLeave,
  type getAllDoctorsWithAvailability,
} from "@/actions/appointments"

type Doctors = Awaited<ReturnType<typeof getAllDoctorsWithAvailability>>
type Doctor = Doctors[number]

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export function DoctorAvailabilityCard({ doctor }: { doctor: Doctor }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Dr. {doctor.name}</CardTitle>
        <p className="text-xs text-muted-foreground">{doctor.specialization}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Weekly Schedule</p>
            <EntityDialog title="Add Availability Slot" triggerLabel="Add Slot">
              {(close) => <AvailabilityForm doctorId={doctor.id} onDone={close} />}
            </EntityDialog>
          </div>
          <div className="space-y-1.5">
            {doctor.doctorAvailabilities.length === 0 && (
              <p className="text-sm text-muted-foreground">No recurring slots configured.</p>
            )}
            {doctor.doctorAvailabilities.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border px-3 py-1.5 text-sm">
                <span>
                  {dayNames[a.dayOfWeek]} · {a.startTime}–{a.endTime}
                </span>
                <DeleteButton onDelete={() => deleteAvailability(a.id)} />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Leave</p>
            <EntityDialog title="Add Leave" triggerLabel="Add Leave">
              {(close) => <LeaveForm doctorId={doctor.id} onDone={close} />}
            </EntityDialog>
          </div>
          <div className="space-y-1.5">
            {doctor.doctorLeaves.length === 0 && <p className="text-sm text-muted-foreground">No leave scheduled.</p>}
            {doctor.doctorLeaves.map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-lg border px-3 py-1.5 text-sm">
                <span className="flex items-center gap-2">
                  <Badge variant="outline">{formatDate(l.date)}</Badge>
                  {l.reason}
                </span>
                <DeleteButton onDelete={() => deleteDoctorLeave(l.id)} />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AvailabilityForm({ doctorId, onDone }: { doctorId: string; onDone: () => void }) {
  const [pending, startTransition] = useTransition()
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        startTransition(async () => {
          try {
            await addAvailability(doctorId, {
              dayOfWeek: Number(fd.get("dayOfWeek")),
              startTime: String(fd.get("startTime")),
              endTime: String(fd.get("endTime")),
              slotDurationMinutes: Number(fd.get("slotDurationMinutes") || 30),
            })
            toast.success("Slot added")
            onDone()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not add slot")
          }
        })
      }}
    >
      <div className="space-y-1.5">
        <Label>Day of week</Label>
        <Select
          items={Object.fromEntries(dayNames.map((name, idx) => [String(idx), name]))}
          name="dayOfWeek"
          defaultValue="1"
        >
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {dayNames.map((name, idx) => (
              <SelectItem key={idx} value={String(idx)}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="startTime">Start time</Label>
          <Input id="startTime" name="startTime" type="time" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endTime">End time</Label>
          <Input id="endTime" name="endTime" type="time" required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="slotDurationMinutes">Slot duration (min)</Label>
        <Input id="slotDurationMinutes" name="slotDurationMinutes" type="number" defaultValue={30} />
      </div>
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Add Slot"}</Button>
    </form>
  )
}

function LeaveForm({ doctorId, onDone }: { doctorId: string; onDone: () => void }) {
  const [pending, startTransition] = useTransition()
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        startTransition(async () => {
          try {
            await addDoctorLeave(doctorId, new Date(String(fd.get("date"))), String(fd.get("reason") || "") || undefined)
            toast.success("Leave added")
            onDone()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not add leave")
          }
        })
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="leave-date">Date</Label>
        <Input id="leave-date" name="date" type="date" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="leave-reason">Reason</Label>
        <Input id="leave-reason" name="reason" />
      </div>
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Add Leave"}</Button>
    </form>
  )
}
