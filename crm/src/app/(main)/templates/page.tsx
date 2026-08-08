import { getDoctors } from "@/lib/auth"
import { TemplatesManager } from "@/components/emr/templates-manager"

export default async function TemplatesPage() {
  const doctors = await getDoctors()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Doctor Templates</h1>
        <p className="text-sm text-muted-foreground">
          Reusable SOAP note templates doctors can insert during a consultation to speed up documentation.
        </p>
      </div>
      <TemplatesManager doctors={doctors} />
    </div>
  )
}
