import { getVendors } from "@/actions/pharmacy"
import { VendorsList } from "@/components/operations/vendors-list"

export default async function VendorsPage() {
  const vendors = await getVendors()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Vendor Management</h1>
        <p className="text-sm text-muted-foreground">{vendors.length} vendor{vendors.length === 1 ? "" : "s"} on file.</p>
      </div>
      <VendorsList vendors={vendors} />
    </div>
  )
}
