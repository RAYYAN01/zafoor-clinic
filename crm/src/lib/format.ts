import { format, formatDistanceToNow, differenceInYears } from "date-fns"

export function formatDate(date: Date | string | null | undefined, pattern = "dd MMM yyyy") {
  if (!date) return "—"
  return format(new Date(date), pattern)
}

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return "—"
  return format(new Date(date), "dd MMM yyyy, hh:mm a")
}

export function formatTime(date: Date | string | null | undefined) {
  if (!date) return "—"
  return format(new Date(date), "hh:mm a")
}

export function formatRelative(date: Date | string | null | undefined) {
  if (!date) return "—"
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function calculateAge(dob: Date | string | null | undefined) {
  if (!dob) return null
  return differenceInYears(new Date(), new Date(dob))
}

export function formatCurrency(amount: number | string | null | undefined) {
  const value = Number(amount ?? 0)
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

export function patientDisplayName(patient: { firstName: string; lastName?: string | null }) {
  return [patient.firstName, patient.lastName].filter(Boolean).join(" ")
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")
}
