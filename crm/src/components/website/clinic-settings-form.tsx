"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { updateClinicSettings } from "@/actions/website"
import type { getClinicSettings } from "@/actions/website"

type Settings = Awaited<ReturnType<typeof getClinicSettings>>

export function ClinicSettingsForm({ settings }: { settings: Settings }) {
  const [pending, startTransition] = useTransition()
  const [sundayClosed, setSundayClosed] = useState(settings.sundayClosed)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await updateClinicSettings({
          name: String(fd.get("name") || ""),
          addressLine: String(fd.get("addressLine") || ""),
          landmark: String(fd.get("landmark") || "") || undefined,
          phone: String(fd.get("phone") || ""),
          email: String(fd.get("email") || ""),
          mapQuery: String(fd.get("mapQuery") || "") || undefined,
          weekdayOpen: String(fd.get("weekdayOpen") || "18:00"),
          weekdayClose: String(fd.get("weekdayClose") || "22:00"),
          sundayClosed,
          heroHeadline: String(fd.get("heroHeadline") || "") || undefined,
          aboutText: String(fd.get("aboutText") || "") || undefined,
        })
        toast.success("Site content updated")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not save")
      }
    })
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="name">Clinic name</Label>
            <Input id="name" name="name" defaultValue={settings.name} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="addressLine">Address</Label>
            <Textarea id="addressLine" name="addressLine" defaultValue={settings.addressLine} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="landmark">Landmark</Label>
            <Input id="landmark" name="landmark" defaultValue={settings.landmark ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={settings.phone} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={settings.email} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mapQuery">Map search text</Label>
            <Input id="mapQuery" name="mapQuery" defaultValue={settings.mapQuery ?? ""} placeholder="Used to open Google Maps — no coordinates needed" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="weekdayOpen">Mon–Sat opens</Label>
              <Input id="weekdayOpen" name="weekdayOpen" type="time" defaultValue={settings.weekdayOpen} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="weekdayClose">Mon–Sat closes</Label>
              <Input id="weekdayClose" name="weekdayClose" type="time" defaultValue={settings.weekdayClose} required />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={sundayClosed} onCheckedChange={(checked) => setSundayClosed(checked === true)} />
            Closed on Sundays
          </label>
          <div className="space-y-1.5">
            <Label htmlFor="heroHeadline">Homepage headline</Label>
            <Input id="heroHeadline" name="heroHeadline" defaultValue={settings.heroHeadline ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="aboutText">About text</Label>
            <Textarea id="aboutText" name="aboutText" rows={5} defaultValue={settings.aboutText ?? ""} />
          </div>
          <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save Changes"}</Button>
        </form>
      </CardContent>
    </Card>
  )
}
