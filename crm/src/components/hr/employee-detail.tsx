"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDate, formatCurrency, calculateAge } from "@/lib/format"
import { employeeStatusLabels, employeeStatusColors, employmentTypeLabels, employeeDocCategoryLabels } from "@/lib/labels"
import { updateEmployeeStatus, issueIdCard, type getEmployee } from "@/actions/employees"
import { addEmployeeDocument } from "@/actions/hr-documents"
import type { getEmployeePayslips } from "@/actions/payroll"

type Employee = NonNullable<Awaited<ReturnType<typeof getEmployee>>>
type Payslips = Awaited<ReturnType<typeof getEmployeePayslips>>

export function EmployeeDetail({ employee, payslips }: { employee: Employee; payslips: Payslips }) {
  const [pending, startTransition] = useTransition()
  const [docOpen, setDocOpen] = useState(false)
  const [idPending, startIdTransition] = useTransition()

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Profile</CardTitle>
          <Select
            items={employeeStatusLabels}
            value={employee.status}
            onValueChange={(v) => {
              if (!v) return
              startTransition(async () => {
                try {
                  await updateEmployeeStatus(employee.id, { status: v as never })
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not update status")
                }
              })
            }}
          >
            <SelectTrigger className="h-7 w-[140px] text-xs" disabled={pending}>
              <SelectValue>
                <Badge variant="secondary" className={employeeStatusColors[employee.status]}>{employeeStatusLabels[employee.status]}</Badge>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(employeeStatusLabels).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <Field label="Department" value={employee.department?.name ?? "—"} />
          <Field label="Designation" value={employee.designation?.title ?? "—"} />
          <Field label="Employment type" value={employmentTypeLabels[employee.employmentType]} />
          <Field label="Reporting manager" value={employee.reportingManager?.user.name ?? "—"} />
          <Field label="Date of joining" value={formatDate(employee.dateOfJoining)} />
          <Field label="Date of birth" value={employee.dob ? `${formatDate(employee.dob)} (${calculateAge(employee.dob)}y)` : "—"} />
          <Field label="Phone" value={employee.user.phone ?? "—"} />
          <Field label="Address" value={employee.address ?? "—"} />
          <Field label="Emergency contact" value={employee.emergencyContactName ? `${employee.emergencyContactName} · ${employee.emergencyContactPhone ?? ""}` : "—"} />
          <Field label="Direct reports" value={String(employee.directReports.length)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">ID Card</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            {employee.idCardIssuedAt ? `Issued ${formatDate(employee.idCardIssuedAt)}` : "Not issued yet."}
          </p>
          <Button
            size="sm"
            variant="outline"
            disabled={idPending}
            onClick={() =>
              startIdTransition(async () => {
                try {
                  await issueIdCard(employee.id)
                  toast.success("ID card issued")
                } catch {
                  toast.error("Could not issue ID card")
                }
              })
            }
          >
            {employee.idCardIssuedAt ? "Reissue Card" : "Issue Card"}
          </Button>
        </CardContent>
      </Card>

      {employee.salaryStructure && (
        <Card>
          <CardHeader><CardTitle className="text-base">Salary Structure</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Basic</span><span>{formatCurrency(Number(employee.salaryStructure.basic))}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">HRA</span><span>{formatCurrency(Number(employee.salaryStructure.hra))}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Deductions</span><span>-{formatCurrency(Number(employee.salaryStructure.pf) + Number(employee.salaryStructure.professionalTax) + Number(employee.salaryStructure.otherDeductions))}</span></div>
          </CardContent>
        </Card>
      )}

      {employee.leaveBalances.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Leave Balances</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            {employee.leaveBalances.map((b) => (
              <div key={b.id} className="flex justify-between">
                <span className="text-muted-foreground">{b.leaveType.name}</span>
                <span>{b.allocated - b.used} / {b.allocated} left</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {payslips.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Payslips</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            {payslips.slice(0, 4).map((p) => (
              <div key={p.id} className="flex justify-between">
                <span className="text-muted-foreground">{p.payrollRun.month}/{p.payrollRun.year}</span>
                <span>{formatCurrency(Number(p.netPay))}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="lg:col-span-3">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Documents</CardTitle>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setDocOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Document
          </Button>
        </CardHeader>
        <CardContent className="space-y-1">
          {employee.documents.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No documents uploaded.</p>}
          {employee.documents.map((d) => (
            <a key={d.id} href={d.fileUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-muted text-sm">
              <span>{d.title}</span>
              <span className="text-xs text-muted-foreground">{employeeDocCategoryLabels[d.category]} · {formatDate(d.uploadedAt)}</span>
            </a>
          ))}
        </CardContent>
      </Card>

      <AddDocumentDialog open={docOpen} onOpenChange={setDocOpen} employeeId={employee.id} />
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}

function AddDocumentDialog({ open, onOpenChange, employeeId }: { open: boolean; onOpenChange: (v: boolean) => void; employeeId: string }) {
  const [category, setCategory] = useState("OTHER")
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Document</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              try {
                await addEmployeeDocument({
                  employeeId,
                  title: String(fd.get("title") || ""),
                  category: category as never,
                  fileUrl: String(fd.get("fileUrl") || ""),
                })
                toast.success("Document added")
                onOpenChange(false)
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not add document")
              }
            })
          }}
        >
          <div className="space-y-1.5"><Label htmlFor="title">Title</Label><Input id="title" name="title" required /></div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select items={employeeDocCategoryLabels} value={category} onValueChange={(v) => setCategory(v ?? "OTHER")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(employeeDocCategoryLabels).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label htmlFor="fileUrl">File URL</Label><Input id="fileUrl" name="fileUrl" required /></div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Add Document"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
