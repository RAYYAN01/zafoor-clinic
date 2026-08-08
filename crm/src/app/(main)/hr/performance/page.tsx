import { getPerformanceReviews } from "@/actions/performance"
import { getEmployeesForSelect } from "@/actions/employees"
import { PerformanceBoard } from "@/components/hr/performance-board"

export default async function PerformancePage() {
  const [reviews, employees] = await Promise.all([getPerformanceReviews(), getEmployeesForSelect()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Performance Reviews</h1>
        <p className="text-sm text-muted-foreground">{reviews.length} review{reviews.length === 1 ? "" : "s"} on record.</p>
      </div>
      <PerformanceBoard reviews={reviews} employees={employees} />
    </div>
  )
}
