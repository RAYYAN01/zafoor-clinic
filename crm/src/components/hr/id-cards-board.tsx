"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { CreditCard, Stethoscope } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { initials, formatDate } from "@/lib/format"
import { bloodGroupLabels } from "@/lib/labels"
import { issueIdCard, type getEmployees } from "@/actions/employees"

type Employees = Awaited<ReturnType<typeof getEmployees>>

export function IdCardsBoard({ employees }: { employees: Employees }) {
  const [preview, setPreview] = useState<Employees[number] | null>(null)

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {employees.map((e) => (
          <Card key={e.id}>
            <CardContent className="py-4 flex items-center gap-3">
              <Avatar className="h-10 w-10 shrink-0"><AvatarFallback className="text-xs">{initials(e.user.name)}</AvatarFallback></Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{e.user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{e.employeeCode}</p>
              </div>
              <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={() => setPreview(e)}>
                <CreditCard className="h-3.5 w-3.5" /> Card
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <IdCardDialog employee={preview} onOpenChange={(v) => !v && setPreview(null)} />
    </div>
  )
}

function IdCardDialog({ employee, onOpenChange }: { employee: Employees[number] | null; onOpenChange: (v: boolean) => void }) {
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={!!employee} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Employee ID Card</DialogTitle></DialogHeader>
        {employee && (
          <div className="space-y-4">
            <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Stethoscope className="h-3.5 w-3.5" />
                </div>
                <p className="text-sm font-semibold">Naaz Hospital</p>
              </div>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary/30">
                  <AvatarFallback className="text-lg">{initials(employee.user.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-base font-semibold">{employee.user.name}</p>
                  <p className="text-sm text-muted-foreground">{employee.designation?.title ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{employee.department?.name ?? "—"}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-t pt-3">
                <div><p className="text-muted-foreground">Employee ID</p><p className="font-medium">{employee.employeeCode}</p></div>
                <div><p className="text-muted-foreground">Blood Group</p><p className="font-medium">{employee.bloodGroup ? bloodGroupLabels[employee.bloodGroup] : "—"}</p></div>
                <div><p className="text-muted-foreground">Joined</p><p className="font-medium">{formatDate(employee.dateOfJoining)}</p></div>
                <div><p className="text-muted-foreground">Phone</p><p className="font-medium">{employee.user.phone ?? "—"}</p></div>
              </div>
            </div>
            <Button
              className="w-full"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
