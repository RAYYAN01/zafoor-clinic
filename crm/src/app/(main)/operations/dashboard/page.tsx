import Link from "next/link"
import { BedDouble, HeartPulse, Scissors, Siren, FlaskConical, Radio, PillBottle, Wrench, Truck, AlertTriangle } from "lucide-react"
import { getOperationsDashboard } from "@/actions/operations-dashboard"
import { StatCard } from "@/components/dashboard/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress"

type Stats = Awaited<ReturnType<typeof getOperationsDashboard>>

export default async function OperationsDashboardPage() {
  const stats: Stats = await getOperationsDashboard()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Operations Dashboard</h1>
        <p className="text-sm text-muted-foreground">Hospital-wide capacity and department queues, live.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Emergency Waiting" value={stats.emergencyWaiting} icon={Siren} tone="danger" />
        <StatCard label="In Treatment" value={stats.emergencyInTreatment} icon={HeartPulse} tone="warning" />
        <StatCard label="OT Cases Today" value={stats.otToday.length} icon={Scissors} tone="info" />
        <StatCard label="Lab Orders Pending" value={stats.labPending} icon={FlaskConical} tone="accent" />
        <StatCard label="Radiology Pending" value={stats.radiologyPending} icon={Radio} tone="default" />
        <StatCard label="Ambulances Available" value={stats.ambulancesAvailable} icon={Truck} tone="success" />
        <StatCard label="Low Stock Medicines" value={stats.lowStockMedicines} icon={PillBottle} tone="warning" />
        <StatCard label="Expiring Batches (60d)" value={stats.expiringSoonCount} icon={AlertTriangle} tone="danger" />
        <StatCard label="Open Facility Tickets" value={stats.openTickets} icon={Wrench} tone="default" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><BedDouble className="h-4 w-4" />Bed Occupancy</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-semibold">{stats.bedOccupancy.occupied} / {stats.bedOccupancy.total}</p>
              <p className="text-sm text-muted-foreground">{stats.bedOccupancy.rate}% occupied</p>
            </div>
            <Progress value={stats.bedOccupancy.rate}>
              <ProgressTrack><ProgressIndicator /></ProgressTrack>
            </Progress>
            <Link href="/operations/beds" className="text-xs text-primary hover:underline">Manage beds & wards</Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><HeartPulse className="h-4 w-4" />ICU Occupancy</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-semibold">{stats.icuOccupancy.occupied} / {stats.icuOccupancy.total}</p>
              <p className="text-sm text-muted-foreground">{stats.icuOccupancy.rate}% occupied</p>
            </div>
            <Progress value={stats.icuOccupancy.rate}>
              <ProgressTrack><ProgressIndicator className="bg-violet-500" /></ProgressTrack>
            </Progress>
            <Link href="/operations/icu" className="text-xs text-primary hover:underline">Open ICU board</Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Today&apos;s OT Schedule</CardTitle>
          <Link href="/operations/ot" className="text-sm text-primary hover:underline">View all</Link>
        </CardHeader>
        <CardContent className="space-y-1">
          {stats.otToday.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">No surgeries scheduled today.</p>
          )}
          {stats.otToday.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-muted transition-colors">
              <div>
                <p className="text-sm font-medium">{s.procedureName}</p>
                <p className="text-xs text-muted-foreground">
                  {s.patient.firstName} {s.patient.lastName ?? ""} · Dr. {s.surgeon.name} · {s.ot.name}
                </p>
              </div>
              <p className="text-xs tabular-nums text-muted-foreground">
                {new Date(s.scheduledStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
