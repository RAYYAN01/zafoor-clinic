import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { formatDateTime, patientDisplayName } from "@/lib/format"
import { commChannelLabels } from "@/lib/labels"
import type { getMessages } from "@/actions/crm"

type Messages = Awaited<ReturnType<typeof getMessages>>

export function CommunicationsList({ messages }: { messages: Messages }) {
  if (messages.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">No messages logged yet.</p>
  }

  return (
    <div className="divide-y">
      {messages.map((m) => (
        <div key={m.id} className="flex items-start gap-4 p-4">
          <Badge variant="outline" className="mt-0.5 shrink-0">{commChannelLabels[m.channel]}</Badge>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <Link href={`/patients/${m.patientId}`} className="text-sm font-medium hover:underline">
                {patientDisplayName(m.patient)}
              </Link>
              <span className="text-xs text-muted-foreground shrink-0">{formatDateTime(m.sentAt)}</span>
            </div>
            {m.subject && <p className="text-sm font-medium mt-0.5">{m.subject}</p>}
            <p className="text-sm text-muted-foreground mt-0.5">{m.body}</p>
            <p className="text-xs text-muted-foreground/80 mt-1">
              {m.direction === "OUTBOUND" ? "Sent" : "Received"}
              {m.sentBy ? ` by ${m.sentBy.name}` : ""} · {m.status}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
