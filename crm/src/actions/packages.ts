"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { serializeDecimal } from "@/lib/serialize"
import { packageSchema, type PackageInput } from "@/lib/validations/billing"

export async function getPackages(activeOnly = false) {
  const packages = await prisma.package.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: { name: "asc" },
  })
  return packages.map((p) => serializeDecimal(p, ["price"]))
}

export async function createPackage(input: PackageInput) {
  const data = packageSchema.parse(input)
  const pkg = await prisma.package.create({ data })
  revalidatePath("/finance/packages")
  return serializeDecimal(pkg, ["price"])
}

export async function togglePackageActive(id: string, active: boolean) {
  await prisma.package.update({ where: { id }, data: { active } })
  revalidatePath("/finance/packages")
}

export async function deletePackage(id: string) {
  await prisma.package.delete({ where: { id } })
  revalidatePath("/finance/packages")
}
