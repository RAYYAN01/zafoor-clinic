import { getAnnouncements } from "@/actions/announcements"
import { getDepartments } from "@/actions/employees"
import { AnnouncementsBoard } from "@/components/hr/announcements-board"

export default async function AnnouncementsPage() {
  const [announcements, departments] = await Promise.all([getAnnouncements(), getDepartments()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Announcements</h1>
        <p className="text-sm text-muted-foreground">{announcements.length} announcement{announcements.length === 1 ? "" : "s"}.</p>
      </div>
      <AnnouncementsBoard announcements={announcements} departments={departments} />
    </div>
  )
}
