"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EntityDialog } from "@/components/shared/entity-dialog"
import { DeleteButton } from "@/components/shared/delete-button"
import { PatientPicker } from "@/components/appointments/patient-picker"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate, patientDisplayName } from "@/lib/format"
import { billTypeLabels, billStatusLabels, billStatusColors } from "@/lib/labels"
import { linkPatientToCorporate, unlinkPatientFromCorporate, type getCorporateAccount } from "@/actions/corporate"

type Account = NonNullable<Awaited<ReturnType<typeof getCorporateAccount>>>

export function CorporateAccountDetail({ account }: { account: Account }) {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/finance/corporate-accounts" className="text-sm text-muted-foreground hover:text-foreground">← Back</Link>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">{account.companyName}</h1>
        <p className="text-sm text-muted-foreground">
          {account.contactName}{account.contactPhone ? ` · ${account.contactPhone}` : ""}{account.gstin ? ` · GSTIN ${account.gstin}` : ""}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Linked Patients</CardTitle>
            <EntityDialog title="Link Patient">
              {(close) => <LinkPatientForm corporateAccountId={account.id} onDone={close} />}
            </EntityDialog>
          </CardHeader>
          <CardContent className="space-y-2">
            {account.patients.length === 0 && <p className="text-sm text-muted-foreground">No patients linked yet.</p>}
            {account.patients.map((link) => (
              <div key={link.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Link href={`/patients/${link.patientId}`} className="text-sm font-medium hover:underline">
                    {patientDisplayName(link.patient)}
                  </Link>
                  <p className="text-xs text-muted-foreground">{link.patient.uhid}{link.employeeId ? ` · Emp ID ${link.employeeId}` : ""}</p>
                </div>
                <DeleteButton onDelete={() => unlinkPatientFromCorporate(link.id, account.id)} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Bills</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {account.bills.length === 0 && <p className="text-sm text-muted-foreground">No bills yet.</p>}
            {account.bills.map((bill) => (
              <Link key={bill.id} href={`/billing/${bill.id}`} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted transition-colors">
                <div>
                  <p className="text-sm font-medium">{bill.billNumber}</p>
                  <p className="text-xs text-muted-foreground">{billTypeLabels[bill.type]} · {formatDate(bill.issuedAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatCurrency(Number(bill.netAmount))}</p>
                  <Badge variant="secondary" className={billStatusColors[bill.status]}>{billStatusLabels[bill.status]}</Badge>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function LinkPatientForm({ corporateAccountId, onDone }: { corporateAccountId: string; onDone: () => void }) {
  const [patientId, setPatientId] = useState("")
  const [pending, startTransition] = useTransition()

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        if (!patientId) {
          toast.error("Select a patient")
          return
        }
        startTransition(async () => {
          try {
            await linkPatientToCorporate(corporateAccountId, patientId, String(fd.get("employeeId") || "") || undefined)
            toast.success("Patient linked")
            onDone()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not link patient")
          }
        })
      }}
    >
      <div className="space-y-1.5">
        <Label>Patient</Label>
        <PatientPicker value={patientId} onChange={setPatientId} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="employeeId">Employee ID (optional)</Label>
        <Input id="employeeId" name="employeeId" />
      </div>
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Linking…" : "Link Patient"}</Button>
    </form>
  )
}
