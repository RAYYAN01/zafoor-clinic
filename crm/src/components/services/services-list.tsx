"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DeleteButton } from "@/components/shared/delete-button"
import { formatCurrency } from "@/lib/format"
import { toggleServiceActive, deleteService, type getServices } from "@/actions/services"

type Services = Awaited<ReturnType<typeof getServices>>

export function ServicesList({ services }: { services: Services }) {
  if (services.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No services yet. Add the clinic&apos;s review types to start taking bookings.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((s) => (
        <ServiceCard key={s.id} service={s} />
      ))}
    </div>
  )
}

function ServiceCard({ service }: { service: Services[number] }) {
  const [pending, startTransition] = useTransition()

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{service.name}</p>
          <Badge variant={service.active ? "default" : "secondary"}>{service.active ? "Active" : "Inactive"}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">/services/{service.slug}</p>
        {service.price != null && (
          <p className="text-lg font-semibold mt-1">{formatCurrency(Number(service.price))}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">{service.durationMinutes} min consultation</p>
        {service.shortDescription && <p className="text-xs text-muted-foreground mt-2">{service.shortDescription}</p>}
        <div className="flex items-center gap-2 mt-3">
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await toggleServiceActive(service.id, !service.active)
                } catch {
                  toast.error("Could not update service")
                }
              })
            }
          >
            {service.active ? "Deactivate" : "Activate"}
          </Button>
          <DeleteButton onDelete={() => deleteService(service.id)} />
        </div>
      </CardContent>
    </Card>
  )
}
