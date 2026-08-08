import Link from "next/link"
import type { getPatients } from "@/actions/patients"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { bloodGroupLabels, patientStatusLabels } from "@/lib/labels"
import { calculateAge, initials, patientDisplayName } from "@/lib/format"

type Patients = Awaited<ReturnType<typeof getPatients>>["patients"]

export function PatientTable({ patients }: { patients: Patients }) {
  if (patients.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">No patients found.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Patient</TableHead>
          <TableHead>UHID</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Age / Gender</TableHead>
          <TableHead>Blood Group</TableHead>
          <TableHead>Tags</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {patients.map((patient) => (
          <TableRow key={patient.id} className="cursor-pointer">
            <TableCell>
              <Link href={`/patients/${patient.id}`} className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">{initials(patientDisplayName(patient))}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{patientDisplayName(patient)}</span>
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">{patient.uhid}</TableCell>
            <TableCell>{patient.phone}</TableCell>
            <TableCell>
              {calculateAge(patient.dob) ?? "—"}
              {patient.gender ? ` / ${patient.gender[0]}${patient.gender.slice(1).toLowerCase()}` : ""}
            </TableCell>
            <TableCell>{bloodGroupLabels[patient.bloodGroup ?? "UNKNOWN"]}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {patient.tags.slice(0, 2).map(({ tag }) => (
                  <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color, color: tag.color }}>
                    {tag.name}
                  </Badge>
                ))}
                {patient.tags.length > 2 && (
                  <Badge variant="outline">+{patient.tags.length - 2}</Badge>
                )}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={patient.status === "ACTIVE" ? "default" : "secondary"}>
                {patientStatusLabels[patient.status]}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
