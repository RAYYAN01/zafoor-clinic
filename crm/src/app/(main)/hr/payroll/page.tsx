import { getSalaryStructures, getPayrollRuns } from "@/actions/payroll"
import { getEmployeesForSelect } from "@/actions/employees"
import { PayrollBoard } from "@/components/hr/payroll-board"

export default async function PayrollPage() {
  const [structures, runs, employees] = await Promise.all([getSalaryStructures(), getPayrollRuns(), getEmployeesForSelect()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payroll & Salary</h1>
        <p className="text-sm text-muted-foreground">{structures.length} salary structure{structures.length === 1 ? "" : "s"} · {runs.length} payroll run{runs.length === 1 ? "" : "s"}.</p>
      </div>
      <PayrollBoard structures={structures} runs={runs} employees={employees} />
    </div>
  )
}
