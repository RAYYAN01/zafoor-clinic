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
import { formatDate } from "@/lib/format"
import { exitStatusLabels, exitStatusColors } from "@/lib/labels"
import { initiateExit, updateExitRequest, type getExitRequests } from "@/actions/exit"

type Requests = Awaited<ReturnType<typeof getExitRequests>>
type Employees = { id: string; name: string; employeeCode: string }[]

export function ExitBoard({ requests, employees }: { requests: Requests; employees: Employees }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="gap-1.5" onClick={() => setOpen(true)} disabled={employees.length === 0}>
          <Plus className="h-4 w-4" />
          Initiate Exit
        </Button>
      </div>

      {requests.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No exit requests yet.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {requests.map((r) => (
            <ExitRow key={r.id} request={r} />
          ))}
        </div>
      )}

      <InitiateExitDialog open={open} onOpenChange={setOpen} employees={employees} />
    </div>
  )
}

function ExitRow({ request }: { request: Requests[number] }) {
  const [clearanceIT, setClearanceIT] = useState(request.clearanceIT)
  const [clearanceFinance, setClearanceFinance] = useState(request.clearanceFinance)
  const [clearanceAdmin, setClearanceAdmin] = useState(request.clearanceAdmin)
  const [pending, startTransition] = useTransition()

  function save(overrides: Partial<{ status: string; clearanceIT: boolean; clearanceFinance: boolean; clearanceAdmin: boolean }> = {}) {
    startTransition(async () => {
      try {
        await updateExitRequest(request.id, {
          status: (overrides.status ?? request.status) as never,
          clearanceIT: overrides.clearanceIT ?? clearanceIT,
          clearanceFinance: overrides.clearanceFinance ?? clearanceFinance,
          clearanceAdmin: overrides.clearanceAdmin ?? clearanceAdmin,
        })
      } catch {
        toast.error("Could not update exit request")
      }
    })
  }

  return (
    <Card>
      <CardContent className="py-4 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{request.employee.user.name}</p>
              <Badge variant="secondary" className={exitStatusColors[request.status]}>{exitStatusLabels[request.status]}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Resigned {formatDate(request.resignationDate)} · Last day {formatDate(request.lastWorkingDate)}
            </p>
            {request.reason && <p className="text-xs text-muted-foreground/80 mt-1">{request.reason}</p>}
          </div>
          {request.status !== "COMPLETED" && request.status !== "WITHDRAWN" && (
            <Select
              items={exitStatusLabels}
              value={request.status}
              onValueChange={(v) => v && save({ status: v })}
            >
              <SelectTrigger className="h-7 w-[130px] text-xs shrink-0" disabled={pending}><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(exitStatusLabels).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="flex items-center gap-4 pt-1 border-t text-xs">
          <label className="flex items-center gap-1.5"><Checkbox checked={clearanceIT} onCheckedChange={(v) => { setClearanceIT(v === true); save({ clearanceIT: v === true }) }} /> IT Clearance</label>
          <label className="flex items-center gap-1.5"><Checkbox checked={clearanceFinance} onCheckedChange={(v) => { setClearanceFinance(v === true); save({ clearanceFinance: v === true }) }} /> Finance Clearance</label>
          <label className="flex items-center gap-1.5"><Checkbox checked={clearanceAdmin} onCheckedChange={(v) => { setClearanceAdmin(v === true); save({ clearanceAdmin: v === true }) }} /> Admin Clearance</label>
        </div>
      </CardContent>
    </Card>
  )
}

function InitiateExitDialog({ open, onOpenChange, employees }: { open: boolean; onOpenChange: (v: boolean) => void; employees: Employees }) {
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "")
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Initiate Exit</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            if (!employeeId) { toast.error("Select an employee"); return }
            startTransition(async () => {
              try {
                await initiateExit({
                  employeeId,
                  resignationDate: String(fd.get("resignationDate") || ""),
                  lastWorkingDate: String(fd.get("lastWorkingDate") || ""),
                  reason: String(fd.get("reason") || "") || undefined,
                })
                toast.success("Exit process initiated")
                onOpenChange(false)
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not initiate exit")
              }
            })
          }}
        >
          <div className="space-y-1.5">
            <Label>Employee</Label>
            <Select items={Object.fromEntries(employees.map((e) => [e.id, e.name]))} value={employeeId} onValueChange={(v) => setEmployeeId(v ?? "")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{employees.map((e) => (<SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="resignationDate">Resignation date</Label><Input id="resignationDate" name="resignationDate" type="date" required /></div>
            <div className="space-y-1.5"><Label htmlFor="lastWorkingDate">Last working day</Label><Input id="lastWorkingDate" name="lastWorkingDate" type="date" required /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="reason">Reason</Label><Textarea id="reason" name="reason" /></div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Initiate Exit"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
