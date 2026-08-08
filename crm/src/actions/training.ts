"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { toPlain } from "@/lib/serialize"
import {
  trainingProgramSchema,
  trainingEnrollSchema,
  enrollmentStatusSchema,
  type TrainingProgramInput,
  type TrainingEnrollInput,
  type EnrollmentStatusInput,
} from "@/lib/validations/hr"

export async function getTrainingPrograms() {
  const programs = await prisma.trainingProgram.findMany({
    include: { enrollments: { include: { employee: { include: { user: true } } } } },
    orderBy: { scheduledAt: "desc" },
  })
  return toPlain(programs)
}

export async function createTrainingProgram(input: TrainingProgramInput) {
  const data = trainingProgramSchema.parse(input)
  const program = await prisma.trainingProgram.create({
    data: { ...data, scheduledAt: new Date(data.scheduledAt) },
  })
  revalidatePath("/hr/training")
  return toPlain(program)
}

export async function enrollEmployees(programId: string, input: TrainingEnrollInput) {
  const data = trainingEnrollSchema.parse(input)
  await prisma.trainingEnrollment.createMany({
    data: data.employeeIds.map((employeeId) => ({ programId, employeeId })),
    skipDuplicates: true,
  })
  revalidatePath("/hr/training")
}

export async function updateEnrollmentStatus(id: string, input: EnrollmentStatusInput) {
  const data = enrollmentStatusSchema.parse(input)
  const enrollment = await prisma.trainingEnrollment.update({ where: { id }, data })
  revalidatePath("/hr/training")
  return toPlain(enrollment)
}
