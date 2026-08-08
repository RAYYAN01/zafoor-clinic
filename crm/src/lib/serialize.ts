import { Decimal } from "@/generated/prisma/internal/prismaNamespace"

type WithDecimal<T, K extends keyof T> = Omit<T, K> & { [P in K]: number | null }

export function serializeDecimal<T, K extends keyof T>(
  record: T,
  keys: K[]
): WithDecimal<T, K> {
  const result = { ...record } as WithDecimal<T, K>
  for (const key of keys) {
    const value = record[key] as unknown as Decimal | null
    ;(result as Record<string, unknown>)[key as string] = value == null ? null : Number(value)
  }
  return result
}

/**
 * Deep-walks a value and converts any Prisma `Decimal` instance to a plain
 * number, recursing through arrays and nested objects (and Date is left
 * untouched — it crosses the server/client boundary natively). Use this for
 * query results with many/nested Decimal fields (billing, finance) instead
 * of hand-listing keys with `serializeDecimal`.
 */
export function toPlain<T>(value: T): T {
  if (value instanceof Decimal) return Number(value) as unknown as T
  if (value instanceof Date) return value
  if (Array.isArray(value)) return value.map((v) => toPlain(v)) as unknown as T
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) out[k] = toPlain(v)
    return out as T
  }
  return value
}
