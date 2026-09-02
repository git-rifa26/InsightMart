import { motion } from 'framer-motion'

import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { EASE } from '@/lib/motion'

// iuytfdfghjkl

/**
 * Frame around a chart: title, optional description and toolbar, and a
 * skeleton while the data resolves. Charts themselves stay presentational.
 */
export function ChartCard({
  title,
  description,
  action,
  children,
  className,
  icon: Icon,
  loading = false,
  index = 0,
  footer,
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55, ease: EASE, delay: index * 0.06 }}
      className={cn('glass rim rounded-2xl p-5 sm:p-6', className)}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {Icon && (
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[rgb(var(--c-brand)/0.12)] text-brand">
              <Icon className="h-[17px] w-[17px]" strokeWidth={1.9} />
            </span>
          )}
          <div>
            <h3 className="text-[15px] font-semibold leading-tight text-ink">{title}</h3>
            {description && (
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{description}</p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-[220px] w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ) : (
        children
      )}

      {footer && !loading && (
        <div className="mt-4 border-t border-[rgb(var(--c-hairline)/0.09)] pt-4">{footer}</div>
      )}
    </motion.section>
  )
}

export default ChartCard
