"use client"

import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatRelative } from "@/lib/format"
import {
  ticketCategoryLabels,
  ticketPriorityLabels,
  ticketPriorityColors,
  ticketStatusLabels,
  ticketStatusColors,
} from "@/lib/labels"
import { createFacilityTicket, updateTicketStatus, type getFacilityTickets } from "@/actions/facility"
import type { getEquipment } from "@/actions/assets"

type Tickets = Awaited<ReturnType<typeof getFacilityTickets>>
type Equipment = Awaited<ReturnType<typeof getEquipment>>
type Staff = { id: string; name: string }[]

export function FacilityTicketsBoard({ tickets, equipment, staff }: { tickets: Tickets; equipment: Equipment; staff: Staff }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState("ALL")

  const filtered = useMemo(() => (tab === "ALL" ? tickets : tickets.filter((t) => t.category === tab)), [tickets, tab])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Tabs value={tab} onValueChange={(v) => setTab(v ?? "ALL")}>
          <TabsList>
            <TabsTrigger value="ALL">All</TabsTrigger>
            {Object.entries(ticketCategoryLabels).map(([value, label]) => (
              <TabsTrigger key={value} value={value}>{label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Log Ticket
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No tickets in this category.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <TicketRow key={t.id} ticket={t} staff={staff} />
          ))}
        </div>
      )}

      <NewTicketDialog open={open} onOpenChange={setOpen} equipment={equipment} staff={staff} />
    </div>
  )
}

function TicketRow({ ticket, staff }: { ticket: Tickets[number]; staff: Staff }) {
  const [pending, startTransition] = useTransition()

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium">{ticket.title}</p>
            <Badge variant="secondary" className={ticketPriorityColors[ticket.priority]}>{ticketPriorityLabels[ticket.priority]}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {ticket.ticketNumber} · {ticketCategoryLabels[ticket.category]}
            {ticket.location ? ` · ${ticket.location}` : ""}
            {ticket.assignedTo ? ` · Assigned to ${ticket.assignedTo.name}` : ""}
            {" · "}{formatRelative(ticket.reportedAt)}
          </p>
          {ticket.description && <p className="text-xs text-muted-foreground/80 mt-0.5">{ticket.description}</p>}
        </div>
        {ticket.status !== "CLOSED" && (
          <div className="flex items-center gap-2 shrink-0">
            <Select
              items={{ NONE: "Unassigned", ...Object.fromEntries(staff.map((s) => [s.id, s.name])) }}
              value={ticket.assignedToId || "NONE"}
              onValueChange={(v) => {
                startTransition(async () => {
                  try {
                    await updateTicketStatus(ticket.id, { status: ticket.status as never, assignedToId: v === "NONE" ? undefined : (v ?? undefined) })
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Could not assign ticket")
                  }
                })
              }}
            >
              <SelectTrigger className="h-7 w-[130px] text-xs" disabled={pending}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Unassigned</SelectItem>
                {staff.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select
              items={ticketStatusLabels}
              value={ticket.status}
              onValueChange={(v) => {
                if (!v) return
                startTransition(async () => {
                  try {
                    await updateTicketStatus(ticket.id, { status: v as never })
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Could not update ticket")
                  }
                })
              }}
            >
              <SelectTrigger className="h-7 w-[130px] text-xs" disabled={pending}>
                <SelectValue>
                  <Badge variant="secondary" className={ticketStatusColors[ticket.status]}>{ticketStatusLabels[ticket.status]}</Badge>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ticketStatusLabels).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function NewTicketDialog({
  open,
  onOpenChange,
  equipment,
  staff,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  equipment: Equipment
  staff: Staff
}) {
  const [category, setCategory] = useState("HOUSEKEEPING")
  const [priority, setPriority] = useState("MEDIUM")
  const [equipmentId, setEquipmentId] = useState("")
  const [assignedToId, setAssignedToId] = useState("")
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Log Facility Ticket</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              try {
                await createFacilityTicket({
                  category: category as never,
                  title: String(fd.get("title") || ""),
                  description: String(fd.get("description") || "") || undefined,
                  location: String(fd.get("location") || "") || undefined,
                  equipmentId: category === "EQUIPMENT" ? equipmentId || undefined : undefined,
                  priority: priority as never,
                  assignedToId: assignedToId || undefined,
                })
                toast.success("Ticket logged")
                onOpenChange(false)
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not log ticket")
              }
            })
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select items={ticketCategoryLabels} value={category} onValueChange={(v) => setCategory(v ?? "HOUSEKEEPING")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(ticketCategoryLabels).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select items={ticketPriorityLabels} value={priority} onValueChange={(v) => setPriority(v ?? "MEDIUM")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(ticketPriorityLabels).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="title">Title</Label><Input id="title" name="title" required /></div>
          <div className="space-y-1.5"><Label htmlFor="location">Location</Label><Input id="location" name="location" /></div>
          {category === "EQUIPMENT" && (
            <div className="space-y-1.5">
              <Label>Equipment</Label>
              <Select items={{ NONE: "None", ...Object.fromEntries(equipment.map((e) => [e.id, e.name])) }} value={equipmentId || "NONE"} onValueChange={(v) => setEquipmentId(v === "NONE" ? "" : v ?? "")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">None</SelectItem>
                  {equipment.map((e) => (<SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Assign to</Label>
            <Select items={{ NONE: "Unassigned", ...Object.fromEntries(staff.map((s) => [s.id, s.name])) }} value={assignedToId || "NONE"} onValueChange={(v) => setAssignedToId(v === "NONE" ? "" : v ?? "")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Unassigned</SelectItem>
                {staff.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" /></div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Log Ticket"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
