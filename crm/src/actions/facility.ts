"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { toPlain } from "@/lib/serialize"
import { generateTicketNumber } from "@/lib/sequence"
import {
  facilityTicketSchema,
  ticketStatusSchema,
  type FacilityTicketInput,
  type TicketStatusInput,
} from "@/lib/validations/operations"

export async function getFacilityTickets(category?: string) {
  const tickets = await prisma.facilityTicket.findMany({
    where: category ? { category: category as never } : undefined,
    include: { equipment: true, reportedBy: true, assignedTo: true },
    orderBy: [{ status: "asc" }, { reportedAt: "desc" }],
  })
  return toPlain(tickets)
}

export async function createFacilityTicket(input: FacilityTicketInput) {
  const data = facilityTicketSchema.parse(input)
  const user = await getCurrentUser()

  const ticket = await prisma.$transaction(async (tx) => {
    const ticketNumber = await generateTicketNumber(tx)
    return tx.facilityTicket.create({
      data: {
        ticketNumber,
        category: data.category,
        title: data.title,
        description: data.description || null,
        location: data.location || null,
        equipmentId: data.equipmentId || null,
        priority: data.priority,
        assignedToId: data.assignedToId || null,
        reportedById: user.id,
      },
    })
  })

  revalidatePath("/operations/facility")
  return toPlain(ticket)
}

export async function updateTicketStatus(id: string, input: TicketStatusInput) {
  const data = ticketStatusSchema.parse(input)
  const ticket = await prisma.facilityTicket.update({
    where: { id },
    data: {
      status: data.status,
      assignedToId: data.assignedToId || undefined,
      notes: data.notes || undefined,
      resolvedAt: data.status === "RESOLVED" || data.status === "CLOSED" ? new Date() : null,
    },
  })
  revalidatePath("/operations/facility")
  return toPlain(ticket)
}
