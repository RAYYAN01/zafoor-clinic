import { getExitRequests } from "@/actions/exit"
import { getEmployeesForSelect } from "@/actions/employees"
import { ExitBoard } from "@/components/hr/exit-board"

export default async function ExitPage() {
  const [requests, employees] = await Promise.all([getExitRequests(), getEmployeesForSelect()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Exit Management</h1>
        <p className="text-sm text-muted-foreground">{requests.filter((r) => r.status === "PENDING").length} pending exit{requests.length === 1 ? "" : "s"}.</p>
      </div>
      <ExitBoard requests={requests} employees={employees} />
    </div>
  )
}
