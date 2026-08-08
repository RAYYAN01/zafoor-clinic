"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { initials, formatTime } from "@/lib/format"
import { attendanceStatusLabels, attendanceStatusColors, attendanceSourceLabels } from "@/lib/labels"
import { markAttendance, syncBiometricToAttendance, type getAttendanceForDate, type getBiometricDevices, type getBiometricLogs } from "@/actions/attendance"

type Rows = Awaited<ReturnType<typeof getAttendanceForDate>>
type Devices = Awaited<ReturnType<typeof getBiometricDevices>>
type Logs = Awaited<ReturnType<typeof getBiometricLogs>>

export function AttendanceBoard({ rows, devices, logs }: { rows: Rows; devices: Devices; logs: Logs }) {
  return (
    <Tabs defaultValue="today">
      <TabsList>
        <TabsTrigger value="today">Today&apos;s Roster</TabsTrigger>
        <TabsTrigger value="biometric">Biometric Logs</TabsTrigger>
      </TabsList>

      <TabsContent value="today" className="space-y-2 mt-4">
        {rows.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No active employees.</CardContent></Card>
        ) : (
          rows.map((row) => <AttendanceRow key={row.employee.id} row={row} />)
        )}
      </TabsContent>

      <TabsContent value="biometric" className="space-y-4 mt-4">
        <BiometricPanel devices={devices} logs={logs} />
      </TabsContent>
    </Tabs>
  )
}

function AttendanceRow({ row }: { row: Rows[number] }) {
  const [pending, startTransition] = useTransition()
  const status = row.record?.status ?? "ABSENT"

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-8 w-8 shrink-0"><AvatarFallback className="text-xs">{initials(row.employee.user.name)}</AvatarFallback></Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{row.employee.user.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {row.employee.department?.name ?? "—"}
              {row.record?.checkIn ? ` · In ${formatTime(row.record.checkIn)}` : ""}
              {row.record?.checkOut ? ` · Out ${formatTime(row.record.checkOut)}` : ""}
              {row.record ? ` · ${attendanceSourceLabels[row.record.source]}` : ""}
            </p>
          </div>
        </div>
        <Select
          items={attendanceStatusLabels}
          value={status}
          onValueChange={(v) => {
            if (!v) return
            startTransition(async () => {
              try {
                await markAttendance({
                  employeeId: row.employee.id,
                  date: new Date().toISOString().slice(0, 10),
                  checkIn: v === "PRESENT" || v === "LATE" || v === "HALF_DAY" ? new Date().toISOString() : undefined,
                  status: v as never,
                })
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not mark attendance")
              }
            })
          }}
        >
          <SelectTrigger className="h-7 w-[130px] text-xs shrink-0" disabled={pending}>
            <SelectValue>
              <Badge variant="secondary" className={attendanceStatusColors[status]}>{attendanceStatusLabels[status]}</Badge>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(attendanceStatusLabels).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}

function BiometricPanel({ devices, logs }: { devices: Devices; logs: Logs }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{devices.length} device{devices.length === 1 ? "" : "s"} · {logs.length} punch{logs.length === 1 ? "" : "es"} today</p>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              try {
                const result = await syncBiometricToAttendance(new Date())
                toast.success(`Synced ${result.synced} employee${result.synced === 1 ? "" : "s"} from biometric punches`)
                router.refresh()
              } catch {
                toast.error("Could not sync biometric logs")
              }
            })
          }
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Sync to Attendance
        </Button>
      </div>

      {logs.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No biometric punches recorded today.</CardContent></Card>
      ) : (
        <div className="space-y-1.5">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
              <span>{log.employee.user.name}</span>
              <span className="text-xs text-muted-foreground">{log.device.name} · {log.punchType} · {formatTime(log.punchTime)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
