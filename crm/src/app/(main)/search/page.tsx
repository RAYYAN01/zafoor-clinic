import { globalSearch } from "@/actions/search"
import { PatientTable } from "@/components/patients/patient-table"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const sp = await searchParams
  const q = sp.q ?? ""
  const { parsed, patients } = q ? await globalSearch(q) : { parsed: null, patients: [] }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Search Results</h1>
        <p className="text-sm text-muted-foreground">
          {q ? (
            <>
              {patients.length} result{patients.length === 1 ? "" : "s"} for <span className="font-medium">&ldquo;{q}&rdquo;</span>
            </>
          ) : (
            "Enter a search term above."
          )}
        </p>
        {parsed && (parsed.tag || parsed.blood || parsed.status) && (
          <div className="flex gap-2 mt-2">
            {parsed.tag && <Badge variant="outline">tag: {parsed.tag}</Badge>}
            {parsed.blood && <Badge variant="outline">blood: {parsed.blood}</Badge>}
            {parsed.status && <Badge variant="outline">status: {parsed.status}</Badge>}
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <PatientTable patients={patients} />
        </CardContent>
      </Card>
    </div>
  )
}
