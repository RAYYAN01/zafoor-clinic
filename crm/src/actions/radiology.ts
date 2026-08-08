"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { toPlain } from "@/lib/serialize"
import { generateRadiologyOrderNumber } from "@/lib/sequence"
import {
  radiologyOrderSchema,
  radiologyOrderStatusSchema,
  pacsImageSchema,
  type RadiologyOrderInput,
  type RadiologyOrderStatusInput,
  type PacsImageInput,
} from "@/lib/validations/operations"

export async function getRadiologyOrders(status?: string) {
  const orders = await prisma.radiologyOrder.findMany({
    where: status ? { status: status as never } : undefined,
    include: { patient: true, doctor: true, images: true },
    orderBy: { orderedAt: "desc" },
  })
  return toPlain(orders)
}

export async function getRadiologyOrder(id: string) {
  const order = await prisma.radiologyOrder.findUnique({
    where: { id },
    include: { patient: true, doctor: true, images: true },
  })
  if (!order) return null
  return toPlain(order)
}

export async function createRadiologyOrder(input: RadiologyOrderInput) {
  const data = radiologyOrderSchema.parse(input)

  const order = await prisma.$transaction(async (tx) => {
    const orderNumber = await generateRadiologyOrderNumber(tx)
    return tx.radiologyOrder.create({
      data: {
        orderNumber,
        patientId: data.patientId,
        doctorId: data.doctorId || null,
        encounterId: data.encounterId || null,
        modality: data.modality,
        bodyPart: data.bodyPart,
        priority: data.priority,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        status: data.scheduledAt ? "SCHEDULED" : "ORDERED",
      },
    })
  })

  revalidatePath("/operations/radiology")
  return toPlain(order)
}

export async function updateRadiologyOrderStatus(id: string, input: RadiologyOrderStatusInput) {
  const data = radiologyOrderStatusSchema.parse(input)
  const order = await prisma.radiologyOrder.update({
    where: { id },
    data: {
      status: data.status,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
    },
  })
  revalidatePath("/operations/radiology")
  return toPlain(order)
}

export async function addPacsImage(radiologyOrderId: string, input: PacsImageInput) {
  const data = pacsImageSchema.parse(input)
  const image = await prisma.pacsImage.create({
    data: { radiologyOrderId, ...data },
  })
  revalidatePath("/operations/radiology")
  return toPlain(image)
}
