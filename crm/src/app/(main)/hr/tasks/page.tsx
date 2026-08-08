import { getTasks } from "@/actions/tasks"
import { getAllStaff } from "@/lib/auth"
import { TasksBoard } from "@/components/hr/tasks-board"

export default async function TasksPage() {
  const [tasks, staff] = await Promise.all([getTasks(), getAllStaff()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Task Management</h1>
        <p className="text-sm text-muted-foreground">{tasks.filter((t) => t.status !== "DONE" && t.status !== "CANCELLED").length} open task{tasks.length === 1 ? "" : "s"}.</p>
      </div>
      <TasksBoard tasks={tasks} staff={staff} />
    </div>
  )
}
