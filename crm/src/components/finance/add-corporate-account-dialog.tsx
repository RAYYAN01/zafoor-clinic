"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { createCorporateAccount } from "@/actions/corporate"

export function AddCorporateAccountDialog() {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add Company
      </Button>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Corporate Account</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              try {
                await createCorporateAccount({
                  companyName: String(fd.get("companyName") || ""),
                  contactName: String(fd.get("contactName") || "") || undefined,
                  contactPhone: String(fd.get("contactPhone") || "") || undefined,
                  contactEmail: String(fd.get("contactEmail") || "") || undefined,
                  gstin: String(fd.get("gstin") || "") || undefined,
                  creditLimit: fd.get("creditLimit") ? Number(fd.get("creditLimit")) : undefined,
                  address: String(fd.get("address") || "") || undefined,
                })
                toast.success("Corporate account created")
                setOpen(false)
                router.refresh()
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not create account")
              }
            })
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="companyName">Company name</Label>
            <Input id="companyName" name="companyName" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="contactName">Contact name</Label>
              <Input id="contactName" name="contactName" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactPhone">Contact phone</Label>
              <Input id="contactPhone" name="contactPhone" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contactEmail">Contact email</Label>
            <Input id="contactEmail" name="contactEmail" type="email" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="gstin">GSTIN</Label>
              <Input id="gstin" name="gstin" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="creditLimit">Credit limit</Label>
              <Input id="creditLimit" name="creditLimit" type="number" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" />
          </div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Create Account"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
