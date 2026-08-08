import { getHrCalendar } from "@/actions/hr-dashboard"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/format"

const TYPE_COLORS: Record<string, string> = {
  leave: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  meeting: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  training: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  shift: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
}

const TYPE_LABELS: Record<string, string> = {
  leave: "Leave",
  meeting: "Meeting",
  training: "Training",
  shift: "Shift",
}

export default async function HrCalendarPage() {
  const events = await getHrCalendar(new Date())

  const byDate = new Map<string, typeof events>()
  for (const e of events) {
    const key = formatDate(e.date, "dd MMM yyyy")
    byDate.set(key, [...(byDate.get(key) ?? []), e])
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">HR Calendar</h1>
        <p className="text-sm text-muted-foreground">Leaves, shifts, meetings, and training this month — {events.length} event{events.length === 1 ? "" : "s"}.</p>
      </div>

      {byDate.size === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No scheduled events this month.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {Array.from(byDate.entries()).map(([date, dayEvents]) => (
            <Card key={date}>
              <CardContent className="py-4">
                <p className="text-sm font-medium mb-2">{date}</p>
                <div className="space-y-1.5">
                  {dayEvents.map((e, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary" className={TYPE_COLORS[e.type]}>{TYPE_LABELS[e.type]}</Badge>
                      <span className="text-muted-foreground">{e.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
