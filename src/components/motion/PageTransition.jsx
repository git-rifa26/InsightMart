import { motion, useReducedMotion } from 'framer-motion'
import { pageVariants } from '@/lib/motion'
import { cn } from '@/lib/cn'

/** Wraps a route so it fades and rises in, and leaves cleanly. */
export function PageTransition({ children, className }) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      variants={reduce ? undefined : pageVariants}
      initial={reduce ? false : 'initial'}
      animate="animate"
      exit={reduce ? undefined : 'exit'}
      className={cn('min-h-0', className)}
    >
      {children}
    </motion.div>
  )
}

export default PageTransition
