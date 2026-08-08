"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { toPlain } from "@/lib/serialize"
import {
  jobOpeningSchema,
  jobOpeningStatusSchema,
  candidateSchema,
  candidateStageSchema,
  type JobOpeningInput,
  type JobOpeningStatusInput,
  type CandidateInput,
  type CandidateStageInput,
} from "@/lib/validations/hr"

// ── Job Openings ────────────────────────────────────────────────────────

export async function getJobOpenings() {
  const openings = await prisma.jobOpening.findMany({
    include: { department: true, candidates: true },
    orderBy: { postedAt: "desc" },
  })
  return toPlain(openings)
}

export async function createJobOpening(input: JobOpeningInput) {
  const data = jobOpeningSchema.parse(input)
  const user = await getCurrentUser()
  const opening = await prisma.jobOpening.create({
    data: { ...data, postedById: user.id },
  })
  revalidatePath("/hr/recruitment")
  return toPlain(opening)
}

export async function updateJobOpeningStatus(id: string, input: JobOpeningStatusInput) {
  const data = jobOpeningStatusSchema.parse(input)
  const opening = await prisma.jobOpening.update({ where: { id }, data })
  revalidatePath("/hr/recruitment")
  return toPlain(opening)
}

// ── Candidates ──────────────────────────────────────────────────────────

export async function getCandidates(jobOpeningId?: string) {
  const candidates = await prisma.candidate.findMany({
    where: jobOpeningId ? { jobOpeningId } : undefined,
    include: { jobOpening: true },
    orderBy: { appliedAt: "desc" },
  })
  return toPlain(candidates)
}

export async function addCandidate(input: CandidateInput) {
  const data = candidateSchema.parse(input)
  const candidate = await prisma.candidate.create({ data })
  revalidatePath("/hr/recruitment")
  return toPlain(candidate)
}

export async function updateCandidateStage(id: string, input: CandidateStageInput) {
  const data = candidateStageSchema.parse(input)
  const candidate = await prisma.candidate.update({ where: { id }, data })
  revalidatePath("/hr/recruitment")
  return toPlain(candidate)
}
