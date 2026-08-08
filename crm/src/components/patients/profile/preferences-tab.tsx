"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { commChannelLabels } from "@/lib/labels"
import { upsertCommunicationPreference } from "@/actions/patients"
import type { getPatientById } from "@/actions/patients"

type Patient = NonNullable<Awaited<ReturnType<typeof getPatientById>>>

export function PreferencesTab({ patient }: { patient: Patient }) {
  const [pending, startTransition] = useTransition()
  const pref = patient.communicationPreference

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle className="text-base">Communication Preferences</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              try {
                await upsertCommunicationPreference(patient.id, {
                  preferredChannel: String(fd.get("preferredChannel") || "SMS") as never,
                  allowSms: fd.get("allowSms") === "on",
                  allowEmail: fd.get("allowEmail") === "on",
                  allowWhatsapp: fd.get("allowWhatsapp") === "on",
                  allowCall: fd.get("allowCall") === "on",
                  allowMarketing: fd.get("allowMarketing") === "on",
                  preferredLanguage: String(fd.get("preferredLanguage") || "English"),
                })
                toast.success("Preferences saved")
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not save preferences")
              }
            })
          }}
        >
          <div className="space-y-1.5">
            <Label>Preferred channel</Label>
            <Select
              items={{ SMS: commChannelLabels.SMS, EMAIL: commChannelLabels.EMAIL, WHATSAPP: commChannelLabels.WHATSAPP, CALL: commChannelLabels.CALL }}
              name="preferredChannel"
              defaultValue={pref?.preferredChannel ?? "SMS"}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["SMS", "EMAIL", "WHATSAPP", "CALL"] as const).map((c) => (
                  <SelectItem key={c} value={c}>{commChannelLabels[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="preferredLanguage">Preferred language</Label>
            <Input id="preferredLanguage" name="preferredLanguage" defaultValue={pref?.preferredLanguage ?? "English"} />
          </div>

          <div className="space-y-3 pt-2">
            {[
              { name: "allowSms", label: "Allow SMS", checked: pref?.allowSms ?? true },
              { name: "allowEmail", label: "Allow Email", checked: pref?.allowEmail ?? true },
              { name: "allowWhatsapp", label: "Allow WhatsApp", checked: pref?.allowWhatsapp ?? true },
              { name: "allowCall", label: "Allow Calls", checked: pref?.allowCall ?? true },
              { name: "allowMarketing", label: "Allow Marketing Communication", checked: pref?.allowMarketing ?? false },
            ].map((toggle) => (
              <div key={toggle.name} className="flex items-center justify-between">
                <Label htmlFor={toggle.name} className="font-normal">{toggle.label}</Label>
                <Switch id={toggle.name} name={toggle.name} defaultChecked={toggle.checked} />
              </div>
            ))}
          </div>

          <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save Preferences"}</Button>
        </form>
      </CardContent>
    </Card>
  )
}
