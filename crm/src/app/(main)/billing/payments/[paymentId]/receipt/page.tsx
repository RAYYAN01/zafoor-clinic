import { notFound } from "next/navigation"
import { getReceipt } from "@/actions/payments"
import { ReceiptView } from "@/components/billing/receipt-view"

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ paymentId: string }>
}) {
  const { paymentId } = await params
  const payment = await getReceipt(paymentId)
  if (!payment) notFound()

  return <ReceiptView payment={payment} />
}
