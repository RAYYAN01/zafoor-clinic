import { getIcuBoard } from "@/actions/icu"
import { IcuBoard } from "@/components/operations/icu-board"

export default async function IcuPage() {
  const admissions = await getIcuBoard()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">ICU</h1>
        <p className="text-sm text-muted-foreground">{admissions.length} patient{admissions.length === 1 ? "" : "s"} currently in ICU beds.</p>
      </div>
      <IcuBoard admissions={admissions} />
    </div>
  )
}
