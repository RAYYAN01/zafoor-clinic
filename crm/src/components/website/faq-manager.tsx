"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DeleteButton } from "@/components/shared/delete-button"
import { createFaq, deleteFaq, toggleFaqActive, type getFaqs } from "@/actions/website"

type Faqs = Awaited<ReturnType<typeof getFaqs>>

export function FaqManager({ faqs }: { faqs: Faqs }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {faqs.length === 0 && (
          <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No FAQs yet.</CardContent></Card>
        )}
        {faqs.map((faq) => (
          <Card key={faq.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{faq.question}</p>
                  <p className="text-sm text-muted-foreground mt-1">{faq.answer}</p>
                </div>
                <Badge variant={faq.active ? "default" : "secondary"} className="shrink-0">
                  {faq.active ? "Live" : "Hidden"}
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
                        await toggleFaqActive(faq.id, !faq.active)
                      } catch {
                        toast.error("Could not update")
                      }
                    })
                  }
                >
                  {faq.active ? "Hide" : "Publish"}
                </Button>
                <DeleteButton onDelete={() => deleteFaq(faq.id)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {open ? (
        <Card>
          <CardContent className="pt-6">
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                startTransition(async () => {
                  try {
                    await createFaq({
                      question: String(fd.get("question") || ""),
                      answer: String(fd.get("answer") || ""),
                      displayOrder: faqs.length,
                    })
                    setOpen(false)
                    router.refresh()
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Could not add FAQ")
                  }
                })
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="faq-question">Question</Label>
                <Input id="faq-question" name="question" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="faq-answer">Answer</Label>
                <Textarea id="faq-answer" name="answer" required rows={3} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Add FAQ"}</Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Add FAQ
        </Button>
      )}
    </div>
  )
}
