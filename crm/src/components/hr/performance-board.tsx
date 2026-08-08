"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Plus, Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDate } from "@/lib/format"
import { reviewStatusLabels, reviewStatusColors } from "@/lib/labels"
import { createPerformanceReview, updateReviewStatus, type getPerformanceReviews } from "@/actions/performance"

type Reviews = Awaited<ReturnType<typeof getPerformanceReviews>>
type Employees = { id: string; name: string; employeeCode: string }[]

export function PerformanceBoard({ reviews, employees }: { reviews: Reviews; employees: Employees }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          New Review
        </Button>
      </div>

      {reviews.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No reviews recorded yet.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {reviews.map((r) => (
            <ReviewRow key={r.id} review={r} />
          ))}
        </div>
      )}

      <NewReviewDialog open={open} onOpenChange={setOpen} employees={employees} />
    </div>
  )
}

function ReviewRow({ review }: { review: Reviews[number] }) {
  const [pending, startTransition] = useTransition()

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{review.employee.user.name}</p>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{review.periodLabel} · Reviewed by {review.reviewer.name} · {formatDate(review.reviewDate)}</p>
          {review.strengths && <p className="text-xs text-muted-foreground mt-1"><span className="font-medium">Strengths:</span> {review.strengths}</p>}
          {review.improvements && <p className="text-xs text-muted-foreground"><span className="font-medium">To improve:</span> {review.improvements}</p>}
        </div>
        <Select
          items={reviewStatusLabels}
          value={review.status}
          onValueChange={(v) => {
            if (!v) return
            startTransition(async () => {
              try {
                await updateReviewStatus(review.id, { status: v as never })
              } catch {
                toast.error("Could not update review")
              }
            })
          }}
        >
          <SelectTrigger className="h-7 w-[130px] text-xs shrink-0" disabled={pending}>
            <SelectValue>
              <Badge variant="secondary" className={reviewStatusColors[review.status]}>{reviewStatusLabels[review.status]}</Badge>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(reviewStatusLabels).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}

function NewReviewDialog({ open, onOpenChange, employees }: { open: boolean; onOpenChange: (v: boolean) => void; employees: Employees }) {
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "")
  const [rating, setRating] = useState(4)
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Performance Review</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            if (!employeeId) { toast.error("Select an employee"); return }
            startTransition(async () => {
              try {
                await createPerformanceReview({
                  employeeId,
                  periodLabel: String(fd.get("periodLabel") || ""),
                  rating,
                  strengths: String(fd.get("strengths") || "") || undefined,
                  improvements: String(fd.get("improvements") || "") || undefined,
                  goals: String(fd.get("goals") || "") || undefined,
                })
                toast.success("Review created")
                onOpenChange(false)
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not create review")
              }
            })
          }}
        >
          <div className="space-y-1.5">
            <Label>Employee</Label>
            <Select items={Object.fromEntries(employees.map((e) => [e.id, e.name]))} value={employeeId} onValueChange={(v) => setEmployeeId(v ?? "")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{employees.map((e) => (<SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label htmlFor="periodLabel">Review period</Label><Input id="periodLabel" name="periodLabel" placeholder="e.g. Q1 2026" required /></div>
          <div className="space-y-1.5">
            <Label>Rating</Label>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button key={i} type="button" onClick={() => setRating(i + 1)}>
                  <Star className={`h-6 w-6 ${i < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="strengths">Strengths</Label><Textarea id="strengths" name="strengths" /></div>
          <div className="space-y-1.5"><Label htmlFor="improvements">Areas to improve</Label><Textarea id="improvements" name="improvements" /></div>
          <div className="space-y-1.5"><Label htmlFor="goals">Goals</Label><Textarea id="goals" name="goals" /></div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Create Review"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
