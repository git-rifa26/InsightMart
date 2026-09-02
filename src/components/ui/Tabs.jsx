import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'

/**
 * Segmented control with a shared-layout pill that slides to the active item.
 */
export function SegmentedTabs({ items, value, onChange, className, size = 'md', layoutId = 'segmented' }) {
  const pad = size === 'sm' ? 'px-3 py-1.5 text-[12.5px]' : 'px-4 py-2 text-[13px]'

  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-1 rounded-xl border border-[rgb(var(--c-hairline)/0.1)] bg-[rgb(var(--c-hairline)/0.045)] p-1',
        className,
      )}
    >
      {items.map((item) => {
        const active = item.id === value
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              'relative rounded-lg font-medium transition-colors duration-200',
              pad,
              active ? 'text-ink' : 'text-muted hover:text-ink',
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-lg bg-[rgb(var(--c-surface))] shadow-soft"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {item.icon && <item.icon className="h-3.5 w-3.5" strokeWidth={2} />}
              {item.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/** Underlined tab row used for page-level sections. */
export function UnderlineTabs({ items, value, onChange, className, layoutId = 'underline' }) {
  return (
    <div className={cn('flex items-center gap-1 border-b border-[rgb(var(--c-hairline)/0.1)]', className)}>
      {items.map((item) => {
        const active = item.id === value
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              'relative px-4 pb-3 pt-2 text-sm font-medium transition-colors duration-200',
              active ? 'text-ink' : 'text-muted hover:text-ink',
            )}
          >
            <span className="flex items-center gap-2">
              {item.icon && <item.icon className="h-4 w-4" strokeWidth={1.9} />}
              {item.label}
            </span>
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-gradient"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

export default SegmentedTabs
