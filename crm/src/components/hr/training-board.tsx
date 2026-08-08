"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Plus, UserPlus } from "lucide-react"
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
import { trainingStatusLabels, trainingStatusColors, enrollmentStatusLabels, enrollmentStatusColors } from "@/lib/labels"
import { createTrainingProgram, enrollEmployees, updateEnrollmentStatus, type getTrainingPrograms } from "@/actions/training"

type Programs = Awaited<ReturnType<typeof getTrainingPrograms>>
type Employees = { id: string; name: string; employeeCode: string }[]

export function TrainingBoard({ programs, employees }: { programs: Programs; employees: Employees }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          New Training Program
        </Button>
      </div>

      {programs.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No training programs yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {programs.map((p) => (
            <ProgramCard key={p.id} program={p} employees={employees} />
          ))}
        </div>
      )}

      <NewProgramDialog open={open} onOpenChange={setOpen} />
    </div>
  )
}

function ProgramCard({ program, employees }: { program: Programs[number]; employees: Employees }) {
  const [enrollOpen, setEnrollOpen] = useState(false)
  const enrolledIds = new Set(program.enrollments.map((e) => e.employeeId))
  const available = employees.filter((e) => !enrolledIds.has(e.id))

  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{program.title}</p>
              <Badge variant="secondary" className={trainingStatusColors[program.status]}>{trainingStatusLabels[program.status]}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {program.trainer ? `${program.trainer} · ` : ""}{formatDate(program.scheduledAt)}
              {program.durationHours ? ` · ${Number(program.durationHours)}h` : ""}
            </p>
            {program.description && <p className="text-xs text-muted-foreground/80 mt-1">{program.description}</p>}
          </div>
          <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={() => setEnrollOpen(true)} disabled={available.length === 0}>
            <UserPlus className="h-3.5 w-3.5" /> Enroll
          </Button>
        </div>
        {program.enrollments.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t">
            {program.enrollments.map((en) => (
              <EnrollmentRow key={en.id} enrollment={en} />
            ))}
          </div>
        )}
      </CardContent>
      <EnrollDialog open={enrollOpen} onOpenChange={setEnrollOpen} programId={program.id} employees={available} />
    </Card>
  )
}

function EnrollmentRow({ enrollment }: { enrollment: Programs[number]["enrollments"][number] }) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex items-center justify-between text-sm">
      <span>{enrollment.employee.user.name}</span>
      <Select
        items={enrollmentStatusLabels}
        value={enrollment.status}
        onValueChange={(v) => {
          if (!v) return
          startTransition(async () => {
            try {
              await updateEnrollmentStatus(enrollment.id, { status: v as never })
            } catch {
              toast.error("Could not update enrollment")
            }
          })
        }}
      >
        <SelectTrigger className="h-6 w-[120px] text-xs" disabled={pending}>
          <SelectValue>
            <Badge variant="secondary" className={enrollmentStatusColors[enrollment.status]}>{enrollmentStatusLabels[enrollment.status]}</Badge>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(enrollmentStatusLabels).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}
        </SelectContent>
      </Select>
    </div>
  )
}

function NewProgramDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Training Program</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              try {
                await createTrainingProgram({
                  title: String(fd.get("title") || ""),
                  description: String(fd.get("description") || "") || undefined,
                  trainer: String(fd.get("trainer") || "") || undefined,
                  scheduledAt: String(fd.get("scheduledAt") || ""),
                  durationHours: fd.get("durationHours") ? Number(fd.get("durationHours")) : undefined,
                })
                toast.success("Training program created")
                onOpenChange(false)
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not create program")
              }
            })
          }}
        >
          <div className="space-y-1.5"><Label htmlFor="title">Title</Label><Input id="title" name="title" required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="trainer">Trainer</Label><Input id="trainer" name="trainer" /></div>
            <div className="space-y-1.5"><Label htmlFor="durationHours">Duration (hrs)</Label><Input id="durationHours" name="durationHours" type="number" /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="scheduledAt">Scheduled date</Label><Input id="scheduledAt" name="scheduledAt" type="datetime-local" required /></div>
          <div className="space-y-1.5"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" /></div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Create Program"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EnrollDialog({ open, onOpenChange, programId, employees }: { open: boolean; onOpenChange: (v: boolean) => void; programId: string; employees: Employees }) {
  const [selected, setSelected] = useState<string[]>([])
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Enroll Employees</DialogTitle></DialogHeader>
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {employees.map((e) => (
            <label key={e.id} className="flex items-center gap-2 text-sm rounded-md px-2 py-1.5 hover:bg-muted">
              <Checkbox
                checked={selected.includes(e.id)}
                onCheckedChange={(v) => setSelected((prev) => (v ? [...prev, e.id] : prev.filter((id) => id !== e.id)))}
              />
              {e.name}
            </label>
          ))}
          {employees.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Everyone is already enrolled.</p>}
        </div>
        <Button
          disabled={pending || selected.length === 0}
          className="w-full"
          onClick={() =>
            startTransition(async () => {
              try {
                await enrollEmployees(programId, { employeeIds: selected })
                toast.success("Employees enrolled")
                onOpenChange(false)
                setSelected([])
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not enroll employees")
              }
            })
          }
        >
          {pending ? "Enrolling…" : `Enroll ${selected.length || ""}`}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
