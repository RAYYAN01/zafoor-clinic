import { getPackages } from "@/actions/packages"
import { PackagesList } from "@/components/finance/packages-list"
import { AddPackageDialog } from "@/components/finance/add-package-dialog"

export default async function PackagesPage() {
  const packages = await getPackages()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Packages</h1>
          <p className="text-sm text-muted-foreground">Bundled service packages for quick billing (health checkups, maternity, surgery packages).</p>
        </div>
        <AddPackageDialog />
      </div>
      <PackagesList packages={packages} />
    </div>
  )
}
