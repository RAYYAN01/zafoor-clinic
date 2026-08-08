"use server"

import { prisma } from "@/lib/prisma"
import { toPlain } from "@/lib/serialize"

export async function getOperationsDashboard() {
  const [
    beds,
    icuAdmissions,
    otToday,
    emergencyWaiting,
    emergencyInTreatment,
    labPending,
    radiologyPending,
    lowStockMedicines,
    openTickets,
    ambulancesAvailable,
    expiringSoonCount,
  ] = await Promise.all([
    prisma.bed.findMany(),
    prisma.admission.count({ where: { status: "ADMITTED", bed: { type: "ICU" } } }),
    prisma.surgery.findMany({
      where: {
        scheduledStart: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        scheduledEnd: { lte: new Date(new Date().setHours(23, 59, 59, 999)) },
      },
      include: { patient: true, surgeon: true, ot: true },
      orderBy: { scheduledStart: "asc" },
    }),
    prisma.emergencyCase.count({ where: { status: "WAITING" } }),
    prisma.emergencyCase.count({ where: { status: "IN_TREATMENT" } }),
    prisma.labOrder.count({ where: { status: { in: ["ORDERED", "SAMPLE_COLLECTED", "IN_LAB"] } } }),
    prisma.radiologyOrder.count({ where: { status: { in: ["ORDERED", "SCHEDULED", "IN_PROGRESS"] } } }),
    prisma.medicine.findMany({ include: { batches: true } }),
    prisma.facilityTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.ambulance.count({ where: { status: "AVAILABLE" } }),
    prisma.medicineBatch.count({
      where: { expiryDate: { lte: new Date(new Date().setDate(new Date().getDate() + 60)) }, quantity: { gt: 0 } },
    }),
  ])

  const totalBeds = beds.length
  const occupiedBeds = beds.filter((b) => b.status === "OCCUPIED").length
  const icuBeds = beds.filter((b) => b.type === "ICU")
  const icuOccupied = icuBeds.filter((b) => b.status === "OCCUPIED").length

  const lowStock = lowStockMedicines.filter(
    (m) => m.batches.reduce((sum, b) => sum + b.quantity, 0) <= m.reorderLevel
  ).length

  return toPlain({
    bedOccupancy: {
      total: totalBeds,
      occupied: occupiedBeds,
      rate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
    },
    icuOccupancy: {
      total: icuBeds.length,
      occupied: icuOccupied,
      rate: icuBeds.length > 0 ? Math.round((icuOccupied / icuBeds.length) * 100) : 0,
    },
    icuAdmissions,
    otToday,
    emergencyWaiting,
    emergencyInTreatment,
    labPending,
    radiologyPending,
    lowStockMedicines: lowStock,
    expiringSoonCount,
    openTickets,
    ambulancesAvailable,
  })
}
