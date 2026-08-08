import type { Prisma, PrismaClient } from "@/generated/prisma/client"

type Tx = PrismaClient | Prisma.TransactionClient

async function nextValue(tx: Tx, key: string) {
  const counter = await tx.counter.upsert({
    where: { key },
    create: { key, value: 1 },
    update: { value: { increment: 1 } },
  })
  return counter.value
}

/** ZC-2026-000123 — sequential per calendar year, atomic via Counter table. */
export async function generateUHID(tx: Tx) {
  const year = new Date().getFullYear()
  const value = await nextValue(tx, `UHID-${year}`)
  return `ZC-${year}-${String(value).padStart(6, "0")}`
}

/** INV-2026-000045 */
export async function generateBillNumber(tx: Tx) {
  const year = new Date().getFullYear()
  const value = await nextValue(tx, `BILL-${year}`)
  return `INV-${year}-${String(value).padStart(6, "0")}`
}

/** RCPT-2026-000045 */
export async function generateReceiptNumber(tx: Tx) {
  const year = new Date().getFullYear()
  const value = await nextValue(tx, `RECEIPT-${year}`)
  return `RCPT-${year}-${String(value).padStart(6, "0")}`
}

/** APT-2026-000045 — shown to patients as their appointment reference. */
export async function generateAppointmentCode(tx: Tx) {
  const year = new Date().getFullYear()
  const value = await nextValue(tx, `APPOINTMENT-${year}`)
  return `APT-${year}-${String(value).padStart(6, "0")}`
}
