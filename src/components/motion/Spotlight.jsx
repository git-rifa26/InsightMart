import { motion, useMotionTemplate } from 'framer-motion'
import { usePointer } from '@/hooks/useMousePosition'
import { cn } from '@/lib/cn'

/**
 * Wraps a surface so a soft radial highlight follows the cursor across it.
 * The highlight sits above the background but below the content.
 */
export function Spotlight({ children, className, size = 340, color = 'var(--c-brand)', as = 'div' }) {
  const { ref, px, py, onMouseMove, onMouseLeave } = usePointer()
  const background = useMotionTemplate`radial-gradient(${size}px circle at ${px}px ${py}px, rgb(${color} / 0.16), transparent 72%)`
  const MotionTag = motion[as] ?? motion.div

  return (
    <MotionTag
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={cn('group relative overflow-hidden', className)}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background }}
      />
      <div className="relative">{children}</div>
    </MotionTag>
  )
}

export default Spotlight
