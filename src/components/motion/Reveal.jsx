import { motion, useReducedMotion } from 'framer-motion'
import { EASE } from '@/lib/motion'

const DIRECTIONS = {
  up: { y: 24, x: 0 },
  down: { y: -24, x: 0 },
  left: { x: 24, y: 0 },
  right: { x: -24, y: 0 },
  none: { x: 0, y: 0 },
}

/**
 * Reveals its children once, the first time they scroll into view.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  duration = 0.65,
  direction = 'up',
  amount = 0.25,
  as = 'div',
}) {
  const reduce = useReducedMotion()
  const offset = DIRECTIONS[direction] ?? DIRECTIONS.up
  const MotionTag = motion[as] ?? motion.div

  return (
    <MotionTag
      className={className}
      initial={reduce ? { opacity: 1 } : { opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: reduce ? 0 : duration, delay: reduce ? 0 : delay, ease: EASE }}
    >
      {children}
    </MotionTag>
  )
}

export default Reveal
