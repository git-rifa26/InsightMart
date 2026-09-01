import { motion, useReducedMotion } from 'framer-motion'
import { EASE } from '@/lib/motion'

/** Parent that releases its <StaggerItem> children in sequence on scroll. */
export function Stagger({ children, className, stagger = 0.07, delay = 0.05, amount = 0.2, as = 'div' }) {
  const reduce = useReducedMotion()
  const MotionTag = motion[as] ?? motion.div

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: reduce ? 0 : stagger,
            delayChildren: reduce ? 0 : delay,
          },
        },
      }}
    >
      {children}
    </MotionTag>
  )
}

export function StaggerItem({ children, className, y = 20, as = 'div', ...rest }) {
  const reduce = useReducedMotion()
  const MotionTag = motion[as] ?? motion.div

  return (
    <MotionTag
      className={className}
      variants={{
        hidden: reduce ? { opacity: 1 } : { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.6, ease: EASE } },
      }}
      {...rest}
    >
      {children}
    </MotionTag>
  )
}

export default Stagger
