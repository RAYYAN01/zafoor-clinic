"use client"

import { useState, useTransition } from "react"
import { X, Plus } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { updateChiefComplaints } from "@/actions/encounters"

export function ChiefComplaintsEditor({
  encounterId,
  initial,
  readOnly,
}: {
  encounterId: string
  initial: string[]
  readOnly: boolean
}) {
  const [complaints, setComplaints] = useState(initial)
  const [draft, setDraft] = useState("")
  const [pending, startTransition] = useTransition()

  function persist(next: string[]) {
    startTransition(async () => {
      try {
        await updateChiefComplaints(encounterId, next)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not update chief complaints")
      }
    })
  }

  function addComplaint() {
    const value = draft.trim()
    if (!value) return
    const next = [...complaints, value]
    setComplaints(next)
    setDraft("")
    persist(next)
  }

  function removeComplaint(index: number) {
    const next = complaints.filter((_, i) => i !== index)
    setComplaints(next)
    persist(next)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {complaints.map((c, i) => (
          <Badge key={`${c}-${i}`} variant="secondary" className="gap-1 pr-1">
            {c}
            {!readOnly && (
              <button type="button" onClick={() => removeComplaint(i)} className="rounded-full hover:bg-muted-foreground/20">
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
        {complaints.length === 0 && <p className="text-sm text-muted-foreground">No chief complaints recorded.</p>}
      </div>
      {!readOnly && (
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addComplaint()
              }
            }}
            placeholder="e.g. Fever for 3 days"
            disabled={pending}
          />
          <Button type="button" size="icon" variant="outline" onClick={addComplaint} disabled={pending}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
