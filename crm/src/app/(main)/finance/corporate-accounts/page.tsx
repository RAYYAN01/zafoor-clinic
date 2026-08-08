import { getCorporateAccounts } from "@/actions/corporate"
import { CorporateAccountsList } from "@/components/finance/corporate-accounts-list"
import { AddCorporateAccountDialog } from "@/components/finance/add-corporate-account-dialog"

export default async function CorporateAccountsPage() {
  const accounts = await getCorporateAccounts()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Corporate Accounts</h1>
          <p className="text-sm text-muted-foreground">{accounts.length} account{accounts.length === 1 ? "" : "s"}</p>
        </div>
        <AddCorporateAccountDialog />
      </div>
      <CorporateAccountsList accounts={accounts} />
    </div>
  )
}
