import { notFound } from "next/navigation"
import Link from "next/link"
import { getEmployee } from "@/actions/employees"
import { getEmployeePayslips } from "@/actions/payroll"
import { EmployeeDetail } from "@/components/hr/employee-detail"

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const employee = await getEmployee(id)
  if (!employee) notFound()
  const payslips = await getEmployeePayslips(id)

  return (
    <div className="space-y-6">
      <div>
        <Link href="/hr/employees" className="text-sm text-primary hover:underline">← All Employees</Link>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">{employee.user.name}</h1>
        <p className="text-sm text-muted-foreground">{employee.employeeCode} · {employee.user.email}</p>
      </div>
      <EmployeeDetail employee={employee} payslips={payslips} />
    </div>
  )
}
