"use client"

import { useState } from "react"
import { formatCurrency } from "@/lib/format"

export function TrendBars({ data }: { data: { date: string; revenue: number }[] }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const max = Math.max(...data.map((d) => d.revenue), 1)

  return (
    <div>
      <div className="flex items-end gap-1.5 h-40">
        {data.map((d, i) => {
          const heightPct = Math.max((d.revenue / max) * 100, d.revenue > 0 ? 3 : 0)
          return (
            <div
              key={d.date}
              className="relative flex-1 flex flex-col justify-end h-full group"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
            >
              {hovered === i && (
                <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background z-10">
                  {formatCurrency(d.revenue)}
                </div>
              )}
              <div
                className="w-full rounded-t-sm bg-[#2a78d6] transition-opacity group-hover:opacity-80"
                style={{ height: `${heightPct}%` }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-1.5 mt-1.5">
        {data.map((d, i) => (
          <div key={d.date} className="flex-1 text-center">
            {i % 2 === 0 && <span className="text-[10px] text-muted-foreground">{d.date}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
