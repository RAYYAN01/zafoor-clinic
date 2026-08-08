"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DeleteButton } from "@/components/shared/delete-button"
import { wardTypeLabels, bedTypeLabels, bedStatusLabels, bedStatusColors } from "@/lib/labels"
import { patientDisplayName } from "@/lib/format"
import { createWard, createBed, updateBedStatus, deleteBed, deleteWard, type getWards, type getBeds } from "@/actions/beds"

type Wards = Awaited<ReturnType<typeof getWards>>
type Beds = Awaited<ReturnType<typeof getBeds>>

export function BedsBoard({ wards, beds }: { wards: Wards; beds: Beds }) {
  const [addWardOpen, setAddWardOpen] = useState(false)
  const [addBedOpen, setAddBedOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" className="gap-1.5" onClick={() => setAddWardOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Ward
        </Button>
        <Button className="gap-1.5" onClick={() => setAddBedOpen(true)} disabled={wards.length === 0}>
          <Plus className="h-4 w-4" />
          Add Bed
        </Button>
      </div>

      {wards.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No wards yet. Add one to get started.</CardContent></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {wards.map((ward) => {
            const wardBeds = beds.filter((b) => b.wardId === ward.id)
            return (
              <Card key={ward.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{ward.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {wardTypeLabels[ward.type]}{ward.floor ? ` · Floor ${ward.floor}` : ""} · {wardBeds.length} bed{wardBeds.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <DeleteButton onDelete={() => deleteWard(ward.id)} description="This removes the ward and its beds." />
                </CardHeader>
                <CardContent className="space-y-2">
                  {wardBeds.length === 0 && <p className="text-sm text-muted-foreground">No beds in this ward.</p>}
                  {wardBeds.map((bed) => (
                    <BedRow key={bed.id} bed={bed} />
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <AddWardDialog open={addWardOpen} onOpenChange={setAddWardOpen} />
      <AddBedDialog open={addBedOpen} onOpenChange={setAddBedOpen} wards={wards} />
    </div>
  )
}

function BedRow({ bed }: { bed: Beds[number] }) {
  const [pending, startTransition] = useTransition()
  const occupant = bed.admissions?.[0]

  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">Bed {bed.bedNumber}</p>
          <span className="text-xs text-muted-foreground">{bedTypeLabels[bed.type]}</span>
        </div>
        {occupant ? (
          <Link href={`/patients/${occupant.patientId}`} className="text-xs text-primary hover:underline">
            {patientDisplayName(occupant.patient)}
          </Link>
        ) : (
          <p className="text-xs text-muted-foreground">{bed.dailyRate ? `₹${Number(bed.dailyRate)}/day` : "—"}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Select
          items={bedStatusLabels}
          value={bed.status}
          onValueChange={(v) => {
            if (!v) return
            startTransition(async () => {
              try {
                await updateBedStatus(bed.id, { status: v as never })
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not update bed")
              }
            })
          }}
        >
          <SelectTrigger className="h-7 w-[130px] text-xs" disabled={pending}>
            <SelectValue>
              <Badge variant="secondary" className={bedStatusColors[bed.status]}>{bedStatusLabels[bed.status]}</Badge>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(bedStatusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DeleteButton onDelete={() => deleteBed(bed.id)} />
      </div>
    </div>
  )
}

function AddWardDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [type, setType] = useState("GENERAL")
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Ward</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              try {
                await createWard({
                  name: String(fd.get("name") || ""),
                  type: type as never,
                  floor: String(fd.get("floor") || "") || undefined,
                })
                toast.success("Ward added")
                onOpenChange(false)
                router.refresh()
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not add ward")
              }
            })
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="ward-name">Ward name</Label>
            <Input id="ward-name" name="name" required />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select items={wardTypeLabels} value={type} onValueChange={(v) => setType(v ?? "GENERAL")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(wardTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ward-floor">Floor</Label>
            <Input id="ward-floor" name="floor" placeholder="e.g. 2nd Floor" />
          </div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Add Ward"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AddBedDialog({ open, onOpenChange, wards }: { open: boolean; onOpenChange: (v: boolean) => void; wards: Wards }) {
  const [wardId, setWardId] = useState(wards[0]?.id ?? "")
  const [type, setType] = useState("GENERAL")
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Bed</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            if (!wardId) { toast.error("Select a ward"); return }
            startTransition(async () => {
              try {
                await createBed({
                  wardId,
                  bedNumber: String(fd.get("bedNumber") || ""),
                  type: type as never,
                  dailyRate: fd.get("dailyRate") ? Number(fd.get("dailyRate")) : undefined,
                  notes: String(fd.get("notes") || "") || undefined,
                })
                toast.success("Bed added")
                onOpenChange(false)
                router.refresh()
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not add bed")
              }
            })
          }}
        >
          <div className="space-y-1.5">
            <Label>Ward</Label>
            <Select items={Object.fromEntries(wards.map((w) => [w.id, w.name]))} value={wardId} onValueChange={(v) => setWardId(v ?? "")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {wards.map((w) => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bedNumber">Bed number</Label>
            <Input id="bedNumber" name="bedNumber" required />
          </div>
          <div className="space-y-1.5">
            <Label>Bed type</Label>
            <Select items={bedTypeLabels} value={type} onValueChange={(v) => setType(v ?? "GENERAL")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(bedTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dailyRate">Daily rate</Label>
            <Input id="dailyRate" name="dailyRate" type="number" />
          </div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Add Bed"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
