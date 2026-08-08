import { getInsuranceClaims } from "@/actions/insurance-claims"
import { ClaimsList } from "@/components/billing/claims-list"

export default async function ClaimsPage() {
  const claims = await getInsuranceClaims()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Insurance Claims</h1>
        <p className="text-sm text-muted-foreground">{claims.length} claim{claims.length === 1 ? "" : "s"}</p>
      </div>
      <ClaimsList claims={claims} />
    </div>
  )
}
