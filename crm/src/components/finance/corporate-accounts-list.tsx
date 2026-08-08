import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/format"
import type { getCorporateAccounts } from "@/actions/corporate"

type Accounts = Awaited<ReturnType<typeof getCorporateAccounts>>

export function CorporateAccountsList({ accounts }: { accounts: Accounts }) {
  if (accounts.length === 0) {
    return <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No corporate accounts yet.</CardContent></Card>
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {accounts.map((a) => (
        <Link key={a.id} href={`/finance/corporate-accounts/${a.id}`}>
          <Card className="hover:bg-muted/50 transition-colors h-full">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{a.companyName}</p>
                <Badge variant={a.active ? "default" : "secondary"}>{a.active ? "Active" : "Inactive"}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{a.contactName}{a.contactPhone ? ` · ${a.contactPhone}` : ""}</p>
              <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                <span>{a._count.patients} patient{a._count.patients === 1 ? "" : "s"}</span>
                <span>{a._count.bills} bill{a._count.bills === 1 ? "" : "s"}</span>
              </div>
              {a.creditLimit != null && (
                <p className="text-xs text-muted-foreground mt-1">Credit limit: {formatCurrency(Number(a.creditLimit))}</p>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
