import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getAppointmentCountsForMonth } from "@/actions/appointments"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function toDateKey(year: number, month: number, day: number) {
  const m = String(month).padStart(2, "0")
  const d = String(day).padStart(2, "0")
  return `${year}-${m}-${d}`
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  const sp = await searchParams
  const now = new Date()
  const year = Number(sp.year) || now.getFullYear()
  const month = Number(sp.month) || now.getMonth() + 1 // 1-indexed

  const counts = await getAppointmentCountsForMonth(year, month)

  const firstOfMonth = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  const startWeekday = firstOfMonth.getDay() // 0 = Sunday

  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year

  const todayKey = toDateKey(now.getFullYear(), now.getMonth() + 1, now.getDate())

  const cells: { day: number | null; dateKey: string | null }[] = []
  for (let i = 0; i < startWeekday; i++) cells.push({ day: null, dateKey: null })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, dateKey: toDateKey(year, month, d) })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground">Appointment volume by day — click a day to see its schedule.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            nativeButton={false}
            render={<Link href={`/calendar?year=${prevYear}&month=${prevMonth}`} aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></Link>}
          />
          <span className="min-w-36 text-center text-sm font-medium">{MONTH_NAMES[month - 1]} {year}</span>
          <Button
            variant="outline"
            size="icon"
            nativeButton={false}
            render={<Link href={`/calendar?year=${nextYear}&month=${nextMonth}`} aria-label="Next month"><ChevronRight className="h-4 w-4" /></Link>}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-muted-foreground">
            {WEEKDAYS.map((w) => <div key={w} className="py-2">{w}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {cells.map((cell, i) => {
              if (!cell.day) return <div key={i} />
              const count = counts[cell.dateKey!] ?? 0
              const isToday = cell.dateKey === todayKey
              return (
                <Link
                  key={i}
                  href={`/appointments?date=${cell.dateKey}`}
                  className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border p-2 text-sm transition-colors hover:border-primary/50 hover:bg-muted ${isToday ? "border-primary bg-primary/5 font-semibold" : "border-border"}`}
                >
                  <span>{cell.day}</span>
                  {count > 0 && (
                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium leading-none text-primary-foreground">
                      {count}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
