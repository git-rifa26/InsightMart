import { cn } from '@/lib/cn'

/**
 * Glass tooltip shared by every chart, so hover feedback is consistent.
 * `format` maps a series value to its display string.
 */
export function ChartTooltip({ active, payload, label, format = (v) => v, labelSuffix }) {
  if (!active || !payload?.length) return null

  return (
    <div className="glass rim min-w-[9rem] rounded-xl px-3 py-2.5 shadow-lift">
      <p className="text-[11.5px] font-medium uppercase tracking-[0.06em] text-faint">
        {label}
        {labelSuffix ? ` ${labelSuffix}` : ''}
      </p>
      <div className="mt-2 space-y-1.5">
        {payload.map((entry) => (
          <div key={entry.dataKey ?? entry.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-[12.5px] text-muted">
              <span
                className="h-2 w-2 shrink-0 rounded-[3px]"
                style={{ background: entry.color ?? entry.payload?.fill }}
              />
              {entry.name}
            </span>
            <span className="numeric text-[12.5px] font-semibold text-ink">
              {format(entry.value, entry)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Legend rendered as chips rather than Recharts' default text row. */
export function ChartLegend({ payload, className }) {
  if (!payload?.length) return null
  return (
    <div className={cn('mt-3 flex flex-wrap items-center gap-x-4 gap-y-2', className)}>
      {payload.map((entry) => (
        <span key={entry.value} className="flex items-center gap-1.5 text-[12px] text-muted">
          <span className="h-2 w-2 rounded-[3px]" style={{ background: entry.color }} />
          {entry.value}
        </span>
      ))}
    </div>
  )
}

export default ChartTooltip
