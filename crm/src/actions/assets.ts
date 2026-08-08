"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { toPlain } from "@/lib/serialize"
import {
  equipmentSchema,
  equipmentStatusSchema,
  type EquipmentInput,
  type EquipmentStatusInput,
} from "@/lib/validations/operations"

function nextAssetCode(count: number) {
  const year = new Date().getFullYear()
  return `AST-${year}-${String(count + 1).padStart(5, "0")}`
}

export async function getEquipment(category?: string) {
  const equipment = await prisma.equipment.findMany({
    where: category ? { category: category as never } : undefined,
    include: { vendor: true },
    orderBy: { name: "asc" },
  })
  return toPlain(equipment)
}

export async function createEquipment(input: EquipmentInput) {
  const data = equipmentSchema.parse(input)
  const count = await prisma.equipment.count()
  const equipment = await prisma.equipment.create({
    data: {
      assetCode: nextAssetCode(count),
      name: data.name,
      category: data.category,
      department: data.department || null,
      location: data.location || null,
      vendorId: data.vendorId || null,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
      nextServiceDue: data.nextServiceDue ? new Date(data.nextServiceDue) : null,
      notes: data.notes || null,
    },
  })
  revalidatePath("/operations/assets")
  return toPlain(equipment)
}

export async function updateEquipmentStatus(id: string, input: EquipmentStatusInput) {
  const data = equipmentStatusSchema.parse(input)
  const equipment = await prisma.equipment.update({
    where: { id },
    data: {
      status: data.status,
      lastServiceDate: data.status === "OPERATIONAL" ? new Date() : undefined,
    },
  })
  revalidatePath("/operations/assets")
  return toPlain(equipment)
}

export async function deleteEquipment(id: string) {
  await prisma.equipment.delete({ where: { id } })
  revalidatePath("/operations/assets")
}
