import Link from "next/link"
import { getMedicines } from "@/actions/pharmacy"
import { MedicinesBoard } from "@/components/operations/medicines-board"

export default async function PharmacyPage() {
  const medicines = await getMedicines()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pharmacy — Medicine Inventory</h1>
          <p className="text-sm text-muted-foreground">{medicines.length} medicine{medicines.length === 1 ? "" : "s"} tracked.</p>
        </div>
        <div className="flex gap-3 text-sm">
          <Link href="/operations/pharmacy/purchase-orders" className="text-primary hover:underline">Purchase Orders</Link>
          <Link href="/operations/vendors" className="text-primary hover:underline">Vendors</Link>
        </div>
      </div>
      <MedicinesBoard medicines={medicines} />
    </div>
  )
}
