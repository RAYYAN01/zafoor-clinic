"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { serializeDecimal } from "@/lib/serialize"
import { serviceSchema, type ServiceInput } from "@/lib/validations/billing"

export async function getServices(activeOnly = false) {
  const services = await prisma.service.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  })
  return services.map((s) => serializeDecimal(s, ["price"]))
}

export async function getServiceBySlug(slug: string) {
  const service = await prisma.service.findUnique({ where: { slug } })
  return service ? serializeDecimal(service, ["price"]) : null
}

export async function createService(input: ServiceInput) {
  const data = serviceSchema.parse(input)
  const service = await prisma.service.create({ data })
  revalidatePath("/services")
  return serializeDecimal(service, ["price"])
}

export async function updateService(id: string, input: ServiceInput) {
  const data = serviceSchema.parse(input)
  const service = await prisma.service.update({ where: { id }, data })
  revalidatePath("/services")
  return serializeDecimal(service, ["price"])
}

export async function toggleServiceActive(id: string, active: boolean) {
  await prisma.service.update({ where: { id }, data: { active } })
  revalidatePath("/services")
}

export async function deleteService(id: string) {
  await prisma.service.delete({ where: { id } })
  revalidatePath("/services")
}
