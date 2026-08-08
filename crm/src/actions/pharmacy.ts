"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { toPlain } from "@/lib/serialize"
import { generatePoNumber, generateDispenseNumber } from "@/lib/sequence"
import {
  vendorSchema,
  medicineSchema,
  medicineBatchSchema,
  purchaseOrderSchema,
  poStatusSchema,
  pharmacyDispenseSchema,
  type VendorInput,
  type MedicineInput,
  type MedicineBatchInput,
  type PurchaseOrderInput,
  type PoStatusInput,
  type PharmacyDispenseInput,
} from "@/lib/validations/operations"

// ── Vendors ─────────────────────────────────────────────────────────────

export async function getVendors() {
  const vendors = await prisma.vendor.findMany({ orderBy: { name: "asc" } })
  return toPlain(vendors)
}

export async function createVendor(input: VendorInput) {
  const data = vendorSchema.parse(input)
  const vendor = await prisma.vendor.create({ data })
  revalidatePath("/operations/vendors")
  return toPlain(vendor)
}

export async function deleteVendor(id: string) {
  await prisma.vendor.delete({ where: { id } })
  revalidatePath("/operations/vendors")
}

// ── Medicines & stock ───────────────────────────────────────────────────

export async function getMedicines() {
  const medicines = await prisma.medicine.findMany({
    include: { batches: { orderBy: { expiryDate: "asc" } } },
    orderBy: { name: "asc" },
  })
  return toPlain(
    medicines.map((m) => ({
      ...m,
      totalStock: m.batches.reduce((sum, b) => sum + b.quantity, 0),
      lowStock: m.batches.reduce((sum, b) => sum + b.quantity, 0) <= m.reorderLevel,
    }))
  )
}

export async function createMedicine(input: MedicineInput) {
  const data = medicineSchema.parse(input)
  const medicine = await prisma.medicine.create({ data })
  revalidatePath("/operations/pharmacy")
  return toPlain(medicine)
}

export async function addMedicineBatch(input: MedicineBatchInput) {
  const data = medicineBatchSchema.parse(input)
  const batch = await prisma.medicineBatch.create({
    data: { ...data, expiryDate: new Date(data.expiryDate) },
  })
  revalidatePath("/operations/pharmacy")
  return toPlain(batch)
}

export async function getExpiringBatches(withinDays = 60) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() + withinDays)
  const batches = await prisma.medicineBatch.findMany({
    where: { expiryDate: { lte: cutoff }, quantity: { gt: 0 } },
    include: { medicine: true },
    orderBy: { expiryDate: "asc" },
  })
  return toPlain(batches)
}

// ── Purchase Orders ─────────────────────────────────────────────────────

export async function getPurchaseOrders(status?: string) {
  const orders = await prisma.purchaseOrder.findMany({
    where: status ? { status: status as never } : undefined,
    include: { vendor: true, items: { include: { medicine: true } } },
    orderBy: { orderedAt: "desc" },
  })
  return toPlain(orders)
}

export async function createPurchaseOrder(input: PurchaseOrderInput) {
  const data = purchaseOrderSchema.parse(input)
  const user = await getCurrentUser()

  const po = await prisma.$transaction(async (tx) => {
    const poNumber = await generatePoNumber(tx)
    return tx.purchaseOrder.create({
      data: {
        poNumber,
        vendorId: data.vendorId,
        status: "ORDERED",
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
        notes: data.notes || null,
        createdById: user.id,
        items: { create: data.items },
      },
      include: { items: true },
    })
  })

  revalidatePath("/operations/pharmacy/purchase-orders")
  return toPlain(po)
}

export async function updatePurchaseOrderStatus(id: string, input: PoStatusInput) {
  const data = poStatusSchema.parse(input)

  const po = await prisma.$transaction(async (tx) => {
    const existing = await tx.purchaseOrder.findUniqueOrThrow({ where: { id }, include: { items: true } })

    if (data.status === "RECEIVED" && existing.status !== "RECEIVED") {
      for (const item of existing.items) {
        await tx.medicineBatch.create({
          data: {
            medicineId: item.medicineId,
            batchNumber: `${existing.poNumber}-${item.id.slice(-5)}`,
            vendorId: existing.vendorId,
            expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)),
            quantity: item.quantity,
            mrp: item.unitCost,
            purchasePrice: item.unitCost,
          },
        })
      }
    }

    return tx.purchaseOrder.update({
      where: { id },
      data: { status: data.status, receivedAt: data.status === "RECEIVED" ? new Date() : undefined },
    })
  })

  revalidatePath("/operations/pharmacy/purchase-orders")
  revalidatePath("/operations/pharmacy")
  return toPlain(po)
}

// ── Dispensing ──────────────────────────────────────────────────────────

export async function getDispenses() {
  const dispenses = await prisma.pharmacyDispense.findMany({
    include: { patient: true, items: { include: { medicine: true } } },
    orderBy: { dispensedAt: "desc" },
    take: 50,
  })
  return toPlain(dispenses)
}

export async function dispenseMedicines(input: PharmacyDispenseInput) {
  const data = pharmacyDispenseSchema.parse(input)
  const user = await getCurrentUser()

  const dispense = await prisma.$transaction(async (tx) => {
    for (const item of data.items) {
      const batch = await tx.medicineBatch.findUniqueOrThrow({ where: { id: item.batchId } })
      if (batch.quantity < item.quantity) {
        throw new Error(`Insufficient stock for batch ${batch.batchNumber}`)
      }
      await tx.medicineBatch.update({ where: { id: item.batchId }, data: { quantity: { decrement: item.quantity } } })
    }

    const dispenseNumber = await generateDispenseNumber(tx)
    return tx.pharmacyDispense.create({
      data: {
        dispenseNumber,
        patientId: data.patientId,
        prescriptionId: data.prescriptionId || null,
        dispensedById: user.id,
        items: { create: data.items },
      },
      include: { items: true },
    })
  })

  revalidatePath("/operations/pharmacy")
  revalidatePath("/operations/pharmacy/dispense")
  return toPlain(dispense)
}
