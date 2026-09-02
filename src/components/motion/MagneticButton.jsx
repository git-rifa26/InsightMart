import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/cn'

/**
 * A button that leans toward the cursor and springs back on leave.
 * Renders whatever element `as` names so it can be a link or a button.
 */
export function MagneticButton({ children, className, strength = 0.28, as: Tag = 'button', ...rest }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 260, damping: 18, mass: 0.6 })
  const sy = useSpring(y, { stiffness: 260, damping: 18, mass: 0.6 })

  const MotionTag = motion(Tag)

  const handleMove = (event) => {
    if (reduce) return
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    x.set((event.clientX - (rect.left + rect.width / 2)) * strength)
    y.set((event.clientY - (rect.top + rect.height / 2)) * strength)
  }

  const reset = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <MotionTag
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={reduce ? undefined : { x: sx, y: sy }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={cn('relative', className)}
      {...rest}
    >
      {children}
    </MotionTag>
  )
}

export default MagneticButton
