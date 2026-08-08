"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DeleteButton } from "@/components/shared/delete-button"
import { formatDate } from "@/lib/format"
import { employeeDocCategoryLabels } from "@/lib/labels"
import { addEmployeeDocument, deleteEmployeeDocument, type getEmployeeDocuments } from "@/actions/hr-documents"

type Documents = Awaited<ReturnType<typeof getEmployeeDocuments>>
type Employees = { id: string; name: string; employeeCode: string }[]

export function DocumentsBoard({ documents, employees }: { documents: Documents; employees: Employees }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="gap-1.5" onClick={() => setOpen(true)} disabled={employees.length === 0}>
          <Plus className="h-4 w-4" />
          Add Document
        </Button>
      </div>

      {documents.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No documents uploaded yet.</CardContent></Card>
      ) : (
        <div className="space-y-1.5">
          {documents.map((d) => (
            <Card key={d.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-sm font-medium hover:underline">{d.title}</a>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {d.employee.user.name} · <Badge variant="outline">{employeeDocCategoryLabels[d.category]}</Badge> · {formatDate(d.uploadedAt)}
                  </p>
                </div>
                <DeleteButton onDelete={() => deleteEmployeeDocument(d.id)} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddDocumentDialog open={open} onOpenChange={setOpen} employees={employees} />
    </div>
  )
}

function AddDocumentDialog({ open, onOpenChange, employees }: { open: boolean; onOpenChange: (v: boolean) => void; employees: Employees }) {
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "")
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
            if (!employeeId) { toast.error("Select an employee"); return }
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
          <div className="space-y-1.5">
            <Label>Employee</Label>
            <Select items={Object.fromEntries(employees.map((e) => [e.id, e.name]))} value={employeeId} onValueChange={(v) => setEmployeeId(v ?? "")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{employees.map((e) => (<SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>))}</SelectContent>
            </Select>
          </div>
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
