import { getEmployees, getDepartments, getDesignations, getEmployeesForSelect } from "@/actions/employees"
import { EmployeesBoard } from "@/components/hr/employees-board"

export default async function EmployeesPage() {
  const [employees, departments, designations, managers] = await Promise.all([
    getEmployees(),
    getDepartments(),
    getDesignations(),
    getEmployeesForSelect(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Employee Profiles</h1>
        <p className="text-sm text-muted-foreground">{employees.length} employee{employees.length === 1 ? "" : "s"} on record.</p>
      </div>
      <EmployeesBoard employees={employees} departments={departments} designations={designations} managers={managers} />
    </div>
  )
}
