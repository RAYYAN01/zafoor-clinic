import { getOnboardingTasks } from "@/actions/onboarding"
import { getEmployeesForSelect } from "@/actions/employees"
import { getAllStaff } from "@/lib/auth"
import { OnboardingBoard } from "@/components/hr/onboarding-board"

export default async function OnboardingPage() {
  const [tasks, employees, staff] = await Promise.all([getOnboardingTasks(), getEmployeesForSelect(), getAllStaff()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Onboarding</h1>
        <p className="text-sm text-muted-foreground">{tasks.length} pending task{tasks.length === 1 ? "" : "s"}.</p>
      </div>
      <OnboardingBoard tasks={tasks} employees={employees} staff={staff} />
    </div>
  )
}
