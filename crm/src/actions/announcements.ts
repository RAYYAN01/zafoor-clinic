"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { toPlain } from "@/lib/serialize"
import { announcementSchema, type AnnouncementInput } from "@/lib/validations/hr"

export async function getAnnouncements() {
  const announcements = await prisma.announcement.findMany({
    include: { postedBy: true },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  })
  return toPlain(announcements)
}

export async function createAnnouncement(input: AnnouncementInput) {
  const data = announcementSchema.parse(input)
  const user = await getCurrentUser()
  const announcement = await prisma.announcement.create({
    data: { ...data, departmentId: data.audience === "DEPARTMENT" ? data.departmentId || null : null, postedById: user.id },
  })
  revalidatePath("/hr/announcements")
  return toPlain(announcement)
}

export async function deleteAnnouncement(id: string) {
  await prisma.announcement.delete({ where: { id } })
  revalidatePath("/hr/announcements")
}
