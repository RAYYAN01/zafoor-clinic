import {
  CalendarDays,
  Pill,
  Receipt,
  Wallet,
  FileText,
  MessageSquare,
  StickyNote,
  Star,
  Stethoscope,
  FlaskConical,
  Send,
  Award,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDateTime } from "@/lib/format"
import type { TimelineEvent, TimelineEventType } from "@/actions/timeline"

const icons: Record<TimelineEventType, typeof CalendarDays> = {
  APPOINTMENT: CalendarDays,
  PRESCRIPTION: Pill,
  BILL: Receipt,
  PAYMENT: Wallet,
  REPORT: FileText,
  MESSAGE: MessageSquare,
  NOTE: StickyNote,
  FEEDBACK: Star,
  ENCOUNTER: Stethoscope,
  CLINICAL_REPORT: FlaskConical,
  REFERRAL: Send,
  CERTIFICATE: Award,
}

export function TimelineTab({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No activity recorded yet.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <ol className="relative border-l pl-6 space-y-6">
          {events.map((event) => {
            const Icon = icons[event.type]
            return (
              <li key={event.id} className="relative">
                <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full border bg-background">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{event.title}</p>
                  {event.badge && <Badge variant="outline">{event.badge}</Badge>}
                </div>
                {event.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">{event.description}</p>
                )}
                <p className="text-xs text-muted-foreground/80 mt-1">{formatDateTime(event.date)}</p>
              </li>
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}
