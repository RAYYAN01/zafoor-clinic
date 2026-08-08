import { getAttendanceForDate, getAttendanceSummary, getBiometricDevices, getBiometricLogs } from "@/actions/attendance"
import { AttendanceBoard } from "@/components/hr/attendance-board"

export default async function AttendancePage() {
  const today = new Date()
  const [rows, summary, devices, logs] = await Promise.all([
    getAttendanceForDate(today),
    getAttendanceSummary(today, today),
    getBiometricDevices(),
    getBiometricLogs(today),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Attendance & Biometric</h1>
        <p className="text-sm text-muted-foreground">
          {summary.present} present · {summary.absent} absent · {summary.late} late · {summary.onLeave} on leave today.
        </p>
      </div>
      <AttendanceBoard rows={rows} devices={devices} logs={logs} />
    </div>
  )
}
