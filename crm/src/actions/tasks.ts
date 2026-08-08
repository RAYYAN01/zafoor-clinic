"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { toPlain } from "@/lib/serialize"
import { taskSchema, taskStatusSchema, type TaskInput, type TaskStatusInput } from "@/lib/validations/hr"

export async function getTasks(params?: { assignedToId?: string; status?: string }) {
  const tasks = await prisma.task.findMany({
    where: {
      assignedToId: params?.assignedToId || undefined,
      status: (params?.status as never) || undefined,
    },
    include: { assignedTo: true, assignedBy: true },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  })
  return toPlain(tasks)
}

export async function createTask(input: TaskInput) {
  const data = taskSchema.parse(input)
  const user = await getCurrentUser()
  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description || null,
      assignedToId: data.assignedToId,
      assignedById: user.id,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      priority: data.priority,
    },
  })
  revalidatePath("/hr/tasks")
  return toPlain(task)
}

export async function updateTaskStatus(id: string, input: TaskStatusInput) {
  const data = taskStatusSchema.parse(input)
  const task = await prisma.task.update({ where: { id }, data })
  revalidatePath("/hr/tasks")
  return toPlain(task)
}
