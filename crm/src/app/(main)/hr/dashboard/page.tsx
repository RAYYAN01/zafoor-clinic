import Link from "next/link"
import { Users, UserCheck, CalendarOff, ClipboardList, Briefcase, CheckSquare, CalendarClock, UserPlus2, LogOut } from "lucide-react"
import { getHrDashboard } from "@/actions/hr-dashboard"
import { StatCard } from "@/components/dashboard/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function HrDashboardPage() {
  const stats = await getHrDashboard()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">HR Dashboard</h1>
        <p className="text-sm text-muted-foreground">Workforce overview across Naaz Hospital.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total Employees" value={stats.totalEmployees} icon={Users} tone="default" />
        <StatCard label="Active Today" value={stats.todayAttendance} icon={UserCheck} tone="success" />
        <StatCard label="On Leave Today" value={stats.onLeaveToday} icon={CalendarOff} tone="warning" />
        <StatCard label="Pending Leave Requests" value={stats.pendingLeaveRequests} icon={ClipboardList} tone="warning" />
        <StatCard label="Open Job Openings" value={stats.openJobOpenings} icon={Briefcase} tone="info" />
        <StatCard label="Open Tasks" value={stats.openTasks} icon={CheckSquare} tone="accent" />
        <StatCard label="Upcoming Meetings" value={stats.upcomingMeetings} icon={CalendarClock} tone="default" />
        <StatCard label="Pending Onboarding" value={stats.pendingOnboarding} icon={UserPlus2} tone="info" />
        <StatCard label="Pending Exits" value={stats.pendingExits} icon={LogOut} tone="danger" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Headcount by Department</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {stats.departmentBreakdown.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">No departments set up yet.</p>
          )}
          {stats.departmentBreakdown.map((d) => (
            <div key={d.name} className="flex items-center justify-between text-sm rounded-lg px-2 py-2 hover:bg-muted">
              <span>{d.name}</span>
              <span className="font-medium tabular-nums">{d.count}</span>
            </div>
          ))}
          <Link href="/hr/departments" className="text-xs text-primary hover:underline">Manage departments</Link>
        </CardContent>
      </Card>
    </div>
  )
}
