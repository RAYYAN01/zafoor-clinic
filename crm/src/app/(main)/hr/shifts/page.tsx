import { getShifts, getShiftAssignments } from "@/actions/shifts"
import { getEmployeesForSelect } from "@/actions/employees"
import { ShiftsBoard } from "@/components/hr/shifts-board"

export default async function ShiftsPage() {
  const [shifts, assignments, employees] = await Promise.all([getShifts(), getShiftAssignments(new Date()), getEmployeesForSelect()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Shift Scheduling</h1>
        <p className="text-sm text-muted-foreground">{shifts.length} shift{shifts.length === 1 ? "" : "s"} · {assignments.length} assignment{assignments.length === 1 ? "" : "s"} this week.</p>
      </div>
      <ShiftsBoard shifts={shifts} assignments={assignments} employees={employees} />
    </div>
  )
}
