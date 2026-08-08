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
import { addToWaitingList } from "@/actions/appointments"

type Doctor = { id: string; name: string; specialization: string | null }

export function AddWaitingListDialog({ doctors }: { doctors: Doctor[] }) {
  const [open, setOpen] = useState(false)
  const [patientId, setPatientId] = useState("")
  const [doctorId, setDoctorId] = useState<string>("NONE")
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-1.5"><Plus className="h-4 w-4" />Add to Waiting List</Button>} />
      <DialogContent>
        <DialogHeader><DialogTitle>Add to Waiting List</DialogTitle></DialogHeader>
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
                await addToWaitingList({
                  patientId,
                  doctorId: doctorId === "NONE" ? undefined : doctorId,
                  requestedDate: fd.get("requestedDate") ? new Date(String(fd.get("requestedDate"))) : undefined,
                  reason: String(fd.get("reason") || "") || undefined,
                  priority: Number(fd.get("priority") || 0),
                })
                toast.success("Added to waiting list")
                setOpen(false)
                setPatientId("")
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not add")
              }
            })
          }}
        >
          <div className="space-y-1.5">
            <Label>Patient</Label>
            <PatientPicker value={patientId} onChange={setPatientId} />
          </div>
          <div className="space-y-1.5">
            <Label>Preferred doctor</Label>
            <Select
              items={{ NONE: "Any doctor", ...Object.fromEntries(doctors.map((d) => [d.id, `Dr. ${d.name}`])) }}
              value={doctorId}
              onValueChange={(value) => setDoctorId(value ?? "NONE")}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Any doctor</SelectItem>
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>Dr. {d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="requestedDate">Requested date</Label>
            <Input id="requestedDate" name="requestedDate" type="date" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="priority">Priority (higher = more urgent)</Label>
            <Input id="priority" name="priority" type="number" defaultValue={0} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wl-reason">Reason</Label>
            <Textarea id="wl-reason" name="reason" />
          </div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Add"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
