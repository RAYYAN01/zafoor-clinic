"use client"

import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EntityDialog } from "@/components/shared/entity-dialog"
import { DeleteButton } from "@/components/shared/delete-button"
import { getDoctorTemplates, createDoctorTemplate, deleteDoctorTemplate } from "@/actions/templates"

type Doctor = { id: string; name: string; specialization: string | null }
type Template = {
  id: string
  name: string
  type: string
  subjective: string | null
  objective: string | null
  assessment: string | null
  plan: string | null
}

export function TemplatesManager({ doctors }: { doctors: Doctor[] }) {
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? "")
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!doctorId) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading indicator for the async fetch below
    setLoading(true)
    getDoctorTemplates(doctorId)
      .then((t) => setTemplates(t))
      .finally(() => setLoading(false))
  }, [doctorId])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1.5 w-56">
          <Label className="text-xs text-muted-foreground">Doctor</Label>
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
        <EntityDialog title="New Template">
          {(close) => (
            <TemplateForm
              doctorId={doctorId}
              onCreated={(t) => {
                setTemplates((prev) => [...prev, t])
                close()
              }}
            />
          )}
        </EntityDialog>
      </CardHeader>
      <CardContent className="space-y-3">
        {!loading && templates.length === 0 && <p className="text-sm text-muted-foreground">No templates yet.</p>}
        {templates.map((t) => (
          <div key={t.id} className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{t.name}</p>
              <DeleteButton
                onDelete={async () => {
                  await deleteDoctorTemplate(t.id)
                  setTemplates((prev) => prev.filter((x) => x.id !== t.id))
                }}
              />
            </div>
            <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
              {t.subjective && <p><span className="font-medium">S:</span> {t.subjective}</p>}
              {t.objective && <p><span className="font-medium">O:</span> {t.objective}</p>}
              {t.assessment && <p><span className="font-medium">A:</span> {t.assessment}</p>}
              {t.plan && <p><span className="font-medium">P:</span> {t.plan}</p>}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function TemplateForm({ doctorId, onCreated }: { doctorId: string; onCreated: (t: Template) => void }) {
  const [pending, startTransition] = useTransition()

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (!doctorId) {
          toast.error("Select a doctor first")
          return
        }
        const fd = new FormData(e.currentTarget)
        startTransition(async () => {
          try {
            const template = await createDoctorTemplate({
              name: String(fd.get("name") || ""),
              type: "SOAP",
              subjective: String(fd.get("subjective") || "") || undefined,
              objective: String(fd.get("objective") || "") || undefined,
              assessment: String(fd.get("assessment") || "") || undefined,
              plan: String(fd.get("plan") || "") || undefined,
            })
            toast.success("Template created")
            onCreated(template)
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not create template")
          }
        })
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="tpl-name">Template name</Label>
        <Input id="tpl-name" name="name" required placeholder="e.g. Routine Follow-up" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="tpl-subjective">Subjective</Label>
        <Textarea id="tpl-subjective" name="subjective" rows={2} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="tpl-objective">Objective</Label>
        <Textarea id="tpl-objective" name="objective" rows={2} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="tpl-assessment">Assessment</Label>
        <Textarea id="tpl-assessment" name="assessment" rows={2} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="tpl-plan">Plan</Label>
        <Textarea id="tpl-plan" name="plan" rows={2} />
      </div>
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Create Template"}</Button>
    </form>
  )
}
