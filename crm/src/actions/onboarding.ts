"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { toPlain } from "@/lib/serialize"
import { onboardingTaskSchema, type OnboardingTaskInput } from "@/lib/validations/hr"

export async function getOnboardingTasks(employeeId?: string) {
  const tasks = await prisma.onboardingTask.findMany({
    where: employeeId ? { employeeId } : { status: "PENDING" },
    include: { employee: { include: { user: true } }, assignedTo: true },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  })
  return toPlain(tasks)
}

export async function createOnboardingTask(input: OnboardingTaskInput) {
  const data = onboardingTaskSchema.parse(input)
  const task = await prisma.onboardingTask.create({
    data: {
      employeeId: data.employeeId,
      title: data.title,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      assignedToId: data.assignedToId || null,
    },
  })
  revalidatePath("/hr/onboarding")
  return toPlain(task)
}

export async function toggleOnboardingTask(id: string) {
  const task = await prisma.onboardingTask.findUniqueOrThrow({ where: { id } })
  const updated = await prisma.onboardingTask.update({
    where: { id },
    data: { status: task.status === "DONE" ? "PENDING" : "DONE" },
  })
  revalidatePath("/hr/onboarding")
  return toPlain(updated)
}
