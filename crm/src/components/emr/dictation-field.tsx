"use client"

import { Mic, MicOff } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useVoiceDictation } from "@/hooks/use-voice-dictation"

export function DictationField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  disabled = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  disabled?: boolean
}) {
  const { listening, toggle, supported } = useVoiceDictation((text) => {
    onChange(value ? `${value} ${text}` : text)
  })

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {supported && (
          <Button
            type="button"
            size="icon-sm"
            variant={listening ? "default" : "ghost"}
            className={cn(listening && "animate-pulse")}
            disabled={disabled}
            onClick={toggle}
            title={listening ? "Stop dictation" : "Start voice dictation"}
          >
            {listening ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
          </Button>
        )}
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
      />
    </div>
  )
}
