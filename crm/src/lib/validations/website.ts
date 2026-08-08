import { z } from "zod"

export const clinicSettingsSchema = z.object({
  name: z.string().trim().min(1, "Clinic name is required"),
  addressLine: z.string().trim().min(1, "Address is required"),
  landmark: z.string().trim().optional(),
  phone: z.string().trim().min(7, "Enter a valid phone number"),
  email: z.string().trim().email(),
  mapQuery: z.string().trim().optional(),
  weekdayOpen: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM"),
  weekdayClose: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM"),
  sundayClosed: z.boolean(),
  heroHeadline: z.string().trim().optional(),
  aboutText: z.string().trim().optional(),
})
export type ClinicSettingsInput = z.infer<typeof clinicSettingsSchema>

export const faqSchema = z.object({
  question: z.string().trim().min(1, "Question is required"),
  answer: z.string().trim().min(1, "Answer is required"),
  displayOrder: z.coerce.number().int().default(0),
})
export type FaqInput = z.infer<typeof faqSchema>

export const reviewSchema = z.object({
  patientName: z.string().trim().min(1, "Name is required"),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(1, "Review text is required"),
  serviceId: z.string().optional(),
  published: z.boolean().default(false),
})
export type ReviewInput = z.infer<typeof reviewSchema>
