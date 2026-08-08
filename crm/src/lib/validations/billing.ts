import { z } from "zod"

export const billItemSchema = z.object({
  description: z.string().trim().min(1, "Description is required"),
  quantity: z.coerce.number().int().positive().default(1),
  unitPrice: z.coerce.number().nonnegative(),
  taxRatePercent: z.coerce.number().min(0).max(100).default(0),
})
export type BillItemInput = z.infer<typeof billItemSchema>

export const createBillSchema = z.object({
  patientId: z.string().min(1, "Select a patient"),
  insuranceId: z.string().optional(),
  appointmentId: z.string().optional(),
  serviceId: z.string().optional(),
  discountAmount: z.coerce.number().nonnegative().default(0),
  items: z.array(billItemSchema).min(1, "Add at least one line item"),
})
export type CreateBillInput = z.infer<typeof createBillSchema>

export const collectPaymentSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  method: z.enum(["CASH", "CARD", "UPI", "NET_BANKING", "INSURANCE", "ADVANCE"]),
  referenceNumber: z.string().trim().optional(),
})
export type CollectPaymentInput = z.infer<typeof collectPaymentSchema>

export const advanceSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  method: z.enum(["CASH", "CARD", "UPI", "NET_BANKING"]),
  referenceNumber: z.string().trim().optional(),
  notes: z.string().trim().optional(),
})
export type AdvanceInput = z.infer<typeof advanceSchema>

export const refundSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  reason: z.string().trim().min(1, "Reason is required"),
  method: z.enum(["CASH", "CARD", "UPI", "NET_BANKING", "INSURANCE"]),
})
export type RefundInput = z.infer<typeof refundSchema>

export const expenseSchema = z.object({
  category: z.enum(["UTILITIES", "SUPPLIES", "MAINTENANCE", "MARKETING", "RENT", "EQUIPMENT", "OTHER"]),
  description: z.string().trim().min(1, "Description is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  expenseDate: z.string().optional(),
  paidTo: z.string().trim().optional(),
  method: z.enum(["CASH", "CARD", "UPI", "NET_BANKING"]),
  referenceNumber: z.string().trim().optional(),
})
export type ExpenseInput = z.infer<typeof expenseSchema>

export const serviceSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only"),
  name: z.string().trim().min(1, "Service name is required"),
  shortDescription: z.string().trim().optional(),
  description: z.string().trim().optional(),
  price: z.coerce.number().nonnegative().optional(),
  durationMinutes: z.coerce.number().int().positive().default(30),
  displayOrder: z.coerce.number().int().default(0),
})
export type ServiceInput = z.infer<typeof serviceSchema>

export const cashSessionCloseSchema = z.object({
  closingBalance: z.coerce.number().nonnegative(),
  notes: z.string().trim().optional(),
})
export type CashSessionCloseInput = z.infer<typeof cashSessionCloseSchema>
