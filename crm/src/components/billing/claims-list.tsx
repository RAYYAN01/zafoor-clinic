"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency, formatDate, patientDisplayName } from "@/lib/format"
import { claimStatusLabels, claimStatusColors } from "@/lib/labels"
import { updateInsuranceClaim, type getInsuranceClaims } from "@/actions/insurance-claims"

type Claims = Awaited<ReturnType<typeof getInsuranceClaims>>

export function ClaimsList({ claims }: { claims: Claims }) {
  if (claims.length === 0) {
    return <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No insurance claims yet.</CardContent></Card>
  }

  return (
    <div className="space-y-3">
      {claims.map((c) => (
        <ClaimRow key={c.id} claim={c} />
      ))}
    </div>
  )
}

function ClaimRow({ claim }: { claim: Claims[number] }) {
  const [open, setOpen] = useState(false)

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 py-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{claim.claimNumber}</p>
            <Link href={`/patients/${claim.patientId}`} className="text-xs text-primary hover:underline">
              {patientDisplayName(claim.patient)}
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {claim.insurance.provider} — {claim.insurance.policyNumber}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Claimed {formatCurrency(Number(claim.claimedAmount))}
            {claim.approvedAmount != null ? ` · Approved ${formatCurrency(Number(claim.approvedAmount))}` : ""}
            {" · "}{formatDate(claim.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="secondary" className={claimStatusColors[claim.status]}>{claimStatusLabels[claim.status]}</Badge>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Update</Button>
        </div>
      </CardContent>
      <UpdateClaimDialog open={open} onOpenChange={setOpen} claim={claim} />
    </Card>
  )
}

function UpdateClaimDialog({
  open,
  onOpenChange,
  claim,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  claim: Claims[number]
}) {
  const [status, setStatus] = useState(claim.status)
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Claim {claim.claimNumber}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              try {
                await updateInsuranceClaim(claim.id, {
                  status,
                  approvedAmount: fd.get("approvedAmount") ? Number(fd.get("approvedAmount")) : undefined,
                  rejectionReason: String(fd.get("rejectionReason") || "") || undefined,
                  notes: String(fd.get("notes") || "") || undefined,
                })
                toast.success("Claim updated")
                onOpenChange(false)
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not update claim")
              }
            })
          }}
        >
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select items={claimStatusLabels} value={status} onValueChange={(v) => setStatus((v ?? "DRAFT") as typeof status)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(claimStatusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="approvedAmount">Approved amount</Label>
            <Input id="approvedAmount" name="approvedAmount" type="number" defaultValue={claim.approvedAmount ? Number(claim.approvedAmount) : undefined} />
          </div>
          {status === "REJECTED" && (
            <div className="space-y-1.5">
              <Label htmlFor="rejectionReason">Rejection reason</Label>
              <Textarea id="rejectionReason" name="rejectionReason" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" />
          </div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Update Claim"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
