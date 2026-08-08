"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { toPlain } from "@/lib/serialize"
import { meetingSchema, meetingStatusSchema, type MeetingInput, type MeetingStatusInput } from "@/lib/validations/hr"

export async function getMeetings(from?: Date, to?: Date) {
  const meetings = await prisma.meeting.findMany({
    where: from || to ? { startTime: { gte: from, lte: to } } : undefined,
    include: { organizer: true, attendees: { include: { user: true } } },
    orderBy: { startTime: "asc" },
  })
  return toPlain(meetings)
}

export async function createMeeting(input: MeetingInput) {
  const data = meetingSchema.parse(input)
  const user = await getCurrentUser()
  const start = new Date(data.startTime)
  const end = new Date(data.endTime)
  if (end <= start) throw new Error("End time must be after start time")

  const attendeeIds = Array.from(new Set([...data.attendeeIds, user.id]))
  const meeting = await prisma.meeting.create({
    data: {
      title: data.title,
      organizerId: user.id,
      startTime: start,
      endTime: end,
      location: data.location || null,
      meetingLink: data.meetingLink || null,
      notes: data.notes || null,
      attendees: { create: attendeeIds.map((userId) => ({ userId })) },
    },
  })
  revalidatePath("/hr/meetings")
  return toPlain(meeting)
}

export async function updateMeetingStatus(id: string, input: MeetingStatusInput) {
  const data = meetingStatusSchema.parse(input)
  const meeting = await prisma.meeting.update({ where: { id }, data })
  revalidatePath("/hr/meetings")
  return toPlain(meeting)
}

export async function respondToMeeting(meetingId: string, response: "ACCEPTED" | "DECLINED") {
  const user = await getCurrentUser()
  await prisma.meetingAttendee.update({
    where: { meetingId_userId: { meetingId, userId: user.id } },
    data: { response },
  })
  revalidatePath("/hr/meetings")
}
