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

/** NH-2026-000123 — sequential per calendar year, atomic via Counter table. */
export async function generateUHID(tx: Tx) {
  const year = new Date().getFullYear()
  const value = await nextValue(tx, `UHID-${year}`)
  return `NH-${year}-${String(value).padStart(6, "0")}`
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

/** CLM-2026-000012 */
export async function generateClaimNumber(tx: Tx) {
  const year = new Date().getFullYear()
  const value = await nextValue(tx, `CLAIM-${year}`)
  return `CLM-${year}-${String(value).padStart(6, "0")}`
}

/** Daily per-doctor token number, resets each day. */
export async function generateTokenNumber(tx: Tx, doctorId: string, date: Date) {
  const dayKey = date.toISOString().slice(0, 10)
  const value = await nextValue(tx, `TOKEN-${doctorId}-${dayKey}`)
  return value
}

/** ER-2026-000012 */
export async function generateCaseNumber(tx: Tx) {
  const year = new Date().getFullYear()
  const value = await nextValue(tx, `ER-${year}`)
  return `ER-${year}-${String(value).padStart(6, "0")}`
}

/** LAB-2026-000012 */
export async function generateLabOrderNumber(tx: Tx) {
  const year = new Date().getFullYear()
  const value = await nextValue(tx, `LABORDER-${year}`)
  return `LAB-${year}-${String(value).padStart(6, "0")}`
}

/** RAD-2026-000012 */
export async function generateRadiologyOrderNumber(tx: Tx) {
  const year = new Date().getFullYear()
  const value = await nextValue(tx, `RADORDER-${year}`)
  return `RAD-${year}-${String(value).padStart(6, "0")}`
}

/** BARC-2026-000123 — printed on the sample collection label. */
export async function generateBarcode(tx: Tx) {
  const year = new Date().getFullYear()
  const value = await nextValue(tx, `BARCODE-${year}`)
  return `BARC-${year}-${String(value).padStart(6, "0")}`
}

/** PO-2026-000012 */
export async function generatePoNumber(tx: Tx) {
  const year = new Date().getFullYear()
  const value = await nextValue(tx, `PO-${year}`)
  return `PO-${year}-${String(value).padStart(6, "0")}`
}

/** DISP-2026-000012 */
export async function generateDispenseNumber(tx: Tx) {
  const year = new Date().getFullYear()
  const value = await nextValue(tx, `DISPENSE-${year}`)
  return `DISP-${year}-${String(value).padStart(6, "0")}`
}

/** TKT-2026-000012 */
export async function generateTicketNumber(tx: Tx) {
  const year = new Date().getFullYear()
  const value = await nextValue(tx, `TICKET-${year}`)
  return `TKT-${year}-${String(value).padStart(6, "0")}`
}

/** EMP-2026-000012 */
export async function generateEmployeeCode(tx: Tx) {
  const year = new Date().getFullYear()
  const value = await nextValue(tx, `EMPLOYEE-${year}`)
  return `EMP-${year}-${String(value).padStart(5, "0")}`
}
