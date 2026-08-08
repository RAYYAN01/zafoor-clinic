"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { DeleteButton } from "@/components/shared/delete-button"
import { createDepartment, deleteDepartment, createDesignation, deleteDesignation, type getDepartments, type getDesignations } from "@/actions/employees"

type Departments = Awaited<ReturnType<typeof getDepartments>>
type Designations = Awaited<ReturnType<typeof getDesignations>>
type Staff = { id: string; name: string }[]

export function DepartmentsBoard({ departments, designations, staff }: { departments: Departments; designations: Designations; staff: Staff }) {
  const [addDeptOpen, setAddDeptOpen] = useState(false)
  const [addDesigOpen, setAddDesigOpen] = useState(false)

  return (
    <Tabs defaultValue="departments">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="designations">Designations</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="departments" className="space-y-4 mt-4">
        <div className="flex justify-end">
          <Button className="gap-1.5" onClick={() => setAddDeptOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Department
          </Button>
        </div>
        {departments.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No departments yet.</CardContent></Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {departments.map((d) => (
              <Card key={d.id}>
                <CardContent className="py-4 space-y-1">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium">{d.name}</p>
                    <DeleteButton onDelete={() => deleteDepartment(d.id)} />
                  </div>
                  {d.code && <p className="text-xs text-muted-foreground">{d.code}</p>}
                  {d.head && <p className="text-xs text-muted-foreground">Head: {d.head.name}</p>}
                  <p className="text-xs text-muted-foreground">{d._count.employees} employee{d._count.employees === 1 ? "" : "s"}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="designations" className="space-y-4 mt-4">
        <div className="flex justify-end">
          <Button className="gap-1.5" onClick={() => setAddDesigOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Designation
          </Button>
        </div>
        {designations.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No designations yet.</CardContent></Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {designations.map((d) => (
              <Card key={d.id}>
                <CardContent className="py-4 space-y-1">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium">{d.title}</p>
                    <DeleteButton onDelete={() => deleteDesignation(d.id)} />
                  </div>
                  {d.department && <p className="text-xs text-muted-foreground">{d.department.name}</p>}
                  {d.level && <p className="text-xs text-muted-foreground">Level: {d.level}</p>}
                  <p className="text-xs text-muted-foreground">{d._count.employees} employee{d._count.employees === 1 ? "" : "s"}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <AddDepartmentDialog open={addDeptOpen} onOpenChange={setAddDeptOpen} staff={staff} />
      <AddDesignationDialog open={addDesigOpen} onOpenChange={setAddDesigOpen} departments={departments} />
    </Tabs>
  )
}

function AddDepartmentDialog({ open, onOpenChange, staff }: { open: boolean; onOpenChange: (v: boolean) => void; staff: Staff }) {
  const [headId, setHeadId] = useState("")
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Department</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              try {
                await createDepartment({
                  name: String(fd.get("name") || ""),
                  code: String(fd.get("code") || "") || undefined,
                  headId: headId || undefined,
                })
                toast.success("Department added")
                onOpenChange(false)
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not add department")
              }
            })
          }}
        >
          <div className="space-y-1.5"><Label htmlFor="name">Department name</Label><Input id="name" name="name" required /></div>
          <div className="space-y-1.5"><Label htmlFor="code">Code</Label><Input id="code" name="code" /></div>
          <div className="space-y-1.5">
            <Label>Head of department</Label>
            <Select items={{ NONE: "None", ...Object.fromEntries(staff.map((s) => [s.id, s.name])) }} value={headId || "NONE"} onValueChange={(v) => setHeadId(v === "NONE" ? "" : v ?? "")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">None</SelectItem>
                {staff.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Add Department"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AddDesignationDialog({ open, onOpenChange, departments }: { open: boolean; onOpenChange: (v: boolean) => void; departments: Departments }) {
  const [departmentId, setDepartmentId] = useState("")
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Designation</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              try {
                await createDesignation({
                  title: String(fd.get("title") || ""),
                  departmentId: departmentId || undefined,
                  level: String(fd.get("level") || "") || undefined,
                })
                toast.success("Designation added")
                onOpenChange(false)
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not add designation")
              }
            })
          }}
        >
          <div className="space-y-1.5"><Label htmlFor="title">Title</Label><Input id="title" name="title" required /></div>
          <div className="space-y-1.5">
            <Label>Department</Label>
            <Select items={{ NONE: "None", ...Object.fromEntries(departments.map((d) => [d.id, d.name])) }} value={departmentId || "NONE"} onValueChange={(v) => setDepartmentId(v === "NONE" ? "" : v ?? "")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">None</SelectItem>
                {departments.map((d) => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label htmlFor="level">Level</Label><Input id="level" name="level" placeholder="e.g. Senior" /></div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Add Designation"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
