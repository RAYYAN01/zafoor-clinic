"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { toPlain } from "@/lib/serialize"
import {
  wardSchema,
  bedSchema,
  bedStatusSchema,
  assignBedSchema,
  type WardInput,
  type BedInput,
  type BedStatusInput,
  type AssignBedInput,
} from "@/lib/validations/operations"

// ── Wards ───────────────────────────────────────────────────────────────

export async function getWards() {
  const wards = await prisma.ward.findMany({
    include: { beds: true },
    orderBy: { name: "asc" },
  })
  return toPlain(wards)
}

export async function createWard(input: WardInput) {
  const data = wardSchema.parse(input)
  const ward = await prisma.ward.create({ data })
  revalidatePath("/operations/beds")
  return toPlain(ward)
}

export async function deleteWard(id: string) {
  await prisma.ward.delete({ where: { id } })
  revalidatePath("/operations/beds")
}

// ── Beds ────────────────────────────────────────────────────────────────

export async function getBeds(wardId?: string) {
  const beds = await prisma.bed.findMany({
    where: wardId ? { wardId } : undefined,
    include: {
      ward: true,
      admissions: {
        where: { status: "ADMITTED" },
        include: { patient: true },
        take: 1,
        orderBy: { admittedAt: "desc" },
      },
    },
    orderBy: [{ ward: { name: "asc" } }, { bedNumber: "asc" }],
  })
  return toPlain(beds)
}

export async function createBed(input: BedInput) {
  const data = bedSchema.parse(input)
  const bed = await prisma.bed.create({ data })
  revalidatePath("/operations/beds")
  return toPlain(bed)
}

export async function updateBedStatus(id: string, input: BedStatusInput) {
  const data = bedStatusSchema.parse(input)
  const bed = await prisma.bed.update({ where: { id }, data })
  revalidatePath("/operations/beds")
  revalidatePath("/operations/icu")
  return toPlain(bed)
}

export async function deleteBed(id: string) {
  await prisma.bed.delete({ where: { id } })
  revalidatePath("/operations/beds")
}

export async function getAvailableBeds(type?: string) {
  const beds = await prisma.bed.findMany({
    where: { status: "AVAILABLE", ...(type ? { type: type as never } : {}) },
    include: { ward: true },
    orderBy: [{ ward: { name: "asc" } }, { bedNumber: "asc" }],
  })
  return toPlain(beds)
}

// ── Bed assignment on admission ────────────────────────────────────────

export async function assignBedToAdmission(admissionId: string, input: AssignBedInput) {
  const data = assignBedSchema.parse(input)

  await prisma.$transaction(async (tx) => {
    const bed = await tx.bed.findUniqueOrThrow({ where: { id: data.bedId } })
    if (bed.status !== "AVAILABLE") throw new Error("Selected bed is not available")

    const admission = await tx.admission.findUniqueOrThrow({ where: { id: admissionId } })
    if (admission.bedId) {
      await tx.bed.update({ where: { id: admission.bedId }, data: { status: "CLEANING" } })
    }

    await tx.admission.update({ where: { id: admissionId }, data: { bedId: data.bedId } })
    await tx.bed.update({ where: { id: data.bedId }, data: { status: "OCCUPIED" } })
  })

  revalidatePath("/operations/beds")
  revalidatePath("/operations/icu")
}

export async function releaseBedForAdmission(admissionId: string) {
  const admission = await prisma.admission.findUniqueOrThrow({ where: { id: admissionId } })
  if (admission.bedId) {
    await prisma.bed.update({ where: { id: admission.bedId }, data: { status: "CLEANING" } })
    await prisma.admission.update({ where: { id: admissionId }, data: { bedId: null } })
  }
  revalidatePath("/operations/beds")
  revalidatePath("/operations/icu")
}

export async function getBedOccupancySummary() {
  const beds = await prisma.bed.findMany({ include: { ward: true } })
  const total = beds.length
  const occupied = beds.filter((b) => b.status === "OCCUPIED").length
  const available = beds.filter((b) => b.status === "AVAILABLE").length
  const icuTotal = beds.filter((b) => b.type === "ICU").length
  const icuOccupied = beds.filter((b) => b.type === "ICU" && b.status === "OCCUPIED").length

  return {
    total,
    occupied,
    available,
    occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0,
    icuTotal,
    icuOccupied,
    icuOccupancyRate: icuTotal > 0 ? Math.round((icuOccupied / icuTotal) * 100) : 0,
  }
}
