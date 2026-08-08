import { getTrainingPrograms } from "@/actions/training"
import { getEmployeesForSelect } from "@/actions/employees"
import { TrainingBoard } from "@/components/hr/training-board"

export default async function TrainingPage() {
  const [programs, employees] = await Promise.all([getTrainingPrograms(), getEmployeesForSelect()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Training</h1>
        <p className="text-sm text-muted-foreground">{programs.length} program{programs.length === 1 ? "" : "s"}.</p>
      </div>
      <TrainingBoard programs={programs} employees={employees} />
    </div>
  )
}
