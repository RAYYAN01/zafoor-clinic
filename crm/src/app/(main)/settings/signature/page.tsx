import { getDoctors } from "@/lib/auth"
import { SignatureManager } from "@/components/emr/signature-manager"

export default async function SignatureSettingsPage() {
  const doctors = await getDoctors()

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Digital Signature</h1>
        <p className="text-sm text-muted-foreground">
          Each doctor&apos;s signature is stamped on signed consultations, discharge summaries, referrals, and certificates.
        </p>
      </div>
      <SignatureManager doctors={doctors} />
    </div>
  )
}
