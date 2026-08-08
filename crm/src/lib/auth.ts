import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { serializeDecimal } from "@/lib/serialize"

/**
 * Placeholder identity layer.
 *
 * This project's real authentication system is built separately and is not
 * reproduced here. Every module that needs "who is acting" (registeredBy,
 * note author, message sender, doctor on an appointment, ...) calls
 * `getCurrentUser()` below. Swap this implementation for a call into the
 * real session/auth system — nothing downstream needs to change since
 * callers only depend on the returned `User` shape.
 */
export const getCurrentUser = cache(async () => {
  const user = await prisma.user.findFirst({
    where: { email: "admin@naazhospital.test" },
  })

  if (!user) {
    throw new Error(
      "No seeded staff user found. Run `npm run db:seed` to create the placeholder identity."
    )
  }

  return user
})

export async function getAllStaff() {
  const staff = await prisma.user.findMany({ orderBy: { name: "asc" } })
  return staff.map((s) => serializeDecimal(s, ["consultationFee"]))
}

export async function getDoctors() {
  const doctors = await prisma.user.findMany({
    where: { role: "DOCTOR", active: true },
    orderBy: { name: "asc" },
  })
  return doctors.map((d) => serializeDecimal(d, ["consultationFee"]))
}
