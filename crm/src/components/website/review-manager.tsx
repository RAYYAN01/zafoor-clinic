"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DeleteButton } from "@/components/shared/delete-button"
import { createReview, deleteReview, togglePublishReview, type getReviews } from "@/actions/website"
import type { getServices } from "@/actions/services"

type Reviews = Awaited<ReturnType<typeof getReviews>>
type Services = Awaited<ReturnType<typeof getServices>>

export function ReviewManager({ reviews, services }: { reviews: Reviews; services: Services }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {reviews.length === 0 && (
          <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No reviews yet.</CardContent></Card>
        )}
        {reviews.map((r) => (
          <Card key={r.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                    ))}
                  </div>
                  <p className="text-sm font-medium mt-1">{r.patientName}{r.service ? ` — ${r.service.name}` : ""}</p>
                  <p className="text-sm text-muted-foreground mt-1">{r.comment}</p>
                </div>
                <Badge variant={r.published ? "default" : "secondary"} className="shrink-0">
                  {r.published ? "Published" : "Draft"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      try {
                        await togglePublishReview(r.id, !r.published)
                      } catch {
                        toast.error("Could not update")
                      }
                    })
                  }
                >
                  {r.published ? "Unpublish" : "Publish"}
                </Button>
                <DeleteButton onDelete={() => deleteReview(r.id)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {open ? (
        <Card>
          <CardContent className="pt-6">
            <ReviewForm
              services={services}
              onDone={() => {
                setOpen(false)
                router.refresh()
              }}
              onCancel={() => setOpen(false)}
            />
          </CardContent>
        </Card>
      ) : (
        <Button className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Review
        </Button>
      )}
    </div>
  )
}

function ReviewForm({ services, onDone, onCancel }: { services: Services; onDone: () => void; onCancel: () => void }) {
  const [pending, startTransition] = useTransition()
  const [rating, setRating] = useState("5")
  const [serviceId, setServiceId] = useState("")

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        startTransition(async () => {
          try {
            await createReview({
              patientName: String(fd.get("patientName") || ""),
              rating: Number(rating),
              comment: String(fd.get("comment") || ""),
              serviceId: serviceId || undefined,
              published: false,
            })
            toast.success("Review added as a draft")
            onDone()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not add review")
          }
        })
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="review-name">Patient name</Label>
        <Input id="review-name" name="patientName" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Rating</Label>
          <Select items={{ "5": "5", "4": "4", "3": "3", "2": "2", "1": "1" }} value={rating} onValueChange={(v) => setRating(v ?? "5")}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["5", "4", "3", "2", "1"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {services.length > 0 && (
          <div className="space-y-1.5">
            <Label>Service (optional)</Label>
            <Select items={{ NONE: "None", ...Object.fromEntries(services.map((s) => [s.id, s.name])) }} value={serviceId || "NONE"} onValueChange={(v) => setServiceId(v === "NONE" ? "" : v ?? "")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">None</SelectItem>
                {services.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="review-comment">Review</Label>
        <Textarea id="review-comment" name="comment" required rows={3} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Add Review"}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}
