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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDate } from "@/lib/format"
import { taskPriorityLabels, taskPriorityColors, taskStatusLabels } from "@/lib/labels"
import { createTask, updateTaskStatus, type getTasks } from "@/actions/tasks"

type Tasks = Awaited<ReturnType<typeof getTasks>>
type Staff = { id: string; name: string }[]

const COLUMNS: { key: string; label: string }[] = [
  { key: "TODO", label: "To Do" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "DONE", label: "Done" },
  { key: "CANCELLED", label: "Cancelled" },
]

export function TasksBoard({ tasks, staff }: { tasks: Tasks; staff: Staff }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {COLUMNS.map((col) => (
          <div key={col.key} className="space-y-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground px-1">{col.label} ({tasks.filter((t) => t.status === col.key).length})</p>
            <div className="space-y-2">
              {tasks.filter((t) => t.status === col.key).map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <NewTaskDialog open={open} onOpenChange={setOpen} staff={staff} />
    </div>
  )
}

function TaskCard({ task }: { task: Tasks[number] }) {
  const [pending, startTransition] = useTransition()

  return (
    <Card>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium">{task.title}</p>
          <Badge variant="secondary" className={`shrink-0 ${taskPriorityColors[task.priority]}`}>{taskPriorityLabels[task.priority]}</Badge>
        </div>
        {task.description && <p className="text-xs text-muted-foreground">{task.description}</p>}
        <p className="text-xs text-muted-foreground">
          {task.assignedTo.name}{task.dueDate ? ` · Due ${formatDate(task.dueDate)}` : ""}
        </p>
        <Select
          items={taskStatusLabels}
          value={task.status}
          onValueChange={(v) => {
            if (!v) return
            startTransition(async () => {
              try {
                await updateTaskStatus(task.id, { status: v as never })
              } catch {
                toast.error("Could not update task")
              }
            })
          }}
        >
          <SelectTrigger className="h-7 w-full text-xs" disabled={pending}><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(taskStatusLabels).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}

function NewTaskDialog({ open, onOpenChange, staff }: { open: boolean; onOpenChange: (v: boolean) => void; staff: Staff }) {
  const [assignedToId, setAssignedToId] = useState(staff[0]?.id ?? "")
  const [priority, setPriority] = useState("MEDIUM")
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            if (!assignedToId) { toast.error("Select an assignee"); return }
            startTransition(async () => {
              try {
                await createTask({
                  title: String(fd.get("title") || ""),
                  description: String(fd.get("description") || "") || undefined,
                  assignedToId,
                  dueDate: String(fd.get("dueDate") || "") || undefined,
                  priority: priority as never,
                })
                toast.success("Task created")
                onOpenChange(false)
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not create task")
              }
            })
          }}
        >
          <div className="space-y-1.5"><Label htmlFor="title">Title</Label><Input id="title" name="title" required /></div>
          <div className="space-y-1.5"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Assign to</Label>
              <Select items={Object.fromEntries(staff.map((s) => [s.id, s.name]))} value={assignedToId} onValueChange={(v) => setAssignedToId(v ?? "")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{staff.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select items={taskPriorityLabels} value={priority} onValueChange={(v) => setPriority(v ?? "MEDIUM")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(taskPriorityLabels).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="dueDate">Due date</Label><Input id="dueDate" name="dueDate" type="date" /></div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Creating…" : "Create Task"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
