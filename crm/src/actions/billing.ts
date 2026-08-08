"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { generateBillNumber } from "@/lib/sequence"
import { toPlain } from "@/lib/serialize"
import { createBillSchema, type CreateBillInput, type BillItemInput } from "@/lib/validations/billing"

function computeBillTotals(items: BillItemInput[], discountAmount: number) {
  const lineItems = items.map((item) => {
    const amount = Math.round(item.quantity * item.unitPrice * 100) / 100
    const taxAmount = Math.round(amount * (item.taxRatePercent / 100) * 100) / 100
    return { ...item, amount, taxAmount }
  })
  const totalAmount = lineItems.reduce((sum, i) => sum + i.amount, 0)
  const totalTax = lineItems.reduce((sum, i) => sum + i.taxAmount, 0)
  const netAmount = Math.round((totalAmount + totalTax - discountAmount) * 100) / 100
  return { lineItems, totalAmount, taxAmount: totalTax, netAmount }
}

export async function createBill(input: CreateBillInput) {
  const data = createBillSchema.parse(input)
  const { lineItems, totalAmount, taxAmount, netAmount } = computeBillTotals(data.items, data.discountAmount)

  const bill = await prisma.$transaction(async (tx) => {
    const billNumber = await generateBillNumber(tx)
    return tx.bill.create({
      data: {
        billNumber,
        patientId: data.patientId,
        insuranceId: data.insuranceId || null,
        appointmentId: data.appointmentId || null,
        serviceId: data.serviceId || null,
        totalAmount,
        discountAmount: data.discountAmount,
        taxAmount,
        netAmount,
        amountPaid: 0,
        balanceDue: netAmount,
        items: { create: lineItems },
      },
    })
  })

  revalidatePath("/billing")
  revalidatePath(`/patients/${data.patientId}`)
  return toPlain(bill)
}

export async function cancelBill(id: string, patientId: string) {
  await requireRole("ADMIN", "BILLING")
  await prisma.bill.update({ where: { id }, data: { status: "CANCELLED", cancelledAt: new Date() } })
  revalidatePath("/billing")
  revalidatePath(`/patients/${patientId}`)
}

export async function getBill(id: string) {
  const bill = await prisma.bill.findUnique({
    where: { id },
    include: {
      patient: true,
      items: true,
      payments: { include: { receivedBy: true }, orderBy: { paidAt: "desc" } },
      refunds: { orderBy: { requestedAt: "desc" } },
      advanceAdjustments: { include: { advance: true } },
      insurance: true,
      service: true,
      appointment: true,
    },
  })
  if (!bill) return null
  return toPlain(bill)
}

export async function getBills(params: {
  patientId?: string
  status?: string
  page?: number
  pageSize?: number
}) {
  const { patientId, status, page = 1, pageSize = 20 } = params
  const where: Record<string, unknown> = {}
  if (patientId) where.patientId = patientId
  if (status) where.status = status

  const [bills, total] = await Promise.all([
    prisma.bill.findMany({
      where,
      include: { patient: true, service: true },
      orderBy: { issuedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.bill.count({ where }),
  ])

  return { bills: toPlain(bills), total, page, pageSize }
}

export async function getPatientBillingSummary(patientId: string) {
  const [bills, advances, refunds] = await Promise.all([
    prisma.bill.findMany({ where: { patientId }, include: { items: true, service: true }, orderBy: { issuedAt: "desc" } }),
    prisma.patientAdvance.findMany({ where: { patientId }, orderBy: { paidAt: "desc" } }),
    prisma.refund.findMany({ where: { patientId }, orderBy: { requestedAt: "desc" } }),
  ])
  return toPlain({ bills, advances, refunds })
}
