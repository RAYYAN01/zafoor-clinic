"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDateTime } from "@/lib/format"
import { meetingStatusLabels, meetingStatusColors, attendeeResponseLabels } from "@/lib/labels"
import { createMeeting, updateMeetingStatus, type getMeetings } from "@/actions/meetings"

type Meetings = Awaited<ReturnType<typeof getMeetings>>
type Staff = { id: string; name: string }[]

export function MeetingsBoard({ meetings, staff }: { meetings: Meetings; staff: Staff }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Schedule Meeting
        </Button>
      </div>

      {meetings.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No meetings scheduled.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {meetings.map((m) => (
            <MeetingRow key={m.id} meeting={m} />
          ))}
        </div>
      )}

      <NewMeetingDialog open={open} onOpenChange={setOpen} staff={staff} />
    </div>
  )
}

function MeetingRow({ meeting }: { meeting: Meetings[number] }) {
  const [pending, startTransition] = useTransition()

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{meeting.title}</p>
            <Badge variant="secondary" className={meetingStatusColors[meeting.status]}>{meetingStatusLabels[meeting.status]}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDateTime(meeting.startTime)} · Organized by {meeting.organizer.name}
            {meeting.location ? ` · ${meeting.location}` : ""}
          </p>
          <p className="text-xs text-muted-foreground/80 mt-1">
            {meeting.attendees.map((a) => `${a.user.name} (${attendeeResponseLabels[a.response]})`).join(", ")}
          </p>
        </div>
        {meeting.status === "SCHEDULED" && (
          <Select
            items={meetingStatusLabels}
            value={meeting.status}
            onValueChange={(v) => {
              if (!v) return
              startTransition(async () => {
                try {
                  await updateMeetingStatus(meeting.id, { status: v as never })
                } catch {
                  toast.error("Could not update meeting")
                }
              })
            }}
          >
            <SelectTrigger className="h-7 w-[120px] text-xs shrink-0" disabled={pending}><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(meetingStatusLabels).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}
            </SelectContent>
          </Select>
        )}
      </CardContent>
    </Card>
  )
}

function NewMeetingDialog({ open, onOpenChange, staff }: { open: boolean; onOpenChange: (v: boolean) => void; staff: Staff }) {
  const [selected, setSelected] = useState<string[]>([])
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Schedule Meeting</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              try {
                await createMeeting({
                  title: String(fd.get("title") || ""),
                  startTime: String(fd.get("startTime") || ""),
                  endTime: String(fd.get("endTime") || ""),
                  location: String(fd.get("location") || "") || undefined,
                  meetingLink: String(fd.get("meetingLink") || "") || undefined,
                  notes: String(fd.get("notes") || "") || undefined,
                  attendeeIds: selected,
                })
                toast.success("Meeting scheduled")
                onOpenChange(false)
                setSelected([])
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not schedule meeting")
              }
            })
          }}
        >
          <div className="space-y-1.5"><Label htmlFor="title">Title</Label><Input id="title" name="title" required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="startTime">Start</Label><Input id="startTime" name="startTime" type="datetime-local" required /></div>
            <div className="space-y-1.5"><Label htmlFor="endTime">End</Label><Input id="endTime" name="endTime" type="datetime-local" required /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="location">Location</Label><Input id="location" name="location" /></div>
            <div className="space-y-1.5"><Label htmlFor="meetingLink">Meeting link</Label><Input id="meetingLink" name="meetingLink" /></div>
          </div>
          <div className="space-y-1.5">
            <Label>Attendees</Label>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {staff.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm rounded-md px-2 py-1.5 hover:bg-muted">
                  <Checkbox
                    checked={selected.includes(s.id)}
                    onCheckedChange={(v) => setSelected((prev) => (v ? [...prev, s.id] : prev.filter((id) => id !== s.id)))}
                  />
                  {s.name}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="notes">Notes</Label><Textarea id="notes" name="notes" /></div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Scheduling…" : "Schedule Meeting"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
