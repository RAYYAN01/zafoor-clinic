"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DeleteButton } from "@/components/shared/delete-button"
import { formatCurrency } from "@/lib/format"
import { togglePackageActive, deletePackage, type getPackages } from "@/actions/packages"

type Packages = Awaited<ReturnType<typeof getPackages>>

export function PackagesList({ packages }: { packages: Packages }) {
  if (packages.length === 0) {
    return <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No packages yet.</CardContent></Card>
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {packages.map((p) => (
        <PackageCard key={p.id} pkg={p} />
      ))}
    </div>
  )
}

function PackageCard({ pkg }: { pkg: Packages[number] }) {
  const [pending, startTransition] = useTransition()

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{pkg.name}</p>
          <Badge variant={pkg.active ? "default" : "secondary"}>{pkg.active ? "Active" : "Inactive"}</Badge>
        </div>
        <p className="text-lg font-semibold mt-1">{formatCurrency(Number(pkg.price))}</p>
        {pkg.description && <p className="text-xs text-muted-foreground mt-1">{pkg.description}</p>}
        {pkg.includedItems.length > 0 && (
          <ul className="text-xs text-muted-foreground mt-2 list-disc list-inside space-y-0.5">
            {pkg.includedItems.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        )}
        <div className="flex items-center gap-2 mt-3">
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await togglePackageActive(pkg.id, !pkg.active)
                } catch {
                  toast.error("Could not update package")
                }
              })
            }
          >
            {pkg.active ? "Deactivate" : "Activate"}
          </Button>
          <DeleteButton onDelete={() => deletePackage(pkg.id)} />
        </div>
      </CardContent>
    </Card>
  )
}
