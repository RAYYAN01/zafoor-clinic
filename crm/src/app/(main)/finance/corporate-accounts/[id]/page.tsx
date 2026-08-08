import { notFound } from "next/navigation"
import { getCorporateAccount } from "@/actions/corporate"
import { CorporateAccountDetail } from "@/components/finance/corporate-account-detail"

export default async function CorporateAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const account = await getCorporateAccount(id)
  if (!account) notFound()

  return <CorporateAccountDetail account={account} />
}
