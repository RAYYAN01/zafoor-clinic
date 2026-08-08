"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDate } from "@/lib/format"
import { createOnboardingTask, toggleOnboardingTask, type getOnboardingTasks } from "@/actions/onboarding"

type Tasks = Awaited<ReturnType<typeof getOnboardingTasks>>
type Employees = { id: string; name: string; employeeCode: string }[]
type Staff = { id: string; name: string }[]

export function OnboardingBoard({ tasks, employees, staff }: { tasks: Tasks; employees: Employees; staff: Staff }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="gap-1.5" onClick={() => setOpen(true)} disabled={employees.length === 0}>
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      {tasks.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No onboarding tasks pending.</CardContent></Card>
      ) : (
        <div className="space-y-1.5">
          {tasks.map((t) => (
            <TaskRow key={t.id} task={t} />
          ))}
        </div>
      )}

      <NewTaskDialog open={open} onOpenChange={setOpen} employees={employees} staff={staff} />
    </div>
  )
}

function TaskRow({ task }: { task: Tasks[number] }) {
  const [pending, startTransition] = useTransition()

  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-3">
        <Checkbox
          checked={task.status === "DONE"}
          disabled={pending}
          onCheckedChange={() =>
            startTransition(async () => {
              try {
                await toggleOnboardingTask(task.id)
              } catch {
                toast.error("Could not update task")
              }
            })
          }
        />
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium ${task.status === "DONE" ? "line-through text-muted-foreground" : ""}`}>{task.title}</p>
          <p className="text-xs text-muted-foreground">
            {task.employee.user.name}
            {task.dueDate ? ` · Due ${formatDate(task.dueDate)}` : ""}
            {task.assignedTo ? ` · Assigned to ${task.assignedTo.name}` : ""}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function NewTaskDialog({ open, onOpenChange, employees, staff }: { open: boolean; onOpenChange: (v: boolean) => void; employees: Employees; staff: Staff }) {
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "")
  const [assignedToId, setAssignedToId] = useState("")
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Onboarding Task</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            if (!employeeId) { toast.error("Select an employee"); return }
            startTransition(async () => {
              try {
                await createOnboardingTask({
                  employeeId,
                  title: String(fd.get("title") || ""),
                  dueDate: String(fd.get("dueDate") || "") || undefined,
                  assignedToId: assignedToId || undefined,
                })
                toast.success("Task added")
                onOpenChange(false)
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not add task")
              }
            })
          }}
        >
          <div className="space-y-1.5">
            <Label>New employee</Label>
            <Select items={Object.fromEntries(employees.map((e) => [e.id, e.name]))} value={employeeId} onValueChange={(v) => setEmployeeId(v ?? "")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{employees.map((e) => (<SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label htmlFor="title">Task</Label><Input id="title" name="title" placeholder="e.g. Issue laptop" required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="dueDate">Due date</Label><Input id="dueDate" name="dueDate" type="date" /></div>
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
          </div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Add Task"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
