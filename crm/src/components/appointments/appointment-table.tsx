"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { isToday } from "date-fns"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MoreHorizontal } from "lucide-react"
import { formatDateTime } from "@/lib/format"
import { appointmentStatusColors, appointmentStatusLabels, appointmentTypeLabels } from "@/lib/labels"
import { cancelAppointment, checkInAppointment, rescheduleAppointment } from "@/actions/appointments"
import type { getAppointments } from "@/actions/appointments"

type Appointments = Awaited<ReturnType<typeof getAppointments>>["appointments"]

export function AppointmentTable({ appointments }: { appointments: Appointments }) {
  if (appointments.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">No appointments found.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Patient</TableHead>
          <TableHead>Doctor</TableHead>
          <TableHead>Date & Time</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {appointments.map((apt) => (
          <AppointmentRow key={apt.id} appointment={apt} />
        ))}
      </TableBody>
    </Table>
  )
}

function AppointmentRow({ appointment: apt }: { appointment: Appointments[number] }) {
  const [pending, startTransition] = useTransition()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)

  const canCheckIn = ["SCHEDULED", "CONFIRMED"].includes(apt.status) && isToday(apt.scheduledAt)
  const canCancel = ["SCHEDULED", "CONFIRMED", "CHECKED_IN"].includes(apt.status)
  const canReschedule = ["SCHEDULED", "CONFIRMED"].includes(apt.status)

  return (
    <TableRow>
      <TableCell>
        <Link href={`/patients/${apt.patientId}`} className="font-medium hover:underline">
          {apt.patient.firstName} {apt.patient.lastName}
        </Link>
        <p className="text-xs text-muted-foreground">{apt.patient.uhid}</p>
      </TableCell>
      <TableCell>Dr. {apt.doctor.name}</TableCell>
      <TableCell>{formatDateTime(apt.scheduledAt)}</TableCell>
      <TableCell>{appointmentTypeLabels[apt.type]}</TableCell>
      <TableCell>
        <Badge variant="secondary" className={appointmentStatusColors[apt.status]}>
          {appointmentStatusLabels[apt.status]}
        </Badge>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            {canCheckIn && (
              <DropdownMenuItem
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    try {
                      await checkInAppointment(apt.id)
                      toast.success("Patient checked in")
                    } catch {
                      toast.error("Could not check in")
                    }
                  })
                }
              >
                Check In
              </DropdownMenuItem>
            )}
            {canReschedule && (
              <DropdownMenuItem onClick={() => setRescheduleOpen(true)}>Reschedule</DropdownMenuItem>
            )}
            {canCancel && (
              <DropdownMenuItem onClick={() => setCancelOpen(true)} className="text-destructive">
                Cancel
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>

      <CancelDialog open={cancelOpen} onOpenChange={setCancelOpen} appointmentId={apt.id} />
      <RescheduleDialog open={rescheduleOpen} onOpenChange={setRescheduleOpen} appointmentId={apt.id} />
    </TableRow>
  )
}

function CancelDialog({
  open,
  onOpenChange,
  appointmentId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointmentId: string
}) {
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Appointment</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              try {
                await cancelAppointment(appointmentId, String(fd.get("reason") || ""))
                toast.success("Appointment cancelled")
                onOpenChange(false)
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not cancel appointment")
              }
            })
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="cancel-reason">Reason</Label>
            <Textarea id="cancel-reason" name="reason" required />
          </div>
          <Button type="submit" variant="destructive" disabled={pending} className="w-full">
            {pending ? "Cancelling…" : "Cancel Appointment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RescheduleDialog({
  open,
  onOpenChange,
  appointmentId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointmentId: string
}) {
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reschedule Appointment</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            const value = String(fd.get("scheduledAt") || "")
            startTransition(async () => {
              try {
                await rescheduleAppointment(appointmentId, new Date(value))
                toast.success("Appointment rescheduled")
                onOpenChange(false)
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not reschedule appointment")
              }
            })
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="scheduledAt">New date & time</Label>
            <Input id="scheduledAt" name="scheduledAt" type="datetime-local" required />
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Saving…" : "Reschedule"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
