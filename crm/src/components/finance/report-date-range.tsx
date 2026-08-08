"use client"

import { useRouter, usePathname } from "next/navigation"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"

export function ReportDateRange({ from, to }: { from: Date; to: Date }) {
  const router = useRouter()
  const pathname = usePathname()

  function update(next: { from?: string; to?: string }) {
    const params = new URLSearchParams()
    params.set("from", next.from ?? format(from, "yyyy-MM-dd"))
    params.set("to", next.to ?? format(to, "yyyy-MM-dd"))
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Input type="date" defaultValue={format(from, "yyyy-MM-dd")} onChange={(e) => update({ from: e.target.value })} className="w-40" />
      <span className="text-muted-foreground text-sm">to</span>
      <Input type="date" defaultValue={format(to, "yyyy-MM-dd")} onChange={(e) => update({ to: e.target.value })} className="w-40" />
    </div>
  )
}
