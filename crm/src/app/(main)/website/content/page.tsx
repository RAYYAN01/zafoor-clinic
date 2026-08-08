import { getClinicSettings } from "@/actions/website"
import { ClinicSettingsForm } from "@/components/website/clinic-settings-form"

export default async function WebsiteContentPage() {
  const settings = await getClinicSettings()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Site Content</h1>
        <p className="text-sm text-muted-foreground">
          Clinic identity, timings, and homepage copy shown on the public website. Changes take effect immediately.
        </p>
      </div>
      <ClinicSettingsForm settings={settings} />
    </div>
  )
}
