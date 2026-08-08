import { getWaitingList } from "@/actions/appointments"
import { getDoctors } from "@/lib/auth"
import { Card, CardContent } from "@/components/ui/card"
import { AddWaitingListDialog } from "@/components/appointments/add-waiting-list-dialog"
import { WaitingListTable } from "@/components/appointments/waiting-list-table"

export default async function WaitingListPage() {
  const [entries, doctors] = await Promise.all([getWaitingList(), getDoctors()])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Waiting List</h1>
          <p className="text-sm text-muted-foreground">Patients waiting for the next available slot.</p>
        </div>
        <AddWaitingListDialog doctors={doctors} />
      </div>

      <Card>
        <CardContent className="p-0">
          <WaitingListTable entries={entries} />
        </CardContent>
      </Card>
    </div>
  )
}
