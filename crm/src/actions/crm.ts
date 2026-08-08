"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { serializeDecimal } from "@/lib/serialize"
import {
  noteSchema,
  followUpSchema,
  messageSchema,
  feedbackSchema,
  type NoteInput,
  type FollowUpInput,
  type MessageInput,
  type FeedbackInput,
} from "@/lib/validations/crm"

// ── Notes ───────────────────────────────────────────────────────────────

export async function addNote(patientId: string, input: NoteInput) {
  const data = noteSchema.parse(input)
  const user = await getCurrentUser()
  await prisma.patientNote.create({
    data: { ...data, patientId, authorId: user.id },
  })
  revalidatePath(`/patients/${patientId}`)
}

export async function togglePinNote(patientId: string, id: string, pinned: boolean) {
  await prisma.patientNote.update({ where: { id }, data: { pinned } })
  revalidatePath(`/patients/${patientId}`)
}

export async function deleteNote(patientId: string, id: string) {
  await prisma.patientNote.delete({ where: { id } })
  revalidatePath(`/patients/${patientId}`)
}

// ── Follow-ups ──────────────────────────────────────────────────────────

export async function addFollowUp(patientId: string, input: FollowUpInput) {
  const data = followUpSchema.parse(input)
  await prisma.followUp.create({ data: { ...data, patientId } })
  revalidatePath(`/patients/${patientId}`)
  revalidatePath("/follow-ups")
  revalidatePath("/dashboard")
}

export async function updateFollowUpStatus(id: string, status: "PENDING" | "DONE" | "MISSED" | "CANCELLED") {
  const followUp = await prisma.followUp.update({
    where: { id },
    data: { status, completedAt: status === "DONE" ? new Date() : null },
  })
  revalidatePath(`/patients/${followUp.patientId}`)
  revalidatePath("/follow-ups")
  revalidatePath("/dashboard")
}

export async function getFollowUps(params: { status?: string; assignedToId?: string }) {
  const followUps = await prisma.followUp.findMany({
    where: {
      status: params.status as never,
      assignedToId: params.assignedToId,
    },
    include: { patient: true, assignedTo: true },
    orderBy: { dueDate: "asc" },
  })
  return followUps.map((f) => ({
    ...f,
    assignedTo: f.assignedTo ? serializeDecimal(f.assignedTo, ["consultationFee"]) : null,
  }))
}

// ── Messages / communication log ──────────────────────────────────────

export async function logMessage(patientId: string, input: MessageInput) {
  const data = messageSchema.parse(input)
  const user = await getCurrentUser()
  await prisma.message.create({
    data: { ...data, patientId, sentById: user.id, direction: "OUTBOUND", status: "SENT" },
  })
  revalidatePath(`/patients/${patientId}`)
  revalidatePath("/communications")
}

export async function getMessages(params: { patientId?: string; channel?: string }) {
  return prisma.message.findMany({
    where: {
      patientId: params.patientId,
      channel: params.channel as never,
    },
    include: { patient: true, sentBy: true },
    orderBy: { sentAt: "desc" },
    take: 100,
  })
}

// ── Aggregate for patient profile CRM tab ─────────────────────────────

export async function getPatientCrmData(patientId: string) {
  const [notes, followUps, messages, feedback] = await Promise.all([
    prisma.patientNote.findMany({
      where: { patientId },
      include: { author: true },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    }),
    prisma.followUp.findMany({
      where: { patientId },
      include: { assignedTo: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.message.findMany({
      where: { patientId },
      include: { sentBy: true },
      orderBy: { sentAt: "desc" },
    }),
    prisma.feedback.findMany({ where: { patientId }, orderBy: { createdAt: "desc" } }),
  ])
  return {
    notes: notes.map((n) => ({ ...n, author: n.author ? serializeDecimal(n.author, ["consultationFee"]) : null })),
    followUps: followUps.map((f) => ({
      ...f,
      assignedTo: f.assignedTo ? serializeDecimal(f.assignedTo, ["consultationFee"]) : null,
    })),
    messages: messages.map((m) => ({ ...m, sentBy: m.sentBy ? serializeDecimal(m.sentBy, ["consultationFee"]) : null })),
    feedback,
  }
}

// ── Feedback ────────────────────────────────────────────────────────────

export async function addFeedback(patientId: string, input: FeedbackInput, appointmentId?: string) {
  const data = feedbackSchema.parse(input)
  await prisma.feedback.create({ data: { ...data, patientId, appointmentId } })
  revalidatePath(`/patients/${patientId}`)
}
