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
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DeleteButton } from "@/components/shared/delete-button"
import { formatDate } from "@/lib/format"
import { updateWaitingListStatus, deleteWaitingListEntry, type getWaitingList } from "@/actions/appointments"

type Entries = Awaited<ReturnType<typeof getWaitingList>>

export function WaitingListTable({ entries }: { entries: Entries }) {
  if (entries.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Waiting list is empty.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Patient</TableHead>
          <TableHead>Doctor</TableHead>
          <TableHead>Requested Date</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Book</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <Row key={entry.id} entry={entry} />
        ))}
      </TableBody>
    </Table>
  )
}

function Row({ entry }: { entry: Entries[number] }) {
  const [pending, startTransition] = useTransition()

  return (
    <TableRow>
      <TableCell>
        <Link href={`/patients/${entry.patientId}`} className="font-medium hover:underline">
          {entry.patient.firstName} {entry.patient.lastName}
        </Link>
      </TableCell>
      <TableCell>{entry.doctor ? `Dr. ${entry.doctor.name}` : "Any"}</TableCell>
      <TableCell>{formatDate(entry.requestedDate)}</TableCell>
      <TableCell className="max-w-xs truncate">{entry.reason}</TableCell>
      <TableCell>{entry.priority}</TableCell>
      <TableCell>
        <Select
          items={{ WAITING: "WAITING", NOTIFIED: "NOTIFIED", CONVERTED: "CONVERTED", EXPIRED: "EXPIRED" }}
          value={entry.status}
          disabled={pending}
          onValueChange={(value) =>
            value &&
            startTransition(async () => {
              try {
                await updateWaitingListStatus(entry.id, value as "WAITING" | "NOTIFIED" | "CONVERTED" | "EXPIRED")
              } catch {
                toast.error("Could not update status")
              }
            })
          }
        >
          <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["WAITING", "NOTIFIED", "CONVERTED", "EXPIRED"].map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Button
          size="sm"
          variant="outline"
          nativeButton={false}
          render={<Link href={`/appointments/new?patientId=${entry.patientId}`}>Book</Link>}
        />
      </TableCell>
      <TableCell>
        <DeleteButton onDelete={() => deleteWaitingListEntry(entry.id)} />
      </TableCell>
    </TableRow>
  )
}
