"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { initials, formatDate } from "@/lib/format"
import { employmentTypeLabels, employeeStatusLabels, employeeStatusColors } from "@/lib/labels"
import { createEmployee, type getEmployees, type getDepartments, type getDesignations, type getEmployeesForSelect } from "@/actions/employees"

type Employees = Awaited<ReturnType<typeof getEmployees>>
type Departments = Awaited<ReturnType<typeof getDepartments>>
type Designations = Awaited<ReturnType<typeof getDesignations>>
type Managers = Awaited<ReturnType<typeof getEmployeesForSelect>>

export function EmployeesBoard({ employees, departments, designations, managers }: { employees: Employees; departments: Departments; designations: Designations; managers: Managers }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Employee
        </Button>
      </div>

      {employees.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No employees yet.</CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {employees.map((e) => (
            <Link key={e.id} href={`/hr/employees/${e.id}`}>
              <Card className="hover:bg-muted transition-colors h-full">
                <CardContent className="py-4 flex items-start gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="text-xs">{initials(e.user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{e.user.name}</p>
                      <Badge variant="secondary" className={employeeStatusColors[e.status]}>{employeeStatusLabels[e.status]}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{e.employeeCode}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {e.designation?.title ?? "—"}{e.department ? ` · ${e.department.name}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground/80">Joined {formatDate(e.dateOfJoining)}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <AddEmployeeDialog open={open} onOpenChange={setOpen} departments={departments} designations={designations} managers={managers} />
    </div>
  )
}

function AddEmployeeDialog({
  open,
  onOpenChange,
  departments,
  designations,
  managers,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  departments: Departments
  designations: Designations
  managers: Managers
}) {
  const [departmentId, setDepartmentId] = useState("")
  const [designationId, setDesignationId] = useState("")
  const [managerId, setManagerId] = useState("")
  const [employmentType, setEmploymentType] = useState("FULL_TIME")
  const [gender, setGender] = useState("")
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add Employee</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              try {
                await createEmployee({
                  name: String(fd.get("name") || ""),
                  email: String(fd.get("email") || ""),
                  phone: String(fd.get("phone") || "") || undefined,
                  departmentId: departmentId || undefined,
                  designationId: designationId || undefined,
                  reportingManagerId: managerId || undefined,
                  dateOfJoining: String(fd.get("dateOfJoining") || ""),
                  dob: String(fd.get("dob") || "") || undefined,
                  gender: (gender || undefined) as never,
                  employmentType: employmentType as never,
                  address: String(fd.get("address") || "") || undefined,
                  emergencyContactName: String(fd.get("emergencyContactName") || "") || undefined,
                  emergencyContactPhone: String(fd.get("emergencyContactPhone") || "") || undefined,
                })
                toast.success("Employee added")
                onOpenChange(false)
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not add employee")
              }
            })
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="name">Full name</Label><Input id="name" name="name" required /></div>
            <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" /></div>
            <div className="space-y-1.5"><Label htmlFor="dateOfJoining">Date of joining</Label><Input id="dateOfJoining" name="dateOfJoining" type="date" required /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
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
            <div className="space-y-1.5">
              <Label>Designation</Label>
              <Select items={{ NONE: "None", ...Object.fromEntries(designations.map((d) => [d.id, d.title])) }} value={designationId || "NONE"} onValueChange={(v) => setDesignationId(v === "NONE" ? "" : v ?? "")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">None</SelectItem>
                  {designations.map((d) => (<SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Reporting manager</Label>
              <Select items={{ NONE: "None", ...Object.fromEntries(managers.map((m) => [m.id, m.name])) }} value={managerId || "NONE"} onValueChange={(v) => setManagerId(v === "NONE" ? "" : v ?? "")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">None</SelectItem>
                  {managers.map((m) => (<SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Employment type</Label>
              <Select items={employmentTypeLabels} value={employmentType} onValueChange={(v) => setEmploymentType(v ?? "FULL_TIME")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(employmentTypeLabels).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="dob">Date of birth</Label><Input id="dob" name="dob" type="date" /></div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select items={{ MALE: "Male", FEMALE: "Female", OTHER: "Other" }} value={gender} onValueChange={(v) => setGender(v ?? "")}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="address">Address</Label><Input id="address" name="address" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="emergencyContactName">Emergency contact</Label><Input id="emergencyContactName" name="emergencyContactName" /></div>
            <div className="space-y-1.5"><Label htmlFor="emergencyContactPhone">Emergency phone</Label><Input id="emergencyContactPhone" name="emergencyContactPhone" /></div>
          </div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Add Employee"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
