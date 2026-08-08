import Link from "next/link"
import { Plus } from "lucide-react"
import { getPatients, listAllTags } from "@/actions/patients"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PatientFilters } from "@/components/patients/patient-filters"
import { PatientTable } from "@/components/patients/patient-table"
import { Pagination } from "@/components/shared/pagination"

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; tag?: string; page?: string }>
}) {
  const sp = await searchParams
  const page = Number(sp.page) || 1
  const [{ patients, total, pageSize }, tags] = await Promise.all([
    getPatients({ query: sp.q, status: sp.status, tagId: sp.tag, page }),
    listAllTags(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Patients</h1>
          <p className="text-sm text-muted-foreground">{total} patient{total === 1 ? "" : "s"} registered</p>
        </div>
        <Button
          className="gap-1.5"
          nativeButton={false}
          render={
            <Link href="/patients/new">
              <Plus className="h-4 w-4" />
              New Patient
            </Link>
          }
        />
      </div>

      <PatientFilters tags={tags} />

      <Card>
        <CardContent className="p-0">
          <PatientTable patients={patients} />
        </CardContent>
      </Card>

      <Pagination total={total} pageSize={pageSize} currentPage={page} />
    </div>
  )
}
