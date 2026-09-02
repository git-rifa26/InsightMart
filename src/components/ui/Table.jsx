import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { EASE } from '@/lib/motion'

/**
 * Table shell. Always scrolls inside its own container so a wide table can
 * never push the page sideways.
 */
export function Table({ children, className }) {
  return (
    <div className={cn('-mx-1 overflow-x-auto px-1', className)}>
      <table className="w-full min-w-[34rem] border-collapse text-left">{children}</table>
    </div>
  )
}

export function THead({ columns }) {
  return (
    <thead>
      <tr className="border-b border-[rgb(var(--c-hairline)/0.1)]">
        {columns.map((column) => (
          <th
            key={column.key ?? column.label}
            scope="col"
            className={cn(
              'whitespace-nowrap px-3 pb-2.5 text-[11.5px] font-semibold uppercase tracking-[0.07em] text-faint',
              column.align === 'right' && 'text-right',
              column.align === 'center' && 'text-center',
              column.className,
            )}
          >
            {column.label}
          </th>
        ))}
      </tr>
    </thead>
  )
}

/** Row that fades in on mount and lifts its background on hover. */
export function TRow({ children, index = 0, onClick, className }) {
  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.32, ease: EASE, delay: Math.min(index * 0.035, 0.4) }}
      onClick={onClick}
      className={cn(
        'group border-b border-[rgb(var(--c-hairline)/0.06)] transition-colors duration-200',
        'hover:bg-[rgb(var(--c-hairline)/0.04)]',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </motion.tr>
  )
}

export function TCell({ children, align, className, numeric = false, muted = false }) {
  return (
    <td
      className={cn(
        'px-3 py-3 text-[13px] text-ink',
        numeric && 'numeric font-medium',
        muted && 'text-muted',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
    >
      {children}
    </td>
  )
}

/** Horizontal bar drawn inside a cell to make magnitudes comparable. */
export function CellBar({ value, max, tone = 'brand' }) {
  const pct = max ? Math.max(2, (value / max) * 100) : 0
  const colors = {
    brand: 'bg-brand-gradient',
    success: 'bg-success',
    warn: 'bg-warn',
    danger: 'bg-danger',
  }

  return (
    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-[rgb(var(--c-hairline)/0.09)]">
      <motion.span
        className={cn('block h-full rounded-full', colors[tone])}
        initial={{ width: 0 }}
        whileInView={{ width: `${pct}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: EASE }}
      />
    </span>
  )
}

export default Table
