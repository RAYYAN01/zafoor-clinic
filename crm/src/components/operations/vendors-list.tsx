"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DeleteButton } from "@/components/shared/delete-button"
import { createVendor, deleteVendor, type getVendors } from "@/actions/pharmacy"

type Vendors = Awaited<ReturnType<typeof getVendors>>

export function VendorsList({ vendors }: { vendors: Vendors }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Vendor
        </Button>
      </div>

      {vendors.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No vendors yet.</CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((v) => (
            <Card key={v.id}>
              <CardContent className="py-4 space-y-1">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium">{v.name}</p>
                  <DeleteButton onDelete={() => deleteVendor(v.id)} />
                </div>
                {v.contactName && <p className="text-xs text-muted-foreground">{v.contactName}</p>}
                {v.phone && <p className="text-xs text-muted-foreground">{v.phone}</p>}
                {v.email && <p className="text-xs text-muted-foreground">{v.email}</p>}
                {v.gstin && <p className="text-xs text-muted-foreground">GSTIN {v.gstin}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddVendorDialog open={open} onOpenChange={setOpen} />
    </div>
  )
}

function AddVendorDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Vendor</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              try {
                await createVendor({
                  name: String(fd.get("name") || ""),
                  contactName: String(fd.get("contactName") || "") || undefined,
                  phone: String(fd.get("phone") || "") || undefined,
                  email: String(fd.get("email") || "") || undefined,
                  address: String(fd.get("address") || "") || undefined,
                  gstin: String(fd.get("gstin") || "") || undefined,
                })
                toast.success("Vendor added")
                onOpenChange(false)
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not add vendor")
              }
            })
          }}
        >
          <div className="space-y-1.5"><Label htmlFor="name">Vendor name</Label><Input id="name" name="name" required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="contactName">Contact name</Label><Input id="contactName" name="contactName" /></div>
            <div className="space-y-1.5"><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="gstin">GSTIN</Label><Input id="gstin" name="gstin" /></div>
            <div className="space-y-1.5"><Label htmlFor="address">Address</Label><Input id="address" name="address" /></div>
          </div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Add Vendor"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
