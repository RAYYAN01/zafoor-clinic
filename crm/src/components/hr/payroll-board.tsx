"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Plus, Play } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/format"
import { payrollRunStatusLabels, payrollRunStatusColors } from "@/lib/labels"
import { upsertSalaryStructure, processPayrollRun, markPayrollRunPaid, type getSalaryStructures, type getPayrollRuns } from "@/actions/payroll"

type Structures = Awaited<ReturnType<typeof getSalaryStructures>>
type Runs = Awaited<ReturnType<typeof getPayrollRuns>>
type Employees = { id: string; name: string; employeeCode: string }[]

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function PayrollBoard({ structures, runs, employees }: { structures: Structures; runs: Runs; employees: Employees }) {
  const [structureOpen, setStructureOpen] = useState(false)
  const [runOpen, setRunOpen] = useState(false)

  return (
    <Tabs defaultValue="structures">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="structures">Salary Structures</TabsTrigger>
          <TabsTrigger value="runs">Payroll Runs</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="structures" className="space-y-4 mt-4">
        <div className="flex justify-end">
          <Button className="gap-1.5" onClick={() => setStructureOpen(true)}>
            <Plus className="h-4 w-4" />
            Set Salary Structure
          </Button>
        </div>
        {structures.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No salary structures configured.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {structures.map((s) => {
              const gross = Number(s.basic) + Number(s.hra) + Number(s.conveyance) + Number(s.medicalAllowance) + Number(s.specialAllowance)
              return (
                <Card key={s.id}>
                  <CardContent className="flex items-center justify-between py-3.5">
                    <div>
                      <p className="text-sm font-medium">{s.employee.user.name}</p>
                      <p className="text-xs text-muted-foreground">{s.employee.department?.name ?? "—"}</p>
                    </div>
                    <p className="text-sm font-semibold">{formatCurrency(gross)}<span className="text-xs text-muted-foreground font-normal">/mo gross</span></p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </TabsContent>

      <TabsContent value="runs" className="space-y-4 mt-4">
        <div className="flex justify-end">
          <Button className="gap-1.5" onClick={() => setRunOpen(true)}>
            <Play className="h-4 w-4" />
            Process Payroll Run
          </Button>
        </div>
        {runs.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No payroll runs yet.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {runs.map((r) => (
              <RunRow key={r.id} run={r} />
            ))}
          </div>
        )}
      </TabsContent>

      <SalaryStructureDialog open={structureOpen} onOpenChange={setStructureOpen} employees={employees} />
      <ProcessRunDialog open={runOpen} onOpenChange={setRunOpen} />
    </Tabs>
  )
}

function RunRow({ run }: { run: Runs[number] }) {
  const [pending, startTransition] = useTransition()
  const total = run.payslips.reduce((sum, p) => sum + Number(p.netPay), 0)

  return (
    <Card>
      <CardContent className="flex items-center justify-between py-3.5">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{MONTH_NAMES[run.month - 1]} {run.year}</p>
            <Badge variant="secondary" className={payrollRunStatusColors[run.status]}>{payrollRunStatusLabels[run.status]}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{run.payslips.length} payslip{run.payslips.length === 1 ? "" : "s"} · {formatCurrency(total)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/hr/payroll/${run.id}`} className="text-xs text-primary hover:underline">View</Link>
          {run.status === "PROCESSED" && (
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  try {
                    await markPayrollRunPaid(run.id)
                    toast.success("Marked as paid")
                  } catch {
                    toast.error("Could not update run")
                  }
                })
              }
            >
              Mark Paid
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function SalaryStructureDialog({ open, onOpenChange, employees }: { open: boolean; onOpenChange: (v: boolean) => void; employees: Employees }) {
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "")
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Set Salary Structure</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            if (!employeeId) { toast.error("Select an employee"); return }
            startTransition(async () => {
              try {
                await upsertSalaryStructure({
                  employeeId,
                  basic: Number(fd.get("basic") || 0),
                  hra: Number(fd.get("hra") || 0),
                  conveyance: Number(fd.get("conveyance") || 0),
                  medicalAllowance: Number(fd.get("medicalAllowance") || 0),
                  specialAllowance: Number(fd.get("specialAllowance") || 0),
                  pf: Number(fd.get("pf") || 0),
                  professionalTax: Number(fd.get("professionalTax") || 0),
                  otherDeductions: Number(fd.get("otherDeductions") || 0),
                })
                toast.success("Salary structure saved")
                onOpenChange(false)
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not save salary structure")
              }
            })
          }}
        >
          <div className="space-y-1.5">
            <Label>Employee</Label>
            <Select items={Object.fromEntries(employees.map((e) => [e.id, `${e.name} (${e.employeeCode})`]))} value={employeeId} onValueChange={(v) => setEmployeeId(v ?? "")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{employees.map((e) => (<SelectItem key={e.id} value={e.id}>{e.name} ({e.employeeCode})</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="basic">Basic</Label><Input id="basic" name="basic" type="number" required /></div>
            <div className="space-y-1.5"><Label htmlFor="hra">HRA</Label><Input id="hra" name="hra" type="number" /></div>
            <div className="space-y-1.5"><Label htmlFor="conveyance">Conveyance</Label><Input id="conveyance" name="conveyance" type="number" /></div>
            <div className="space-y-1.5"><Label htmlFor="medicalAllowance">Medical allowance</Label><Input id="medicalAllowance" name="medicalAllowance" type="number" /></div>
            <div className="space-y-1.5"><Label htmlFor="specialAllowance">Special allowance</Label><Input id="specialAllowance" name="specialAllowance" type="number" /></div>
            <div className="space-y-1.5"><Label htmlFor="pf">PF</Label><Input id="pf" name="pf" type="number" /></div>
            <div className="space-y-1.5"><Label htmlFor="professionalTax">Professional tax</Label><Input id="professionalTax" name="professionalTax" type="number" /></div>
            <div className="space-y-1.5"><Label htmlFor="otherDeductions">Other deductions</Label><Input id="otherDeductions" name="otherDeductions" type="number" /></div>
          </div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Save Structure"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ProcessRunDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const now = new Date()
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Process Payroll Run</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              try {
                await processPayrollRun({ month: Number(fd.get("month")), year: Number(fd.get("year")) })
                toast.success("Payroll run processed")
                onOpenChange(false)
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not process payroll run")
              }
            })
          }}
        >
          <p className="text-xs text-muted-foreground">Generates payslips for all active employees with a salary structure.</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="month">Month</Label><Input id="month" name="month" type="number" min={1} max={12} defaultValue={now.getMonth() + 1} required /></div>
            <div className="space-y-1.5"><Label htmlFor="year">Year</Label><Input id="year" name="year" type="number" defaultValue={now.getFullYear()} required /></div>
          </div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Processing…" : "Process Run"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
