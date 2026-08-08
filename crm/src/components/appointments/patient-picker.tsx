"use client"

import { useEffect, useRef, useState } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { getPatients } from "@/actions/patients"
import { patientDisplayName } from "@/lib/format"

type PatientOption = { id: string; name: string; uhid: string; phone: string }

export function PatientPicker({
  value,
  onChange,
  initial,
}: {
  value: string
  onChange: (patientId: string) => void
  initial?: PatientOption | null
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<PatientOption[]>([])
  const [selected, setSelected] = useState<PatientOption | null>(initial ?? null)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!query.trim()) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const { patients } = await getPatients({ query, pageSize: 8 })
      setResults(
        patients.map((p) => ({ id: p.id, name: patientDisplayName(p), uhid: p.uhid, phone: p.phone }))
      )
    }, 250)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  if (selected) {
    return (
      <div className="flex items-center justify-between rounded-md border px-3 py-2">
        <div>
          <p className="text-sm font-medium">{selected.name}</p>
          <p className="text-xs text-muted-foreground">{selected.uhid} · {selected.phone}</p>
        </div>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => {
            setSelected(null)
            onChange("")
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <input type="hidden" value={value} readOnly />
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search patient by name, UHID, or phone…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      </div>
      {open && query.trim() && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md max-h-64 overflow-y-auto">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-muted"
              onMouseDown={() => {
                setSelected(p)
                onChange(p.id)
                setOpen(false)
              }}
            >
              <span className="font-medium">{p.name}</span>
              <span className="text-xs text-muted-foreground">{p.uhid} · {p.phone}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
