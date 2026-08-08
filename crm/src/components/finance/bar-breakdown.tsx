import { formatCurrency } from "@/lib/format"

// Validated categorical palette, fixed order (see dataviz skill palette.md)
const CATEGORICAL = [
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#e87ba4", // magenta
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
]

export function BarBreakdown({
  title,
  data,
}: {
  title: string
  data: { label: string; value: number }[]
}) {
  const sorted = [...data].sort((a, b) => b.value - a.value).slice(0, 8)
  const max = Math.max(...sorted.map((d) => d.value), 1)

  if (sorted.length === 0) {
    return (
      <div>
        <p className="text-sm font-medium mb-3">{title}</p>
        <p className="text-sm text-muted-foreground">No data for this period.</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm font-medium mb-3">{title}</p>
      <div className="space-y-2.5">
        {sorted.map((d, i) => {
          const color = CATEGORICAL[i % CATEGORICAL.length]
          const widthPct = Math.max((d.value / max) * 100, 2)
          return (
            <div key={d.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{d.label}</span>
                <span className="tabular-nums text-muted-foreground">{formatCurrency(d.value)}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
