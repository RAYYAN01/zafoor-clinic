"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { followUpStatusLabels } from "@/lib/labels"

type Staff = { id: string; name: string }

export function FollowUpsFilters({ staff }: { staff: Staff[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function pushParams(next: Record<string, string | null | undefined>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Select
        items={{ ALL: "All statuses", ...followUpStatusLabels }}
        value={searchParams.get("status") ?? "ALL"}
        onValueChange={(value) => pushParams({ status: value === "ALL" ? undefined : value })}
      >
        <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All statuses</SelectItem>
          {Object.entries(followUpStatusLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={{ ALL: "Everyone", ...Object.fromEntries(staff.map((s) => [s.id, s.name])) }}
        value={searchParams.get("assignedToId") ?? "ALL"}
        onValueChange={(value) => pushParams({ assignedToId: value === "ALL" ? undefined : value })}
      >
        <SelectTrigger className="w-full sm:w-52"><SelectValue placeholder="Assigned to" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Everyone</SelectItem>
          {staff.map((s) => (
            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
