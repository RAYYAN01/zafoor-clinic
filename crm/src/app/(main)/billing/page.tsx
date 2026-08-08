import Link from "next/link"
import { Plus } from "lucide-react"
import { getBills } from "@/actions/billing"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BillFilters } from "@/components/billing/bill-filters"
import { BillTable } from "@/components/billing/bill-table"
import { Pagination } from "@/components/shared/pagination"

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string; payerType?: string; page?: string }>
}) {
  const sp = await searchParams
  const page = Number(sp.page) || 1
  const { bills, total, pageSize } = await getBills({
    type: sp.type,
    status: sp.status,
    payerType: sp.payerType,
    page,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
          <p className="text-sm text-muted-foreground">{total} bill{total === 1 ? "" : "s"}</p>
        </div>
        <Button
          className="gap-1.5"
          nativeButton={false}
          render={
            <Link href="/billing/new">
              <Plus className="h-4 w-4" />
              New Bill
            </Link>
          }
        />
      </div>

      <BillFilters />

      <Card>
        <CardContent className="p-0">
          <BillTable bills={bills} />
        </CardContent>
      </Card>

      <Pagination total={total} pageSize={pageSize} currentPage={page} />
    </div>
  )
}
