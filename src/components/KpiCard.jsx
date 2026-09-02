import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

import { Spotlight, CountUp } from '@/components/motion'
import { Sparkline } from '@/components/charts'
import { Skeleton } from '@/components/ui/Skeleton'
import { delta as formatDelta } from '@/lib/formatters'
import { cn } from '@/lib/cn'
import { EASE } from '@/lib/motion'

/**
 * A single headline metric: animated value, period-on-period delta, and an
 * optional sparkline showing the shape behind the number.
 */
export function KpiCard({
  label,
  value,
  format = (v) => v.toLocaleString(),
  delta,
  icon: Icon,
  trend,
  decimals = 0,
  index = 0,
  loading = false,
  hint,
}) {
  if (loading) {
    return (
      <div className="glass rim space-y-3 rounded-2xl p-5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-16" />
      </div>
    )
  }

  const positive = delta == null || delta >= 0
  const DeltaIcon = positive ? ArrowUpRight : ArrowDownRight

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE, delay: index * 0.07 }}
    >
      <Spotlight className="glass rim h-full rounded-2xl p-5 transition-transform duration-500 ease-expo hover:-translate-y-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase leading-tight tracking-[0.06em] text-faint">
              {label}
            </p>
            <p className="mt-2 font-display text-[26px] font-semibold leading-none tracking-[-0.025em] text-ink">
              <CountUp value={value} format={format} decimals={decimals} delay={index * 0.07} />
            </p>
          </div>

          {Icon && (
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[rgb(var(--c-brand)/0.12)] text-brand">
              <Icon className="h-[17px] w-[17px]" strokeWidth={1.9} />
            </span>
          )}
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            {delta != null && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11.5px] font-medium',
                  positive
                    ? 'bg-[rgb(var(--c-success)/0.13)] text-success'
                    : 'bg-[rgb(var(--c-danger)/0.13)] text-danger',
                )}
              >
                <DeltaIcon className="h-3 w-3" strokeWidth={2.4} />
                {formatDelta(Math.abs(delta))}
              </span>
            )}
            <p className="mt-1.5 text-[11.5px] text-faint">{hint ?? 'vs previous period'}</p>
          </div>

          {trend?.length > 0 && (
            <div className="h-10 w-24 shrink-0 opacity-80">
              <Sparkline data={trend} />
            </div>
          )}
        </div>
      </Spotlight>
    </motion.div>
  )
}

export default KpiCard
