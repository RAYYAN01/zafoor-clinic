"use server"

import { prisma } from "@/lib/prisma"
import { parseSmartQuery, normalizeBloodGroup } from "@/lib/smart-query"

export async function globalSearch(rawQuery: string) {
  const parsed = parseSmartQuery(rawQuery)
  const where: Record<string, unknown> = {}
  const AND: Record<string, unknown>[] = []

  if (parsed.tag) {
    AND.push({ tags: { some: { tag: { name: { equals: parsed.tag, mode: "insensitive" } } } } })
  }
  if (parsed.blood) {
    AND.push({ bloodGroup: normalizeBloodGroup(parsed.blood) })
  }
  if (parsed.status) {
    AND.push({ status: parsed.status.toUpperCase() })
  }

  if (parsed.text) {
    const digitsOnly = /^\d{4,}$/.test(parsed.text)
    const looksLikeUhid = /^nh-?/i.test(parsed.text)

    if (digitsOnly) {
      AND.push({ phone: { contains: parsed.text } })
    } else if (looksLikeUhid) {
      AND.push({ uhid: { contains: parsed.text.replace(/\s/g, ""), mode: "insensitive" } })
    } else {
      AND.push({
        OR: [
          { firstName: { contains: parsed.text, mode: "insensitive" } },
          { lastName: { contains: parsed.text, mode: "insensitive" } },
          { uhid: { contains: parsed.text, mode: "insensitive" } },
          { phone: { contains: parsed.text } },
          { email: { contains: parsed.text, mode: "insensitive" } },
        ],
      })
    }
  }

  if (AND.length > 0) where.AND = AND

  const patients = await prisma.patient.findMany({
    where,
    include: { tags: { include: { tag: true } } },
    orderBy: { createdAt: "desc" },
    take: 25,
  })

  return { parsed, patients }
}
