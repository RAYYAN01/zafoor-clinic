"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { createPackage } from "@/actions/packages"

export function AddPackageDialog() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<string[]>([])
  const [draft, setDraft] = useState("")
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function addItem() {
    if (!draft.trim()) return
    setItems((prev) => [...prev, draft.trim()])
    setDraft("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add Package
      </Button>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Package</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              try {
                await createPackage({
                  name: String(fd.get("name") || ""),
                  description: String(fd.get("description") || "") || undefined,
                  price: Number(fd.get("price") || 0),
                  includedItems: items,
                })
                toast.success("Package created")
                setOpen(false)
                setItems([])
                router.refresh()
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not create package")
              }
            })
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="pkg-name">Name</Label>
            <Input id="pkg-name" name="name" required placeholder="e.g. Full Body Health Checkup" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pkg-description">Description</Label>
            <Textarea id="pkg-description" name="description" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pkg-price">Price</Label>
            <Input id="pkg-price" name="price" type="number" required />
          </div>
          <div className="space-y-1.5">
            <Label>Included items</Label>
            <div className="flex flex-wrap gap-1.5">
              {items.map((item, i) => (
                <Badge key={i} variant="secondary" className="gap-1 pr-1">
                  {item}
                  <button type="button" onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addItem()
                  }
                }}
                placeholder="e.g. CBC, Lipid Profile…"
              />
              <Button type="button" size="icon" variant="outline" onClick={addItem}><Plus className="h-4 w-4" /></Button>
            </div>
          </div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Create Package"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
