import { notFound } from "next/navigation"
import { getBill } from "@/actions/billing"
import { InvoiceView } from "@/components/billing/invoice-view"

export default async function BillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const bill = await getBill(id)
  if (!bill) notFound()

  return <InvoiceView bill={bill} />
}
