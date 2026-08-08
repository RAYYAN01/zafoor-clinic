import { getTodayQueue } from "@/actions/appointments"
import { getDoctors } from "@/lib/auth"
import { QueueBoard } from "@/components/appointments/queue-board"
import { WalkInDialog } from "@/components/appointments/walk-in-dialog"

export default async function QueuePage() {
  const [queue, doctors] = await Promise.all([getTodayQueue(), getDoctors()])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Today&apos;s Queue</h1>
          <p className="text-sm text-muted-foreground">Live token board across all doctors.</p>
        </div>
        <WalkInDialog doctors={doctors} />
      </div>

      <QueueBoard queue={queue} doctors={doctors} />
    </div>
  )
}
