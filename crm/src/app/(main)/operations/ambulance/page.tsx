import { getAmbulances, getAmbulanceTrips } from "@/actions/ambulance"
import { AmbulanceBoard } from "@/components/operations/ambulance-board"

export default async function AmbulancePage() {
  const [ambulances, trips] = await Promise.all([getAmbulances(), getAmbulanceTrips()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ambulance</h1>
        <p className="text-sm text-muted-foreground">{ambulances.length} vehicle{ambulances.length === 1 ? "" : "s"} in fleet.</p>
      </div>
      <AmbulanceBoard ambulances={ambulances} trips={trips} />
    </div>
  )
}
