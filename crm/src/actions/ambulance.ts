"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { toPlain } from "@/lib/serialize"
import {
  ambulanceSchema,
  ambulanceTripSchema,
  tripStatusSchema,
  type AmbulanceInput,
  type AmbulanceTripInput,
  type TripStatusInput,
} from "@/lib/validations/operations"

export async function getAmbulances() {
  const ambulances = await prisma.ambulance.findMany({
    include: {
      trips: {
        where: { status: { in: ["REQUESTED", "DISPATCHED"] } },
        orderBy: { requestedAt: "desc" },
        take: 1,
      },
    },
    orderBy: { vehicleNumber: "asc" },
  })
  return toPlain(ambulances)
}

export async function createAmbulance(input: AmbulanceInput) {
  const data = ambulanceSchema.parse(input)
  const ambulance = await prisma.ambulance.create({ data })
  revalidatePath("/operations/ambulance")
  return toPlain(ambulance)
}

export async function deleteAmbulance(id: string) {
  await prisma.ambulance.delete({ where: { id } })
  revalidatePath("/operations/ambulance")
}

export async function getAmbulanceTrips() {
  const trips = await prisma.ambulanceTrip.findMany({
    include: { ambulance: true, patient: true },
    orderBy: { requestedAt: "desc" },
    take: 50,
  })
  return toPlain(trips)
}

export async function requestAmbulanceTrip(input: AmbulanceTripInput) {
  const data = ambulanceTripSchema.parse(input)
  const ambulance = await prisma.ambulance.findUniqueOrThrow({ where: { id: data.ambulanceId } })
  if (ambulance.status !== "AVAILABLE") throw new Error("Ambulance is not available")

  const trip = await prisma.ambulanceTrip.create({
    data: {
      ambulanceId: data.ambulanceId,
      patientId: data.patientId || null,
      purpose: data.purpose,
      pickupLocation: data.pickupLocation || null,
      dropLocation: data.dropLocation || null,
      notes: data.notes || null,
    },
  })
  revalidatePath("/operations/ambulance")
  return toPlain(trip)
}

export async function updateTripStatus(id: string, input: TripStatusInput) {
  const data = tripStatusSchema.parse(input)

  await prisma.$transaction(async (tx) => {
    const trip = await tx.ambulanceTrip.update({
      where: { id },
      data: {
        status: data.status,
        dispatchedAt: data.status === "DISPATCHED" ? new Date() : undefined,
        completedAt: data.status === "COMPLETED" ? new Date() : undefined,
      },
    })

    if (data.status === "DISPATCHED") {
      await tx.ambulance.update({ where: { id: trip.ambulanceId }, data: { status: "ON_TRIP" } })
    } else if (data.status === "COMPLETED" || data.status === "CANCELLED") {
      await tx.ambulance.update({ where: { id: trip.ambulanceId }, data: { status: "AVAILABLE" } })
    }
  })

  revalidatePath("/operations/ambulance")
}
