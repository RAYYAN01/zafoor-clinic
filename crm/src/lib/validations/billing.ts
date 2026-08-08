import { z } from "zod"

export const billItemSchema = z.object({
  description: z.string().trim().min(1, "Description is required"),
  hsnCode: z.string().trim().optional(),
  quantity: z.coerce.number().int().positive().default(1),
  unitPrice: z.coerce.number().nonnegative(),
  taxRatePercent: z.coerce.number().min(0).max(100).default(0),
})
export type BillItemInput = z.infer<typeof billItemSchema>

export const createBillSchema = z.object({
  patientId: z.string().min(1, "Select a patient"),
  type: z.enum(["OPD", "IPD", "EMERGENCY", "LAB", "RADIOLOGY", "PHARMACY"]),
  payerType: z.enum(["SELF", "INSURANCE", "CORPORATE"]),
  insuranceId: z.string().optional(),
  corporateAccountId: z.string().optional(),
  admissionId: z.string().optional(),
  appointmentId: z.string().optional(),
  packageId: z.string().optional(),
  discountAmount: z.coerce.number().nonnegative().default(0),
  items: z.array(billItemSchema).min(1, "Add at least one line item"),
})
export type CreateBillInput = z.infer<typeof createBillSchema>

export const collectPaymentSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  method: z.enum(["CASH", "CARD", "UPI", "NET_BANKING", "INSURANCE", "WALLET", "ADVANCE"]),
  referenceNumber: z.string().trim().optional(),
  gatewayProvider: z.string().trim().optional(),
})
export type CollectPaymentInput = z.infer<typeof collectPaymentSchema>

export const advanceSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  method: z.enum(["CASH", "CARD", "UPI", "NET_BANKING", "WALLET"]),
  referenceNumber: z.string().trim().optional(),
  notes: z.string().trim().optional(),
})
export type AdvanceInput = z.infer<typeof advanceSchema>

export const refundSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  reason: z.string().trim().min(1, "Reason is required"),
  method: z.enum(["CASH", "CARD", "UPI", "NET_BANKING", "INSURANCE", "WALLET"]),
})
export type RefundInput = z.infer<typeof refundSchema>

export const expenseSchema = z.object({
  category: z.enum(["SALARY", "UTILITIES", "SUPPLIES", "MAINTENANCE", "MARKETING", "RENT", "EQUIPMENT", "OTHER"]),
  description: z.string().trim().min(1, "Description is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  expenseDate: z.string().optional(),
  paidTo: z.string().trim().optional(),
  method: z.enum(["CASH", "CARD", "UPI", "NET_BANKING", "WALLET"]),
  referenceNumber: z.string().trim().optional(),
})
export type ExpenseInput = z.infer<typeof expenseSchema>

export const corporateAccountSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required"),
  contactName: z.string().trim().optional(),
  contactPhone: z.string().trim().optional(),
  contactEmail: z.string().trim().optional(),
  gstin: z.string().trim().optional(),
  creditLimit: z.coerce.number().nonnegative().optional(),
  address: z.string().trim().optional(),
})
export type CorporateAccountInput = z.infer<typeof corporateAccountSchema>

export const packageSchema = z.object({
  name: z.string().trim().min(1, "Package name is required"),
  description: z.string().trim().optional(),
  price: z.coerce.number().positive("Price must be greater than zero"),
  includedItems: z.array(z.string().trim().min(1)).default([]),
})
export type PackageInput = z.infer<typeof packageSchema>

export const cashSessionCloseSchema = z.object({
  closingBalance: z.coerce.number().nonnegative(),
  notes: z.string().trim().optional(),
})
export type CashSessionCloseInput = z.infer<typeof cashSessionCloseSchema>

export const insuranceClaimUpdateSchema = z.object({
  status: z.enum(["DRAFT", "SUBMITTED", "APPROVED", "PARTIALLY_APPROVED", "REJECTED", "SETTLED"]),
  approvedAmount: z.coerce.number().nonnegative().optional(),
  rejectionReason: z.string().trim().optional(),
  notes: z.string().trim().optional(),
})
export type InsuranceClaimUpdateInput = z.infer<typeof insuranceClaimUpdateSchema>
