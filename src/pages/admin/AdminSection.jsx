import { motion } from 'framer-motion'
import { EASE } from '@/lib/motion'
import { cn } from '@/lib/cn'

/**
 * Shared shell for every admin section: the animated page wrapper plus a
 * consistent title block. Keeps the four sections visually identical.
 */
export function AdminSection({ title, description, action, children, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.18 } }}
      transition={{ duration: 0.32, ease: EASE }}
      className={cn('space-y-6', className)}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-[-0.025em] text-ink">
            {title}
          </h1>
          {description && <p className="mt-1.5 text-[13.5px] text-muted">{description}</p>}
        </div>
        {action}
      </div>

      {children}
    </motion.div>
  )
}

export default AdminSection
