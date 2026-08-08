import { getJobOpenings, getCandidates } from "@/actions/recruitment"
import { getDepartments } from "@/actions/employees"
import { RecruitmentBoard } from "@/components/hr/recruitment-board"

export default async function RecruitmentPage() {
  const [openings, candidates, departments] = await Promise.all([getJobOpenings(), getCandidates(), getDepartments()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Recruitment</h1>
        <p className="text-sm text-muted-foreground">{openings.filter((o) => o.status === "OPEN").length} open role{openings.filter((o) => o.status === "OPEN").length === 1 ? "" : "s"} · {candidates.length} candidate{candidates.length === 1 ? "" : "s"}.</p>
      </div>
      <RecruitmentBoard openings={openings} candidates={candidates} departments={departments} />
    </div>
  )
}
