import Link from "next/link"
import { Plus } from "lucide-react"
import { getAppointments } from "@/actions/appointments"
import { getDoctors } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AppointmentFilters } from "@/components/appointments/appointment-filters"
import { AppointmentTable } from "@/components/appointments/appointment-table"
import { Pagination } from "@/components/shared/pagination"

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ doctorId?: string; status?: string; date?: string; page?: string }>
}) {
  const sp = await searchParams
  const page = Number(sp.page) || 1
  const from = sp.date ? new Date(`${sp.date}T00:00:00`) : undefined
  const to = sp.date ? new Date(`${sp.date}T23:59:59`) : undefined

  const [{ appointments, total, pageSize }, doctors] = await Promise.all([
    getAppointments({ doctorId: sp.doctorId, status: sp.status, from, to, page }),
    getDoctors(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Appointments</h1>
          <p className="text-sm text-muted-foreground">{total} appointment{total === 1 ? "" : "s"} found</p>
        </div>
        <Button
          className="gap-1.5"
          nativeButton={false}
          render={
            <Link href="/appointments/new">
              <Plus className="h-4 w-4" />
              Book Appointment
            </Link>
          }
        />
      </div>

      <AppointmentFilters doctors={doctors} />

      <Card>
        <CardContent className="p-0">
          <AppointmentTable appointments={appointments} />
        </CardContent>
      </Card>

      <Pagination total={total} pageSize={pageSize} currentPage={page} />
    </div>
  )
}
