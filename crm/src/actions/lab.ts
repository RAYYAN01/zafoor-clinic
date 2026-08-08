"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { toPlain } from "@/lib/serialize"
import { generateLabOrderNumber, generateBarcode } from "@/lib/sequence"
import {
  labOrderSchema,
  labOrderStatusSchema,
  sampleStatusSchema,
  type LabOrderInput,
  type LabOrderStatusInput,
  type SampleStatusInput,
} from "@/lib/validations/operations"

export async function getLabOrders(status?: string) {
  const orders = await prisma.labOrder.findMany({
    where: status ? { status: status as never } : undefined,
    include: { patient: true, doctor: true, sample: true },
    orderBy: { orderedAt: "desc" },
  })
  return toPlain(orders)
}

export async function createLabOrder(input: LabOrderInput) {
  const data = labOrderSchema.parse(input)

  const order = await prisma.$transaction(async (tx) => {
    const orderNumber = await generateLabOrderNumber(tx)
    const created = await tx.labOrder.create({
      data: {
        orderNumber,
        patientId: data.patientId,
        doctorId: data.doctorId || null,
        encounterId: data.encounterId || null,
        testName: data.testName,
        priority: data.priority,
      },
    })
    const barcode = await generateBarcode(tx)
    await tx.sample.create({
      data: { barcode, labOrderId: created.id, type: data.sampleType },
    })
    return created
  })

  revalidatePath("/operations/lab")
  return toPlain(order)
}

export async function updateLabOrderStatus(id: string, input: LabOrderStatusInput) {
  const data = labOrderStatusSchema.parse(input)
  const order = await prisma.labOrder.update({ where: { id }, data })
  revalidatePath("/operations/lab")
  return toPlain(order)
}

export async function updateSampleStatus(id: string, input: SampleStatusInput) {
  const data = sampleStatusSchema.parse(input)
  const user = await getCurrentUser()

  const sample = await prisma.$transaction(async (tx) => {
    const updated = await tx.sample.update({
      where: { id },
      data: {
        status: data.status,
        rejectionReason: data.rejectionReason || null,
        collectedAt: data.status === "COLLECTED" ? new Date() : undefined,
        collectedById: data.status === "COLLECTED" ? user.id : undefined,
        receivedAt: data.status === "RECEIVED" ? new Date() : undefined,
      },
    })

    if (data.status === "COLLECTED") {
      await tx.labOrder.update({ where: { id: updated.labOrderId }, data: { status: "SAMPLE_COLLECTED" } })
    } else if (data.status === "RECEIVED") {
      await tx.labOrder.update({ where: { id: updated.labOrderId }, data: { status: "IN_LAB" } })
    }
    return updated
  })

  revalidatePath("/operations/lab")
  return toPlain(sample)
}

export async function getSampleByBarcode(barcode: string) {
  const sample = await prisma.sample.findUnique({
    where: { barcode },
    include: { labOrder: { include: { patient: true, doctor: true } } },
  })
  if (!sample) return null
  return toPlain(sample)
}
