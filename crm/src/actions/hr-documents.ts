"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { toPlain } from "@/lib/serialize"
import { employeeDocumentSchema, type EmployeeDocumentInput } from "@/lib/validations/hr"

export async function getEmployeeDocuments(employeeId?: string) {
  const documents = await prisma.employeeDocument.findMany({
    where: employeeId ? { employeeId } : undefined,
    include: { employee: { include: { user: true } } },
    orderBy: { uploadedAt: "desc" },
  })
  return toPlain(documents)
}

export async function addEmployeeDocument(input: EmployeeDocumentInput) {
  const data = employeeDocumentSchema.parse(input)
  const document = await prisma.employeeDocument.create({ data })
  revalidatePath("/hr/documents")
  revalidatePath(`/hr/employees/${data.employeeId}`)
  return toPlain(document)
}

export async function deleteEmployeeDocument(id: string) {
  await prisma.employeeDocument.delete({ where: { id } })
  revalidatePath("/hr/documents")
}
