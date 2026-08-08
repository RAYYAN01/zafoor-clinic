"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { toPlain } from "@/lib/serialize"
import { chatChannelSchema, chatMessageSchema, type ChatChannelInput, type ChatMessageInput } from "@/lib/validations/hr"

export async function getChatChannels() {
  const user = await getCurrentUser()
  const channels = await prisma.chatChannel.findMany({
    where: { members: { some: { userId: user.id } } },
    include: { members: { include: { user: true } }, _count: { select: { messages: true } } },
    orderBy: { createdAt: "asc" },
  })
  return toPlain(channels)
}

export async function createChatChannel(input: ChatChannelInput) {
  const data = chatChannelSchema.parse(input)
  const user = await getCurrentUser()
  const memberIds = Array.from(new Set([...data.memberIds, user.id]))

  const channel = await prisma.chatChannel.create({
    data: {
      name: data.name,
      members: { create: memberIds.map((userId) => ({ userId })) },
    },
  })
  revalidatePath("/hr/chat")
  return toPlain(channel)
}

export async function getChatMessages(channelId: string) {
  const messages = await prisma.chatMessage.findMany({
    where: { channelId },
    include: { sender: true },
    orderBy: { sentAt: "asc" },
    take: 200,
  })
  return toPlain(messages)
}

export async function sendChatMessage(channelId: string, input: ChatMessageInput) {
  const data = chatMessageSchema.parse(input)
  const user = await getCurrentUser()
  const message = await prisma.chatMessage.create({
    data: { channelId, senderId: user.id, body: data.body },
  })
  revalidatePath("/hr/chat")
  return toPlain(message)
}
