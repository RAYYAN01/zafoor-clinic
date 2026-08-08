"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PenLine } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { signEncounter } from "@/actions/encounters"

export function SignEncounterDialog({
  encounterId,
  doctorName,
  signatureUrl,
}: {
  encounterId: string
  doctorName: string
  signatureUrl: string | null
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <PenLine className="h-3.5 w-3.5" />
        Sign & Finalize
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign & Finalize Consultation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Once signed, this consultation and its SOAP note become part of the patient&apos;s permanent record and can no longer be edited.
          </p>

          {signatureUrl ? (
            <div className="rounded-md border bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={signatureUrl} alt={`${doctorName} signature`} className="h-16" />
              <p className="text-xs text-muted-foreground mt-1">Dr. {doctorName}</p>
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              No signature on file for Dr. {doctorName}.{" "}
              <Link href="/settings/signature" className="text-primary hover:underline">
                Set one up
              </Link>{" "}
              first, or continue and sign with a timestamp only.
            </div>
          )}

          <Button
            className="w-full"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await signEncounter(encounterId)
                  toast.success("Consultation signed and finalized")
                  setOpen(false)
                  router.refresh()
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not sign consultation")
                }
              })
            }
          >
            {pending ? "Signing…" : "Confirm & Sign"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
