import { getLeaveTypes, getLeaveRequests } from "@/actions/leaves"
import { getEmployeesForSelect } from "@/actions/employees"
import { LeavesBoard } from "@/components/hr/leaves-board"

export default async function LeavesPage() {
  const [types, requests, employees] = await Promise.all([getLeaveTypes(), getLeaveRequests(), getEmployeesForSelect()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Leave Management</h1>
        <p className="text-sm text-muted-foreground">{requests.filter((r) => r.status === "PENDING").length} pending request{requests.filter((r) => r.status === "PENDING").length === 1 ? "" : "s"} · {types.length} leave type{types.length === 1 ? "" : "s"}.</p>
      </div>
      <LeavesBoard types={types} requests={requests} employees={employees} />
    </div>
  )
}
