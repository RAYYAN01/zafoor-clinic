"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { formatDate } from "@/lib/format"
import { jobOpeningStatusLabels, jobOpeningStatusColors, candidateStageLabels, candidateStageColors } from "@/lib/labels"
import { createJobOpening, updateJobOpeningStatus, addCandidate, updateCandidateStage, type getJobOpenings, type getCandidates } from "@/actions/recruitment"

type Openings = Awaited<ReturnType<typeof getJobOpenings>>
type Candidates = Awaited<ReturnType<typeof getCandidates>>
type Departments = { id: string; name: string }[]

export function RecruitmentBoard({ openings, candidates, departments }: { openings: Openings; candidates: Candidates; departments: Departments }) {
  const [openingOpen, setOpeningOpen] = useState(false)
  const [candidateOpen, setCandidateOpen] = useState(false)

  return (
    <Tabs defaultValue="openings">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="openings">Job Openings</TabsTrigger>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="openings" className="space-y-4 mt-4">
        <div className="flex justify-end">
          <Button className="gap-1.5" onClick={() => setOpeningOpen(true)}>
            <Plus className="h-4 w-4" />
            Post Job Opening
          </Button>
        </div>
        {openings.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No job openings yet.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {openings.map((o) => (
              <OpeningRow key={o.id} opening={o} />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="candidates" className="space-y-4 mt-4">
        <div className="flex justify-end">
          <Button className="gap-1.5" onClick={() => setCandidateOpen(true)} disabled={openings.length === 0}>
            <Plus className="h-4 w-4" />
            Add Candidate
          </Button>
        </div>
        {candidates.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No candidates yet.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {candidates.map((c) => (
              <CandidateRow key={c.id} candidate={c} />
            ))}
          </div>
        )}
      </TabsContent>

      <NewOpeningDialog open={openingOpen} onOpenChange={setOpeningOpen} departments={departments} />
      <AddCandidateDialog open={candidateOpen} onOpenChange={setCandidateOpen} openings={openings} />
    </Tabs>
  )
}

function OpeningRow({ opening }: { opening: Openings[number] }) {
  const [pending, startTransition] = useTransition()

  return (
    <Card>
      <CardContent className="flex items-center justify-between py-3.5">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{opening.title}</p>
            <Badge variant="secondary" className={jobOpeningStatusColors[opening.status]}>{jobOpeningStatusLabels[opening.status]}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {opening.department?.name ?? "—"} · {opening.positions} position{opening.positions === 1 ? "" : "s"} · {opening.candidates.length} candidate{opening.candidates.length === 1 ? "" : "s"} · Posted {formatDate(opening.postedAt)}
          </p>
        </div>
        <Select
          items={jobOpeningStatusLabels}
          value={opening.status}
          onValueChange={(v) => {
            if (!v) return
            startTransition(async () => {
              try {
                await updateJobOpeningStatus(opening.id, { status: v as never })
              } catch {
                toast.error("Could not update opening")
              }
            })
          }}
        >
          <SelectTrigger className="h-8 w-[120px] text-xs shrink-0" disabled={pending}><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(jobOpeningStatusLabels).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}

function CandidateRow({ candidate }: { candidate: Candidates[number] }) {
  const [pending, startTransition] = useTransition()

  return (
    <Card>
      <CardContent className="flex items-center justify-between py-3.5">
        <div>
          <p className="text-sm font-medium">{candidate.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {candidate.jobOpening.title} · {candidate.email}{candidate.phone ? ` · ${candidate.phone}` : ""} · Applied {formatDate(candidate.appliedAt)}
          </p>
        </div>
        <Select
          items={candidateStageLabels}
          value={candidate.stage}
          onValueChange={(v) => {
            if (!v) return
            startTransition(async () => {
              try {
                await updateCandidateStage(candidate.id, { stage: v as never })
              } catch {
                toast.error("Could not update candidate")
              }
            })
          }}
        >
          <SelectTrigger className="h-7 w-[130px] text-xs shrink-0" disabled={pending}>
            <SelectValue>
              <Badge variant="secondary" className={candidateStageColors[candidate.stage]}>{candidateStageLabels[candidate.stage]}</Badge>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(candidateStageLabels).map(([value, label]) => (<SelectItem key={value} value={value}>{label}</SelectItem>))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}

function NewOpeningDialog({ open, onOpenChange, departments }: { open: boolean; onOpenChange: (v: boolean) => void; departments: Departments }) {
  const [departmentId, setDepartmentId] = useState("")
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Post Job Opening</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              try {
                await createJobOpening({
                  title: String(fd.get("title") || ""),
                  departmentId: departmentId || undefined,
                  positions: Number(fd.get("positions") || 1),
                  description: String(fd.get("description") || "") || undefined,
                })
                toast.success("Job opening posted")
                onOpenChange(false)
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not post opening")
              }
            })
          }}
        >
          <div className="space-y-1.5"><Label htmlFor="title">Title</Label><Input id="title" name="title" required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select items={{ NONE: "None", ...Object.fromEntries(departments.map((d) => [d.id, d.name])) }} value={departmentId || "NONE"} onValueChange={(v) => setDepartmentId(v === "NONE" ? "" : v ?? "")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">None</SelectItem>
                  {departments.map((d) => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="positions">Positions</Label><Input id="positions" name="positions" type="number" defaultValue={1} /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" /></div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Posting…" : "Post Opening"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AddCandidateDialog({ open, onOpenChange, openings }: { open: boolean; onOpenChange: (v: boolean) => void; openings: Openings }) {
  const [jobOpeningId, setJobOpeningId] = useState(openings[0]?.id ?? "")
  const [pending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Candidate</DialogTitle></DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            if (!jobOpeningId) { toast.error("Select a job opening"); return }
            startTransition(async () => {
              try {
                await addCandidate({
                  jobOpeningId,
                  name: String(fd.get("name") || ""),
                  email: String(fd.get("email") || ""),
                  phone: String(fd.get("phone") || "") || undefined,
                  resumeUrl: String(fd.get("resumeUrl") || "") || undefined,
                  notes: String(fd.get("notes") || "") || undefined,
                })
                toast.success("Candidate added")
                onOpenChange(false)
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not add candidate")
              }
            })
          }}
        >
          <div className="space-y-1.5">
            <Label>Job opening</Label>
            <Select items={Object.fromEntries(openings.map((o) => [o.id, o.title]))} value={jobOpeningId} onValueChange={(v) => setJobOpeningId(v ?? "")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{openings.map((o) => (<SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="name">Name</Label><Input id="name" name="name" required /></div>
            <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" /></div>
            <div className="space-y-1.5"><Label htmlFor="resumeUrl">Resume URL</Label><Input id="resumeUrl" name="resumeUrl" /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="notes">Notes</Label><Textarea id="notes" name="notes" /></div>
          <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Add Candidate"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
