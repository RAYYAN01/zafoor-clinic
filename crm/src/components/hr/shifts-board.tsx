"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Plus, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDate } from "@/lib/format"
import { createShift, assignShift, removeShiftAssignment, type getShifts, type getShiftAssignments } from "@/actions/shifts"

type Shifts = Awaited<ReturnType<typeof getShifts>>
type Assignments = Awaited<ReturnType<typeof getShiftAssignments>>
type Employees = { id: string; name: string; employeeCode: string }[]

export function ShiftsBoard({ shifts, assignments, employees }: { shifts: Shifts; assignments: Assignments; employees: Employees }) {
  const [shiftOpen, setShiftOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <Button variant="outline" className="gap-1.5" onClick={() => setShiftOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Shift
        </Button>
        <Button className="gap-1.5" onClick={() => setAssignOpen(true)} disabled={shifts.length === 0}>
          <Plus className="h-4 w-4" />
          Assign Shift
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {shifts.map((s) => (
          <Card key={s.id}>
            <CardContent className="py-4">
              <p className="text-sm font-medium">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.startTime} – {s.endTime}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="py-4 space-y-2">
          <p className="text-sm font-medium">This Week&apos;s Assignments</p>
          {assignments.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No shifts assigned this week.</p>}
          {assignments.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
              <span>{a.employee.user.name} — {a.shift.name} ({a.shift.startTime}–{a.shift.endTime})</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{formatDate(a.date)}</span>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeShiftAssignment(a.id)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <AddShiftDialog open={shiftOpen} onOpenChange={setShiftOpen} />
      <AssignShiftDialog open={assignOpen} onOpenChange={setAssignOpen} shifts={shifts} employees={employees} />
    </div>
  )
}

function AddShiftDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Shift</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              try {
                await createShift({
                  name: String(fd.get("name") || ""),
                  startTime: String(fd.get("startTime") || ""),
                  endTime: String(fd.get("endTime") || ""),
                })
                toast.success("Shift added")
                onOpenChange(false)
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not add shift")
              }
            })
          }}
        >
          <div className="space-y-1.5"><Label htmlFor="name">Shift name</Label><Input id="name" name="name" placeholder="e.g. Morning" required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="startTime">Start</Label><Input id="startTime" name="startTime" type="time" required /></div>
            <div className="space-y-1.5"><Label htmlFor="endTime">End</Label><Input id="endTime" name="endTime" type="time" required /></div>
          </div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Add Shift"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AssignShiftDialog({ open, onOpenChange, shifts, employees }: { open: boolean; onOpenChange: (v: boolean) => void; shifts: Shifts; employees: Employees }) {
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "")
  const [shiftId, setShiftId] = useState(shifts[0]?.id ?? "")
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Assign Shift</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            if (!employeeId || !shiftId) { toast.error("Select employee and shift"); return }
            startTransition(async () => {
              try {
                await assignShift({ employeeId, shiftId, date: String(fd.get("date") || "") })
                toast.success("Shift assigned")
                onOpenChange(false)
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not assign shift")
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
          <div className="space-y-1.5">
            <Label>Shift</Label>
            <Select items={Object.fromEntries(shifts.map((s) => [s.id, s.name]))} value={shiftId} onValueChange={(v) => setShiftId(v ?? "")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{shifts.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label htmlFor="date">Date</Label><Input id="date" name="date" type="date" required /></div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Assigning…" : "Assign Shift"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
