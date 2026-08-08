"use client"

import Link from "next/link"
import { useTransition } from "react"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { patientDisplayName, formatDate } from "@/lib/format"
import { followUpStatusLabels } from "@/lib/labels"
import { updateFollowUpStatus, type getFollowUps } from "@/actions/crm"

type FollowUps = Awaited<ReturnType<typeof getFollowUps>>

export function FollowUpsList({ followUps }: { followUps: FollowUps }) {
  if (followUps.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">No follow-ups found.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Patient</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Assigned To</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {followUps.map((f) => (
          <Row key={f.id} followUp={f} />
        ))}
      </TableBody>
    </Table>
  )
}

function Row({ followUp: f }: { followUp: FollowUps[number] }) {
  const [pending, startTransition] = useTransition()

  return (
    <TableRow>
      <TableCell>
        <Link href={`/patients/${f.patientId}`} className="font-medium hover:underline">
          {patientDisplayName(f.patient)}
        </Link>
      </TableCell>
      <TableCell className="max-w-xs truncate">{f.reason}</TableCell>
      <TableCell>{formatDate(f.dueDate)}</TableCell>
      <TableCell>{f.assignedTo?.name ?? "Unassigned"}</TableCell>
      <TableCell>
        <Select
          items={followUpStatusLabels}
          value={f.status}
          disabled={pending}
          onValueChange={(value) =>
            value &&
            startTransition(async () => {
              try {
                await updateFollowUpStatus(f.id, value as "PENDING" | "DONE" | "MISSED" | "CANCELLED")
              } catch {
                toast.error("Could not update status")
              }
            })
          }
        >
          <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(followUpStatusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
    </TableRow>
  )
}
