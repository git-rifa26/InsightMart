import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/cn'

const ORBS = [
  {
    className: 'left-[-14%] top-[-18%] h-[38rem] w-[38rem]',
    color: 'rgb(var(--c-brand))',
    drift: { x: [0, 70, -30, 0], y: [0, 50, 20, 0] },
    duration: 22,
  },
  {
    className: 'right-[-12%] top-[-6%] h-[34rem] w-[34rem]',
    color: 'rgb(var(--c-violet))',
    drift: { x: [0, -60, 30, 0], y: [0, 40, -30, 0] },
    duration: 26,
  },
  {
    className: 'left-[32%] bottom-[-28%] h-[32rem] w-[32rem]',
    color: 'rgb(var(--c-cyan))',
    drift: { x: [0, 45, -55, 0], y: [0, -35, 25, 0] },
    duration: 19,
  },
]

/**
 * Slow-drifting blurred colour fields. Purely decorative, never interactive.
 */
export function AuroraBackground({ className, intensity = 1 }) {
  const reduce = useReducedMotion()

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden="true">
      {ORBS.map((orb, i) => (
        <motion.div
          key={i}
          className={cn('absolute rounded-full blur-[110px]', orb.className)}
          style={{
            background: orb.color,
            opacity: `calc(var(--aurora-alpha) * ${intensity})`,
            willChange: 'transform',
          }}
          animate={reduce ? undefined : orb.drift}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            repeatType: 'mirror',
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

export default AuroraBackground
