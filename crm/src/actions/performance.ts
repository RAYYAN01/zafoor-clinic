"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { toPlain } from "@/lib/serialize"
import { performanceReviewSchema, reviewStatusSchema, type PerformanceReviewInput, type ReviewStatusInput } from "@/lib/validations/hr"

export async function getPerformanceReviews(employeeId?: string) {
  const reviews = await prisma.performanceReview.findMany({
    where: employeeId ? { employeeId } : undefined,
    include: { employee: { include: { user: true, department: true } }, reviewer: true },
    orderBy: { reviewDate: "desc" },
  })
  return toPlain(reviews)
}

export async function createPerformanceReview(input: PerformanceReviewInput) {
  const data = performanceReviewSchema.parse(input)
  const user = await getCurrentUser()
  const review = await prisma.performanceReview.create({
    data: { ...data, reviewerId: user.id },
  })
  revalidatePath("/hr/performance")
  return toPlain(review)
}

export async function updateReviewStatus(id: string, input: ReviewStatusInput) {
  const data = reviewStatusSchema.parse(input)
  const review = await prisma.performanceReview.update({ where: { id }, data })
  revalidatePath("/hr/performance")
  return toPlain(review)
}
