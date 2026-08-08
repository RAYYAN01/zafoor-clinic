import { getServices } from "@/actions/services"
import { ServicesList } from "@/components/services/services-list"
import { AddServiceDialog } from "@/components/services/add-service-dialog"

export default async function ServicesPage() {
  const services = await getServices()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Services</h1>
          <p className="text-sm text-muted-foreground">
            The consultation types patients can book — on the website and in the CRM. Changes here update the public site immediately.
          </p>
        </div>
        <AddServiceDialog />
      </div>
      <ServicesList services={services} />
    </div>
  )
}
