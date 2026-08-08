"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Plus, Check, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { formatDate } from "@/lib/format"
import { leaveRequestStatusLabels, leaveRequestStatusColors } from "@/lib/labels"
import { createLeaveType, requestLeave, decideLeaveRequest, type getLeaveTypes, type getLeaveRequests } from "@/actions/leaves"

type LeaveTypes = Awaited<ReturnType<typeof getLeaveTypes>>
type Requests = Awaited<ReturnType<typeof getLeaveRequests>>
type Employees = { id: string; name: string; employeeCode: string }[]

export function LeavesBoard({ types, requests, employees }: { types: LeaveTypes; requests: Requests; employees: Employees }) {
  const [typeOpen, setTypeOpen] = useState(false)
  const [requestOpen, setRequestOpen] = useState(false)

  return (
    <Tabs defaultValue="requests">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="types">Leave Types</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="requests" className="space-y-4 mt-4">
        <div className="flex justify-end">
          <Button className="gap-1.5" onClick={() => setRequestOpen(true)} disabled={types.length === 0}>
            <Plus className="h-4 w-4" />
            Request Leave
          </Button>
        </div>
        {requests.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No leave requests yet.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => (
              <RequestRow key={r.id} request={r} />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="types" className="space-y-4 mt-4">
        <div className="flex justify-end">
          <Button className="gap-1.5" onClick={() => setTypeOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Leave Type
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {types.map((t) => (
            <Card key={t.id}>
              <CardContent className="py-4">
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.daysPerYear} days/year · {t.paid ? "Paid" : "Unpaid"}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <AddLeaveTypeDialog open={typeOpen} onOpenChange={setTypeOpen} />
      <RequestLeaveDialog open={requestOpen} onOpenChange={setRequestOpen} types={types} employees={employees} />
    </Tabs>
  )
}

function RequestRow({ request }: { request: Requests[number] }) {
  const [pending, startTransition] = useTransition()

  function decide(status: "APPROVED" | "REJECTED") {
    startTransition(async () => {
      try {
        await decideLeaveRequest(request.id, { status })
        toast.success(status === "APPROVED" ? "Leave approved" : "Leave rejected")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not update request")
      }
    })
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 py-3.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{request.employee.user.name}</p>
            <Badge variant="secondary" className={leaveRequestStatusColors[request.status]}>{leaveRequestStatusLabels[request.status]}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {request.leaveType.name} · {formatDate(request.fromDate)} – {formatDate(request.toDate)} ({request.days}d)
          </p>
          {request.reason && <p className="text-xs text-muted-foreground/80">{request.reason}</p>}
        </div>
        {request.status === "PENDING" && (
          <div className="flex items-center gap-1.5 shrink-0">
            <Button size="icon" variant="outline" className="h-8 w-8 text-emerald-600" disabled={pending} onClick={() => decide("APPROVED")}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" className="h-8 w-8 text-red-600" disabled={pending} onClick={() => decide("REJECTED")}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AddLeaveTypeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [paid, setPaid] = useState(true)
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Leave Type</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              try {
                await createLeaveType({
                  name: String(fd.get("name") || ""),
                  daysPerYear: Number(fd.get("daysPerYear") || 0),
                  paid,
                })
                toast.success("Leave type added")
                onOpenChange(false)
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not add leave type")
              }
            })
          }}
        >
          <div className="space-y-1.5"><Label htmlFor="name">Name</Label><Input id="name" name="name" required /></div>
          <div className="space-y-1.5"><Label htmlFor="daysPerYear">Days per year</Label><Input id="daysPerYear" name="daysPerYear" type="number" required /></div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={paid} onCheckedChange={(v) => setPaid(v === true)} />
            Paid leave
          </label>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Add Leave Type"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RequestLeaveDialog({ open, onOpenChange, types, employees }: { open: boolean; onOpenChange: (v: boolean) => void; types: LeaveTypes; employees: Employees }) {
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "")
  const [leaveTypeId, setLeaveTypeId] = useState(types[0]?.id ?? "")
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Request Leave</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            if (!employeeId || !leaveTypeId) { toast.error("Select employee and leave type"); return }
            startTransition(async () => {
              try {
                await requestLeave({
                  employeeId,
                  leaveTypeId,
                  fromDate: String(fd.get("fromDate") || ""),
                  toDate: String(fd.get("toDate") || ""),
                  reason: String(fd.get("reason") || "") || undefined,
                })
                toast.success("Leave requested")
                onOpenChange(false)
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not request leave")
              }
            })
          }}
        >
          <div className="space-y-1.5">
            <Label>Employee</Label>
            <Select items={Object.fromEntries(employees.map((e) => [e.id, e.name]))} value={employeeId} onValueChange={(v) => setEmployeeId(v ?? "")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{employees.map((e) => (<SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Leave type</Label>
            <Select items={Object.fromEntries(types.map((t) => [t.id, t.name]))} value={leaveTypeId} onValueChange={(v) => setLeaveTypeId(v ?? "")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{types.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="fromDate">From</Label><Input id="fromDate" name="fromDate" type="date" required /></div>
            <div className="space-y-1.5"><Label htmlFor="toDate">To</Label><Input id="toDate" name="toDate" type="date" required /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="reason">Reason</Label><Textarea id="reason" name="reason" /></div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Requesting…" : "Request Leave"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
