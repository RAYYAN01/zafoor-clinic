"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { commChannelLabels } from "@/lib/labels"

export function CommunicationsFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return (
    <Select
      items={{ ALL: "All channels", ...commChannelLabels }}
      value={searchParams.get("channel") ?? "ALL"}
      onValueChange={(value) => {
        const params = new URLSearchParams(searchParams.toString())
        if (!value || value === "ALL") params.delete("channel")
        else params.set("channel", value)
        router.push(`${pathname}?${params.toString()}`)
      }}
    >
      <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Channel" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">All channels</SelectItem>
        {Object.entries(commChannelLabels).map(([value, label]) => (
          <SelectItem key={value} value={value}>{label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
