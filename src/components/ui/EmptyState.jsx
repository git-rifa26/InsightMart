import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { EASE } from '@/lib/motion'

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className={cn('grid place-items-center px-6 py-14 text-center', className)}
    >
      {Icon && (
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[rgb(var(--c-hairline)/0.06)] text-faint">
          <Icon className="h-5 w-5" strokeWidth={1.7} />
        </span>
      )}
      <p className="mt-4 text-[15px] font-semibold text-ink">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  )
}

export default EmptyState
