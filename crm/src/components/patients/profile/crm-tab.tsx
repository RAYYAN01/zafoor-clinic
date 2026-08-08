"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Pin, PinOff, Star } from "lucide-react"
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
import { formatDate, formatDateTime } from "@/lib/format"
import { commChannelLabels, followUpStatusLabels } from "@/lib/labels"
import {
  addNote,
  deleteNote,
  togglePinNote,
  addFollowUp,
  updateFollowUpStatus,
  logMessage,
} from "@/actions/crm"
import type { getPatientCrmData } from "@/actions/crm"

type CrmData = Awaited<ReturnType<typeof getPatientCrmData>>
type Staff = { id: string; name: string; role: string }

export function CrmTab({
  patientId,
  data,
  staff,
}: {
  patientId: string
  data: CrmData
  staff: Staff[]
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Notes</CardTitle>
          <EntityDialog title="Add Note">
            {(close) => <NoteForm patientId={patientId} onDone={close} />}
          </EntityDialog>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.notes.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
          {data.notes.map((note) => (
            <div key={note.id} className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{note.category}</Badge>
                  {note.pinned && <Badge variant="secondary">Pinned</Badge>}
                </div>
                <div className="flex items-center gap-1">
                  <PinToggle patientId={patientId} id={note.id} pinned={note.pinned} />
                  <DeleteButton onDelete={() => deleteNote(patientId, note.id)} />
                </div>
              </div>
              <p className="text-sm mt-2">{note.body}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {note.author?.name ?? "Staff"} · {formatDateTime(note.createdAt)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Follow-ups</CardTitle>
          <EntityDialog title="Add Follow-up">
            {(close) => <FollowUpForm patientId={patientId} staff={staff} onDone={close} />}
          </EntityDialog>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.followUps.length === 0 && <p className="text-sm text-muted-foreground">No follow-ups scheduled.</p>}
          {data.followUps.map((f) => (
            <div key={f.id} className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{f.reason}</p>
                  <p className="text-xs text-muted-foreground">
                    Due {formatDate(f.dueDate)}
                    {f.assignedTo ? ` · ${f.assignedTo.name}` : ""}
                  </p>
                </div>
                <FollowUpStatusSelect id={f.id} status={f.status} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Communication Log</CardTitle>
          <EntityDialog title="Log Message">
            {(close) => <MessageForm patientId={patientId} onDone={close} />}
          </EntityDialog>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.messages.length === 0 && <p className="text-sm text-muted-foreground">No messages logged.</p>}
          {data.messages.map((m) => (
            <div key={m.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline">{commChannelLabels[m.channel]}</Badge>
                <span className="text-xs text-muted-foreground">{formatDateTime(m.sentAt)}</span>
              </div>
              {m.subject && <p className="text-sm font-medium mt-1">{m.subject}</p>}
              <p className="text-sm text-muted-foreground mt-1">{m.body}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.feedback.length === 0 && <p className="text-sm text-muted-foreground">No feedback submitted.</p>}
          {data.feedback.map((f) => (
            <div key={f.id} className="rounded-lg border p-3">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i < f.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
                  />
                ))}
              </div>
              {f.comment && <p className="text-sm mt-1">{f.comment}</p>}
              <p className="text-xs text-muted-foreground mt-1">{formatDate(f.createdAt)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function PinToggle({ patientId, id, pinned }: { patientId: string; id: string; pinned: boolean }) {
  const [pending, startTransition] = useTransition()
  return (
    <Button
      size="icon"
      variant="ghost"
      className="h-7 w-7"
      disabled={pending}
      onClick={() => startTransition(() => togglePinNote(patientId, id, !pinned))}
    >
      {pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
    </Button>
  )
}

function FollowUpStatusSelect({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <Select
      items={followUpStatusLabels}
      value={status}
      disabled={pending}
      onValueChange={(value) =>
        value && startTransition(() => updateFollowUpStatus(id, value as "PENDING" | "DONE" | "MISSED" | "CANCELLED"))
      }
    >
      <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
      <SelectContent>
        {Object.entries(followUpStatusLabels).map(([value, label]) => (
          <SelectItem key={value} value={value}>{label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function NoteForm({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const [pending, startTransition] = useTransition()
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        startTransition(async () => {
          try {
            await addNote(patientId, {
              body: String(fd.get("body") || ""),
              category: String(fd.get("category") || "GENERAL") as never,
              pinned: fd.get("pinned") === "on",
            })
            toast.success("Note added")
            onDone()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not add note")
          }
        })
      }}
    >
      <div className="space-y-1.5">
        <Label>Category</Label>
        <Select
          items={{ GENERAL: "GENERAL", CLINICAL: "CLINICAL", BILLING: "BILLING", FRONT_DESK: "FRONT_DESK" }}
          name="category"
          defaultValue="GENERAL"
        >
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["GENERAL", "CLINICAL", "BILLING", "FRONT_DESK"].map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="note-body">Note</Label>
        <Textarea id="note-body" name="body" required rows={4} />
      </div>
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Add Note"}</Button>
    </form>
  )
}

function FollowUpForm({ patientId, staff, onDone }: { patientId: string; staff: Staff[]; onDone: () => void }) {
  const [pending, startTransition] = useTransition()
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        startTransition(async () => {
          try {
            await addFollowUp(patientId, {
              dueDate: new Date(String(fd.get("dueDate"))),
              reason: String(fd.get("reason") || ""),
              assignedToId: String(fd.get("assignedToId") || "") || undefined,
              notes: String(fd.get("notes") || "") || undefined,
            })
            toast.success("Follow-up scheduled")
            onDone()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not add follow-up")
          }
        })
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="fu-reason">Reason</Label>
        <Input id="fu-reason" name="reason" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fu-dueDate">Due date</Label>
        <Input id="fu-dueDate" name="dueDate" type="date" required />
      </div>
      <div className="space-y-1.5">
        <Label>Assign to</Label>
        <Select items={Object.fromEntries(staff.map((s) => [s.id, s.name]))} name="assignedToId">
          <SelectTrigger className="w-full"><SelectValue placeholder="Unassigned" /></SelectTrigger>
          <SelectContent>
            {staff.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fu-notes">Notes</Label>
        <Textarea id="fu-notes" name="notes" />
      </div>
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Schedule Follow-up"}</Button>
    </form>
  )
}

function MessageForm({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const [pending, startTransition] = useTransition()
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        startTransition(async () => {
          try {
            await logMessage(patientId, {
              channel: String(fd.get("channel") || "SMS") as never,
              subject: String(fd.get("subject") || "") || undefined,
              body: String(fd.get("body") || ""),
            })
            toast.success("Message logged")
            onDone()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not log message")
          }
        })
      }}
    >
      <div className="space-y-1.5">
        <Label>Channel</Label>
        <Select items={commChannelLabels} name="channel" defaultValue="SMS">
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(["SMS", "EMAIL", "WHATSAPP", "CALL", "SYSTEM"] as const).map((c) => (
              <SelectItem key={c} value={c}>{commChannelLabels[c]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="msg-subject">Subject (optional)</Label>
        <Input id="msg-subject" name="subject" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="msg-body">Message</Label>
        <Textarea id="msg-body" name="body" required rows={4} />
      </div>
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Sending…" : "Log Message"}</Button>
    </form>
  )
}
