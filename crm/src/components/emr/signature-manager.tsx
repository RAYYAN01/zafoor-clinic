"use client"

import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SignaturePad } from "@/components/emr/signature-pad"
import { getDoctorSignature, saveDoctorSignature } from "@/actions/signature"

type Doctor = { id: string; name: string; specialization: string | null }

export function SignatureManager({ doctors }: { doctors: Doctor[] }) {
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? "")
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (!doctorId) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading indicator for the async fetch below
    setLoading(true)
    getDoctorSignature(doctorId)
      .then((sig) => setSignatureUrl(sig?.signatureUrl ?? null))
      .finally(() => setLoading(false))
  }, [doctorId])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Doctor Signature</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Doctor</Label>
          <Select
            items={Object.fromEntries(doctors.map((d) => [d.id, `Dr. ${d.name}`]))}
            value={doctorId}
            onValueChange={(v) => setDoctorId(v ?? "")}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {doctors.map((d) => (
                <SelectItem key={d.id} value={d.id}>Dr. {d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!loading && signatureUrl && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Current signature on file</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={signatureUrl} alt="Doctor signature" className="h-24 rounded-md border bg-white p-2" />
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{signatureUrl ? "Draw a new signature to replace it" : "Draw a signature below"}</p>
          <SignaturePad
            key={doctorId}
            onSave={(url) =>
              startTransition(async () => {
                try {
                  await saveDoctorSignature(doctorId, url)
                  setSignatureUrl(url)
                  toast.success("Signature saved")
                } catch {
                  toast.error("Could not save signature")
                }
              })
            }
          />
        </div>
      </CardContent>
    </Card>
  )
}
