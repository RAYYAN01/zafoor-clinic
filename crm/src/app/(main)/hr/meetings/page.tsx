import { getMeetings } from "@/actions/meetings"
import { getAllStaff } from "@/lib/auth"
import { MeetingsBoard } from "@/components/hr/meetings-board"

export default async function MeetingsPage() {
  const [meetings, staff] = await Promise.all([getMeetings(), getAllStaff()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Meeting Scheduler</h1>
        <p className="text-sm text-muted-foreground">{meetings.filter((m) => m.status === "SCHEDULED").length} upcoming meeting{meetings.length === 1 ? "" : "s"}.</p>
      </div>
      <MeetingsBoard meetings={meetings} staff={staff} />
    </div>
  )
}
