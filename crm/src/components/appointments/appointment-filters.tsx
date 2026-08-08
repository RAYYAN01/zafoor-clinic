"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { appointmentStatusLabels } from "@/lib/labels"

type Doctor = { id: string; name: string; specialization: string | null }

export function AppointmentFilters({ doctors }: { doctors: Doctor[] }) {
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

  const hasFilters = searchParams.get("doctorId") || searchParams.get("status") || searchParams.get("date")

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input
        type="date"
        value={searchParams.get("date") ?? ""}
        onChange={(e) => pushParams({ date: e.target.value })}
        className="w-full sm:w-44"
      />

      <Select
        items={{
          ALL: "All doctors",
          ...Object.fromEntries(doctors.map((d) => [d.id, `Dr. ${d.name}${d.specialization ? ` — ${d.specialization}` : ""}`])),
        }}
        value={searchParams.get("doctorId") ?? "ALL"}
        onValueChange={(value) => pushParams({ doctorId: value === "ALL" ? undefined : value })}
      >
        <SelectTrigger className="w-full sm:w-56">
          <SelectValue placeholder="Doctor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All doctors</SelectItem>
          {doctors.map((doc) => (
            <SelectItem key={doc.id} value={doc.id}>
              Dr. {doc.name}{doc.specialization ? ` — ${doc.specialization}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={{ ALL: "All statuses", ...appointmentStatusLabels }}
        value={searchParams.get("status") ?? "ALL"}
        onValueChange={(value) => pushParams({ status: value === "ALL" ? undefined : value })}
      >
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All statuses</SelectItem>
          {Object.entries(appointmentStatusLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
          Clear filters
        </Button>
      )}
    </div>
  )
}
