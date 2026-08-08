"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Plus, Pin } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DeleteButton } from "@/components/shared/delete-button"
import { formatRelative } from "@/lib/format"
import { announcementAudienceLabels } from "@/lib/labels"
import { createAnnouncement, deleteAnnouncement, type getAnnouncements } from "@/actions/announcements"

type Announcements = Awaited<ReturnType<typeof getAnnouncements>>
type Departments = { id: string; name: string }[]

export function AnnouncementsBoard({ announcements, departments }: { announcements: Announcements; departments: Departments }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Post Announcement
        </Button>
      </div>

      {announcements.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No announcements yet.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {announcements.map((a) => (
            <Card key={a.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {a.pinned && <Pin className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                      <p className="text-sm font-medium">{a.title}</p>
                      <Badge variant="outline">{announcementAudienceLabels[a.audience]}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{a.body}</p>
                    <p className="text-xs text-muted-foreground/80 mt-1">{a.postedBy.name} · {formatRelative(a.createdAt)}</p>
                  </div>
                  <DeleteButton onDelete={() => deleteAnnouncement(a.id)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <NewAnnouncementDialog open={open} onOpenChange={setOpen} departments={departments} />
    </div>
  )
}

function NewAnnouncementDialog({ open, onOpenChange, departments }: { open: boolean; onOpenChange: (v: boolean) => void; departments: Departments }) {
  const [audience, setAudience] = useState("ALL")
  const [departmentId, setDepartmentId] = useState("")
  const [pinned, setPinned] = useState(false)
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Post Announcement</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              try {
                await createAnnouncement({
                  title: String(fd.get("title") || ""),
                  body: String(fd.get("body") || ""),
                  audience: audience as never,
                  departmentId: audience === "DEPARTMENT" ? departmentId || undefined : undefined,
                  pinned,
                })
                toast.success("Announcement posted")
                onOpenChange(false)
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not post announcement")
              }
            })
          }}
        >
          <div className="space-y-1.5"><Label htmlFor="title">Title</Label><Input id="title" name="title" required /></div>
          <div className="space-y-1.5"><Label htmlFor="body">Message</Label><Textarea id="body" name="body" required /></div>
          <div className="space-y-1.5">
            <Label>Audience</Label>
            <Select items={announcementAudienceLabels} value={audience} onValueChange={(v) => setAudience(v ?? "ALL")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(announcementAudienceLabels).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          {audience === "DEPARTMENT" && (
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select items={Object.fromEntries(departments.map((d) => [d.id, d.name]))} value={departmentId} onValueChange={(v) => setDepartmentId(v ?? "")}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>{departments.map((d) => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={pinned} onCheckedChange={(v) => setPinned(v === true)} />
            Pin to top
          </label>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Posting…" : "Post Announcement"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
