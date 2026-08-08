import { getDepartments, getDesignations } from "@/actions/employees"
import { getAllStaff } from "@/lib/auth"
import { DepartmentsBoard } from "@/components/hr/departments-board"

export default async function DepartmentsPage() {
  const [departments, designations, staff] = await Promise.all([getDepartments(), getDesignations(), getAllStaff()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Departments & Designations</h1>
        <p className="text-sm text-muted-foreground">{departments.length} department{departments.length === 1 ? "" : "s"} · {designations.length} designation{designations.length === 1 ? "" : "s"}.</p>
      </div>
      <DepartmentsBoard departments={departments} designations={designations} staff={staff} />
    </div>
  )
}
