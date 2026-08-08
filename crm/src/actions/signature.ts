"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"

export async function getDoctorSignature(doctorId: string) {
  return prisma.digitalSignature.findUnique({ where: { doctorId } })
}

export async function saveDoctorSignature(doctorId: string, signatureUrl: string) {
  const signature = await prisma.digitalSignature.upsert({
    where: { doctorId },
    create: { doctorId, signatureUrl },
    update: { signatureUrl },
  })
  revalidatePath("/settings/signature")
  return signature
}
