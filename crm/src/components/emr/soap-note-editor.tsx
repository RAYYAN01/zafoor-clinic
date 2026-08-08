"use client"

import { useEffect, useRef, useState } from "react"
import { History, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DictationField } from "@/components/emr/dictation-field"
import { autosaveClinicalNote } from "@/actions/encounters"
import { formatDateTime } from "@/lib/format"

type Soap = { subjective: string; objective: string; assessment: string; plan: string }
type Template = { id: string; name: string; subjective: string | null; objective: string | null; assessment: string | null; plan: string | null }
type NoteVersion = { id: string; versionNumber: number; subjective: string | null; objective: string | null; assessment: string | null; plan: string | null; savedAt: Date }

export function SoapNoteEditor({
  encounterId,
  initial,
  templates,
  versions,
  readOnly,
}: {
  encounterId: string
  initial: Soap
  templates: Template[]
  versions: NoteVersion[]
  readOnly: boolean
}) {
  const [soap, setSoap] = useState(initial)
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle")
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (readOnly) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reflects that a debounced autosave is now pending
    setSaveState("saving")
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await autosaveClinicalNote(encounterId, soap)
        setLastSavedAt(new Date(result.savedAt))
        setSaveState("saved")
      } catch {
        setSaveState("idle")
        toast.error("Autosave failed")
      }
    }, 2000)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [soap, readOnly, encounterId])

  function set(key: keyof Soap, value: string) {
    setSoap((prev) => ({ ...prev, [key]: value }))
  }

  function applyTemplate(t: Template) {
    setSoap((prev) => ({
      subjective: prev.subjective || t.subjective || "",
      objective: prev.objective || t.objective || "",
      assessment: prev.assessment || t.assessment || "",
      plan: prev.plan || t.plan || "",
    }))
    toast.success(`Template "${t.name}" applied`)
  }

  function restoreVersion(v: NoteVersion) {
    setSoap({
      subjective: v.subjective ?? "",
      objective: v.objective ?? "",
      assessment: v.assessment ?? "",
      plan: v.plan ?? "",
    })
    setHistoryOpen(false)
    toast.success(`Restored version ${v.versionNumber}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">SOAP Note</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {saveState === "saving" && "Saving…"}
            {saveState === "saved" && lastSavedAt && `Saved ${formatDateTime(lastSavedAt)}`}
          </span>
          {!readOnly && templates.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button type="button" size="sm" variant="outline" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" />Template</Button>} />
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Insert template</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {templates.map((t) => (
                  <DropdownMenuItem key={t.id} onClick={() => applyTemplate(t)}>{t.name}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {versions.length > 0 && (
            <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => setHistoryOpen(true)}>
              <History className="h-3.5 w-3.5" />
              History ({versions.length})
            </Button>
          )}
        </div>
      </div>

      <DictationField label="Subjective" value={soap.subjective} onChange={(v) => set("subjective", v)} disabled={readOnly} placeholder="Patient-reported symptoms, history of present illness…" />
      <DictationField label="Objective" value={soap.objective} onChange={(v) => set("objective", v)} disabled={readOnly} placeholder="Examination findings, vitals interpretation…" />
      <DictationField label="Assessment" value={soap.assessment} onChange={(v) => set("assessment", v)} disabled={readOnly} placeholder="Clinical impression…" />
      <DictationField label="Plan" value={soap.plan} onChange={(v) => set("plan", v)} disabled={readOnly} placeholder="Treatment plan, follow-up…" />

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {versions.map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Version {v.versionNumber}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(v.savedAt)}</p>
                </div>
                {!readOnly && (
                  <Button type="button" size="sm" variant="outline" onClick={() => restoreVersion(v)}>
                    Restore
                  </Button>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
