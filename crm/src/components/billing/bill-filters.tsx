"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { billTypeLabels, billStatusLabels, payerTypeLabels } from "@/lib/labels"

export function BillFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function pushParams(next: Record<string, string | null | undefined>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    params.delete("page")
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Select
        items={{ ALL: "All types", ...billTypeLabels }}
        value={searchParams.get("type") ?? "ALL"}
        onValueChange={(v) => pushParams({ type: v === "ALL" ? undefined : v })}
      >
        <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Bill type" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All types</SelectItem>
          {Object.entries(billTypeLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={{ ALL: "All statuses", ...billStatusLabels }}
        value={searchParams.get("status") ?? "ALL"}
        onValueChange={(v) => pushParams({ status: v === "ALL" ? undefined : v })}
      >
        <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All statuses</SelectItem>
          {Object.entries(billStatusLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={{ ALL: "All payers", ...payerTypeLabels }}
        value={searchParams.get("payerType") ?? "ALL"}
        onValueChange={(v) => pushParams({ payerType: v === "ALL" ? undefined : v })}
      >
        <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Payer" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All payers</SelectItem>
          {Object.entries(payerTypeLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
