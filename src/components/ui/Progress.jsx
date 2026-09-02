import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { EASE } from '@/lib/motion'

/** Usage meter. Turns amber then rose as the limit approaches. */
export function UsageMeter({ label, used, limit, unit = '', className }) {
  const pct = limit ? Math.min(100, (used / limit) * 100) : 0
  const tone = pct >= 90 ? 'bg-danger' : pct >= 70 ? 'bg-warn' : 'bg-brand-gradient'

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[13px] font-medium text-ink">{label}</p>
        <p className="numeric text-[12.5px] text-muted">
          {used.toLocaleString()} <span className="text-faint">/ {limit.toLocaleString()} {unit}</span>
        </p>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[rgb(var(--c-hairline)/0.09)]">
        <motion.div
          className={cn('h-full rounded-full', tone)}
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: EASE }}
        />
      </div>
    </div>
  )
}

/** Circular progress used by the CSV upload flow. */
export function ProgressRing({ value = 0, size = 64, stroke = 5, className }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(100, value) / 100) * circumference

  return (
    <div className={cn('relative grid place-items-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(var(--c-hairline) / 0.12)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(var(--c-brand))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        />
      </svg>
      <span className="numeric absolute text-[12.5px] font-semibold text-ink">
        {Math.round(value)}%
      </span>
    </div>
  )
}

export default UsageMeter
