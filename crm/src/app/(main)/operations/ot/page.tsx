import { getTheatres, getSurgeries } from "@/actions/ot"
import { getDoctors } from "@/lib/auth"
import { OtBoard } from "@/components/operations/ot-board"

export default async function OtPage() {
  const [theatres, surgeries, doctors] = await Promise.all([getTheatres(), getSurgeries(), getDoctors()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Operation Theatre</h1>
        <p className="text-sm text-muted-foreground">{theatres.length} theatre{theatres.length === 1 ? "" : "s"} · {surgeries.length} scheduled procedure{surgeries.length === 1 ? "" : "s"}.</p>
      </div>
      <OtBoard theatres={theatres} surgeries={surgeries} doctors={doctors} />
    </div>
  )
}
