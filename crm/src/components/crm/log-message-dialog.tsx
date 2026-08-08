"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PatientPicker } from "@/components/appointments/patient-picker"
import { commChannelLabels } from "@/lib/labels"
import { logMessage } from "@/actions/crm"

export function LogMessageDialog() {
  const [open, setOpen] = useState(false)
  const [patientId, setPatientId] = useState("")
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-1.5"><Plus className="h-4 w-4" />Log Message</Button>} />
      <DialogContent>
        <DialogHeader><DialogTitle>Log Message</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            if (!patientId) {
              toast.error("Select a patient")
              return
            }
            startTransition(async () => {
              try {
                await logMessage(patientId, {
                  channel: String(fd.get("channel") || "SMS") as never,
                  subject: String(fd.get("subject") || "") || undefined,
                  body: String(fd.get("body") || ""),
                })
                toast.success("Message logged")
                setOpen(false)
                setPatientId("")
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not log message")
              }
            })
          }}
        >
          <div className="space-y-1.5">
            <Label>Patient</Label>
            <PatientPicker value={patientId} onChange={setPatientId} />
          </div>
          <div className="space-y-1.5">
            <Label>Channel</Label>
            <Select items={commChannelLabels} name="channel" defaultValue="SMS">
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["SMS", "EMAIL", "WHATSAPP", "CALL", "SYSTEM"] as const).map((c) => (
                  <SelectItem key={c} value={c}>{commChannelLabels[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lm-subject">Subject (optional)</Label>
            <Input id="lm-subject" name="subject" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lm-body">Message</Label>
            <Textarea id="lm-body" name="body" required rows={4} />
          </div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Sending…" : "Log Message"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
