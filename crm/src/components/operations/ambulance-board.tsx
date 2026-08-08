"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DeleteButton } from "@/components/shared/delete-button"
import { PatientPicker } from "@/components/appointments/patient-picker"
import { formatRelative, patientDisplayName } from "@/lib/format"
import { ambulanceStatusLabels, ambulanceStatusColors, tripPurposeLabels, tripStatusLabels, tripStatusColors } from "@/lib/labels"
import {
  createAmbulance,
  deleteAmbulance,
  requestAmbulanceTrip,
  updateTripStatus,
  type getAmbulances,
  type getAmbulanceTrips,
} from "@/actions/ambulance"

type Ambulances = Awaited<ReturnType<typeof getAmbulances>>
type Trips = Awaited<ReturnType<typeof getAmbulanceTrips>>

export function AmbulanceBoard({ ambulances, trips }: { ambulances: Ambulances; trips: Trips }) {
  const [addOpen, setAddOpen] = useState(false)
  const [tripOpen, setTripOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <Button variant="outline" className="gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Vehicle
        </Button>
        <Button className="gap-1.5" onClick={() => setTripOpen(true)} disabled={ambulances.length === 0}>
          <Plus className="h-4 w-4" />
          Request Trip
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {ambulances.map((a) => (
          <Card key={a.id}>
            <CardContent className="py-4 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{a.vehicleNumber}</p>
                <Badge variant="secondary" className={ambulanceStatusColors[a.status]}>{ambulanceStatusLabels[a.status]}</Badge>
              </div>
              {a.driverName && <p className="text-xs text-muted-foreground">{a.driverName}{a.driverPhone ? ` · ${a.driverPhone}` : ""}</p>}
              <div className="pt-1"><DeleteButton onDelete={() => deleteAmbulance(a.id)} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent Trips</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {trips.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No trips yet.</p>}
          {trips.map((t) => (
            <TripRow key={t.id} trip={t} />
          ))}
        </CardContent>
      </Card>

      <AddAmbulanceDialog open={addOpen} onOpenChange={setAddOpen} />
      <RequestTripDialog open={tripOpen} onOpenChange={setTripOpen} ambulances={ambulances} />
    </div>
  )
}

function TripRow({ trip }: { trip: Trips[number] }) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{trip.ambulance.vehicleNumber}</p>
          <Badge variant="secondary" className={tripStatusColors[trip.status]}>{tripStatusLabels[trip.status]}</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {tripPurposeLabels[trip.purpose]}
          {trip.patient ? ` · ${patientDisplayName(trip.patient)}` : ""}
          {trip.pickupLocation ? ` · From ${trip.pickupLocation}` : ""}
          {trip.dropLocation ? ` → ${trip.dropLocation}` : ""}
        </p>
        <p className="text-xs text-muted-foreground/80">Requested {formatRelative(trip.requestedAt)}</p>
      </div>
      {trip.status === "REQUESTED" || trip.status === "DISPATCHED" ? (
        <Select
          items={tripStatusLabels}
          value={trip.status}
          onValueChange={(v) => {
            if (!v) return
            startTransition(async () => {
              try {
                await updateTripStatus(trip.id, { status: v as never })
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not update trip")
              }
            })
          }}
        >
          <SelectTrigger className="h-8 w-[130px] text-xs shrink-0" disabled={pending}><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(tripStatusLabels).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  )
}

function AddAmbulanceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Ambulance</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              try {
                await createAmbulance({
                  vehicleNumber: String(fd.get("vehicleNumber") || ""),
                  driverName: String(fd.get("driverName") || "") || undefined,
                  driverPhone: String(fd.get("driverPhone") || "") || undefined,
                })
                toast.success("Ambulance added")
                onOpenChange(false)
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not add ambulance")
              }
            })
          }}
        >
          <div className="space-y-1.5"><Label htmlFor="vehicleNumber">Vehicle number</Label><Input id="vehicleNumber" name="vehicleNumber" required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="driverName">Driver name</Label><Input id="driverName" name="driverName" /></div>
            <div className="space-y-1.5"><Label htmlFor="driverPhone">Driver phone</Label><Input id="driverPhone" name="driverPhone" /></div>
          </div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Add Ambulance"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RequestTripDialog({ open, onOpenChange, ambulances }: { open: boolean; onOpenChange: (v: boolean) => void; ambulances: Ambulances }) {
  const availableAmbulances = ambulances.filter((a) => a.status === "AVAILABLE")
  const [ambulanceId, setAmbulanceId] = useState(availableAmbulances[0]?.id ?? "")
  const [purpose, setPurpose] = useState("PICKUP")
  const [patientId, setPatientId] = useState("")
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Request Ambulance Trip</DialogTitle></DialogHeader>
        {availableAmbulances.length === 0 ? (
          <p className="text-sm text-muted-foreground">No ambulances currently available.</p>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              if (!ambulanceId) { toast.error("Select an ambulance"); return }
              startTransition(async () => {
                try {
                  await requestAmbulanceTrip({
                    ambulanceId,
                    patientId: patientId || undefined,
                    purpose: purpose as never,
                    pickupLocation: String(fd.get("pickupLocation") || "") || undefined,
                    dropLocation: String(fd.get("dropLocation") || "") || undefined,
                    notes: String(fd.get("notes") || "") || undefined,
                  })
                  toast.success("Trip requested")
                  onOpenChange(false)
                  setPatientId("")
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not request trip")
                }
              })
            }}
          >
            <div className="space-y-1.5">
              <Label>Ambulance</Label>
              <Select items={Object.fromEntries(availableAmbulances.map((a) => [a.id, a.vehicleNumber]))} value={ambulanceId} onValueChange={(v) => setAmbulanceId(v ?? "")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{availableAmbulances.map((a) => (<SelectItem key={a.id} value={a.id}>{a.vehicleNumber}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Purpose</Label>
              <Select items={tripPurposeLabels} value={purpose} onValueChange={(v) => setPurpose(v ?? "PICKUP")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(tripPurposeLabels).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Patient (optional)</Label>
              <PatientPicker value={patientId} onChange={setPatientId} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label htmlFor="pickupLocation">Pickup location</Label><Input id="pickupLocation" name="pickupLocation" /></div>
              <div className="space-y-1.5"><Label htmlFor="dropLocation">Drop location</Label><Input id="dropLocation" name="dropLocation" /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="notes">Notes</Label><Textarea id="notes" name="notes" /></div>
            <Button type="submit" disabled={pending} className="w-full">{pending ? "Requesting…" : "Request Trip"}</Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
