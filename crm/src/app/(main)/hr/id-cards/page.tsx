import { getEmployees } from "@/actions/employees"
import { IdCardsBoard } from "@/components/hr/id-cards-board"

export default async function IdCardsPage() {
  const employees = await getEmployees()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">ID Cards</h1>
        <p className="text-sm text-muted-foreground">{employees.length} employee{employees.length === 1 ? "" : "s"}.</p>
      </div>
      <IdCardsBoard employees={employees} />
    </div>
  )
}
