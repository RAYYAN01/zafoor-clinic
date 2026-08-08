"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createService } from "@/actions/services"

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function AddServiceDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button className="gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add Service
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Service</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              try {
                await createService({
                  slug: String(fd.get("slug") || slugify(name)),
                  name: String(fd.get("name") || ""),
                  shortDescription: String(fd.get("shortDescription") || "") || undefined,
                  description: String(fd.get("description") || "") || undefined,
                  price: fd.get("price") ? Number(fd.get("price")) : undefined,
                  durationMinutes: Number(fd.get("durationMinutes") || 30),
                  displayOrder: 0,
                })
                toast.success("Service created")
                setOpen(false)
                setName("")
                router.refresh()
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not create service")
              }
            })
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="svc-name">Name</Label>
            <Input
              id="svc-name"
              name="name"
              required
              placeholder="e.g. Hairfall Review"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="svc-slug">URL slug</Label>
            <Input id="svc-slug" name="slug" placeholder={slugify(name) || "hairfall-review"} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="svc-short">Short description</Label>
            <Input id="svc-short" name="shortDescription" placeholder="One line shown on the services grid" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="svc-description">Full description</Label>
            <Textarea id="svc-description" name="description" placeholder="Shown on the service detail page" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="svc-price">Price (₹, optional)</Label>
              <Input id="svc-price" name="price" type="number" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="svc-duration">Duration (min)</Label>
              <Input id="svc-duration" name="durationMinutes" type="number" defaultValue={30} required />
            </div>
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Saving…" : "Create Service"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
