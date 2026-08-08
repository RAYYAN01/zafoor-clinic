"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth"
import { toPlain } from "@/lib/serialize"
import {
  clinicSettingsSchema,
  faqSchema,
  reviewSchema,
  type ClinicSettingsInput,
  type FaqInput,
  type ReviewInput,
} from "@/lib/validations/website"

// ── Clinic settings — read by both the CRM and the public website API ───

export async function getClinicSettings() {
  const settings = await prisma.clinicSettings.upsert({
    where: { id: "clinic" },
    create: { id: "clinic" },
    update: {},
  })
  return settings
}

export async function updateClinicSettings(input: ClinicSettingsInput) {
  await requireRole("ADMIN")
  const data = clinicSettingsSchema.parse(input)
  const settings = await prisma.clinicSettings.upsert({
    where: { id: "clinic" },
    create: { id: "clinic", ...data },
    update: data,
  })
  revalidatePath("/website/content")
  return settings
}

// ── FAQs ─────────────────────────────────────────────────────────────────

export async function getFaqs(activeOnly = false) {
  return prisma.fAQ.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
  })
}

export async function createFaq(input: FaqInput) {
  await requireRole("ADMIN")
  const data = faqSchema.parse(input)
  const faq = await prisma.fAQ.create({ data })
  revalidatePath("/website/faqs")
  return faq
}

export async function updateFaq(id: string, input: FaqInput) {
  await requireRole("ADMIN")
  const data = faqSchema.parse(input)
  const faq = await prisma.fAQ.update({ where: { id }, data })
  revalidatePath("/website/faqs")
  return faq
}

export async function toggleFaqActive(id: string, active: boolean) {
  await requireRole("ADMIN")
  await prisma.fAQ.update({ where: { id }, data: { active } })
  revalidatePath("/website/faqs")
}

export async function deleteFaq(id: string) {
  await requireRole("ADMIN")
  await prisma.fAQ.delete({ where: { id } })
  revalidatePath("/website/faqs")
}

// ── Reviews (admin-curated, only real submissions get published) ─────────

export async function getReviews(publishedOnly = false) {
  const reviews = await prisma.review.findMany({
    where: publishedOnly ? { published: true } : undefined,
    include: { service: true },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
  })
  return toPlain(reviews)
}

export async function createReview(input: ReviewInput) {
  await requireRole("ADMIN")
  const data = reviewSchema.parse(input)
  const review = await prisma.review.create({ data: { ...data, serviceId: data.serviceId || null } })
  revalidatePath("/website/reviews")
  return toPlain(review)
}

export async function togglePublishReview(id: string, published: boolean) {
  await requireRole("ADMIN")
  await prisma.review.update({ where: { id }, data: { published } })
  revalidatePath("/website/reviews")
}

export async function deleteReview(id: string) {
  await requireRole("ADMIN")
  await prisma.review.delete({ where: { id } })
  revalidatePath("/website/reviews")
}
