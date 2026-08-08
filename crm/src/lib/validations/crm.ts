import { z } from "zod"

export const noteSchema = z.object({
  body: z.string().trim().min(1, "Note cannot be empty"),
  category: z.enum(["GENERAL", "CLINICAL", "BILLING", "FRONT_DESK"]),
  pinned: z.boolean().optional(),
})
export type NoteInput = z.infer<typeof noteSchema>

export const followUpSchema = z.object({
  dueDate: z.coerce.date(),
  reason: z.string().trim().min(1, "Reason is required"),
  assignedToId: z.string().optional(),
  notes: z.string().trim().optional(),
})
export type FollowUpInput = z.infer<typeof followUpSchema>

export const messageSchema = z.object({
  channel: z.enum(["SMS", "EMAIL", "WHATSAPP", "CALL", "SYSTEM"]),
  subject: z.string().trim().optional(),
  body: z.string().trim().min(1, "Message body is required"),
})
export type MessageInput = z.infer<typeof messageSchema>

export const feedbackSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().optional(),
  category: z.string().trim().optional(),
})
export type FeedbackInput = z.infer<typeof feedbackSchema>
