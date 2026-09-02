import { motion, useReducedMotion } from 'framer-motion'
import { TrendingUp, ArrowUpRight } from 'lucide-react'

import CountUp from '@/components/motion/CountUp'
import { currencyCompact } from '@/lib/formatters'
import { EASE } from '@/lib/motion'
import { cn } from '@/lib/cn'

// Hand-tuned so the curve reads as a believable upward sales trend.
const SERIES = [28, 34, 30, 42, 47, 44, 58, 63, 61, 74, 82, 96]
const BARS = [44, 62, 38, 78, 55, 88, 70]

const W = 320
const H = 96

/** Builds a smooth path through the series using midpoint curves. */
function buildPath(points, width, height) {
  const max = Math.max(...points)
  const min = Math.min(...points)
  const span = max - min || 1
  const step = width / (points.length - 1)

  const coords = points.map((value, i) => [i * step, height - ((value - min) / span) * (height - 12) - 6])

  return coords.reduce((path, [x, y], i) => {
    if (i === 0) return `M ${x} ${y}`
    const [px, py] = coords[i - 1]
    const cx = (px + x) / 2
    return `${path} C ${cx} ${py}, ${cx} ${y}, ${x} ${y}`
  }, '')
}

const LINE_PATH = buildPath(SERIES, W, H)
const AREA_PATH = `${LINE_PATH} L ${W} ${H} L 0 ${H} Z`

const KPIS = [
  { label: 'Revenue', value: 4820000, format: (v) => currencyCompact(v), delta: '+18.4%' },
  { label: 'Orders', value: 1284, format: (v) => Math.round(v).toLocaleString('en-IN'), delta: '+9.2%' },
  { label: 'Margin', value: 32.6, format: (v) => `${v.toFixed(1)}%`, delta: '+3.4%', decimals: 1 },
]

/**
 * The product window shown beside the hero copy. Everything inside is real
 * DOM and SVG rather than a screenshot, so it stays crisp, themes correctly
 * and costs nothing to load.
 */
export function HeroMockup({ className }) {
  const reduce = useReducedMotion()

  return (
    <div className={cn('relative', className)}>
      {/* Glow that sits behind the panel */}
      <div
        aria-hidden="true"
        className="absolute -inset-8 rounded-[2.5rem] bg-brand-gradient opacity-[0.16] blur-3xl"
      />

      <motion.div
        initial={reduce ? { opacity: 1 } : { opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.35 }}
        className="glass rim relative overflow-hidden rounded-2xl shadow-lift"
      >
        {/* Window chrome */}
        <div className="flex items-center gap-3 border-b border-[rgb(var(--c-hairline)/0.09)] px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[rgb(var(--c-danger)/0.55)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[rgb(var(--c-warn)/0.55)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[rgb(var(--c-success)/0.55)]" />
          </div>
          <div className="flex-1 rounded-md bg-[rgb(var(--c-hairline)/0.06)] px-3 py-1 text-center font-mono text-[10.5px] text-faint">
            insightmart.app / dashboard
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          {/* KPI strip */}
          <div className="grid grid-cols-3 gap-2.5">
            {KPIS.map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={reduce ? { opacity: 1 } : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.6 + i * 0.08 }}
                className="rounded-xl border border-[rgb(var(--c-hairline)/0.08)] bg-[rgb(var(--c-hairline)/0.035)] p-3"
              >
                <p className="text-[10.5px] font-medium uppercase tracking-[0.06em] text-faint">
                  {kpi.label}
                </p>
                <p className="mt-1 font-display text-[17px] font-semibold leading-none text-ink sm:text-[19px]">
                  <CountUp
                    value={kpi.value}
                    format={kpi.format}
                    decimals={kpi.decimals ?? 0}
                    delay={0.7 + i * 0.08}
                  />
                </p>
                <p className="mt-1.5 flex items-center gap-0.5 text-[10.5px] font-medium text-success">
                  <ArrowUpRight className="h-3 w-3" strokeWidth={2.4} />
                  {kpi.delta}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Revenue line that draws itself */}
          <div className="rounded-xl border border-[rgb(var(--c-hairline)/0.08)] bg-[rgb(var(--c-hairline)/0.035)] p-3.5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-brand" strokeWidth={2.2} />
                <p className="text-[11.5px] font-medium text-ink">Revenue trend</p>
              </div>
              <p className="font-mono text-[10.5px] text-faint">12 months</p>
            </div>

            <svg viewBox={`0 0 ${W} ${H}`} className="h-[92px] w-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="hero-line" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgb(var(--c-brand))" />
                  <stop offset="55%" stopColor="rgb(var(--c-violet))" />
                  <stop offset="100%" stopColor="rgb(var(--c-cyan))" />
                </linearGradient>
                <linearGradient id="hero-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(var(--c-brand))" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="rgb(var(--c-brand))" stopOpacity="0" />
                </linearGradient>
              </defs>

              <motion.path
                d={AREA_PATH}
                fill="url(#hero-area)"
                initial={reduce ? { opacity: 1 } : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.5 }}
              />
              <motion.path
                d={LINE_PATH}
                fill="none"
                stroke="url(#hero-line)"
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.8, ease: EASE, delay: 0.8 }}
              />
            </svg>
          </div>

          {/* Category bars that grow from the baseline */}
          <div className="rounded-xl border border-[rgb(var(--c-hairline)/0.08)] bg-[rgb(var(--c-hairline)/0.035)] p-3.5">
            <p className="mb-3 text-[11.5px] font-medium text-ink">Sales by category</p>
            <div className="flex h-[58px] items-end gap-2">
              {BARS.map((value, i) => (
                <motion.div
                  key={i}
                  className="flex-1 rounded-t-[3px] bg-brand-gradient"
                  style={{ transformOrigin: 'bottom' }}
                  initial={reduce ? { height: `${value}%` } : { height: 0 }}
                  animate={{ height: `${value}%` }}
                  transition={{ duration: 0.7, ease: EASE, delay: 1.1 + i * 0.07 }}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Satellite: revenue delta chip */}
      <motion.div
        initial={reduce ? { opacity: 1 } : { opacity: 0, x: -20, y: 10 }}
        animate={
          reduce
            ? { opacity: 1 }
            : { opacity: 1, x: 0, y: [0, -10, 0] }
        }
        transition={{
          opacity: { duration: 0.6, delay: 1.5 },
          x: { duration: 0.6, delay: 1.5, ease: EASE },
          y: { duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 },
        }}
        className="glass rim absolute -left-4 top-[38%] hidden rounded-xl px-3.5 py-2.5 shadow-lift sm:block"
      >
        <p className="text-[10.5px] font-medium text-faint">Revenue</p>
        <p className="flex items-center gap-1 font-display text-[15px] font-semibold text-success">
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.6} />
          18.4%
        </p>
      </motion.div>

      {/* Satellite: category share ring */}
      <motion.div
        initial={reduce ? { opacity: 1 } : { opacity: 0, x: 20, y: -10 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, x: 0, y: [0, 12, 0] }}
        transition={{
          opacity: { duration: 0.6, delay: 1.7 },
          x: { duration: 0.6, delay: 1.7, ease: EASE },
          y: { duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1.7 },
        }}
        className="glass rim absolute -right-3 bottom-[16%] hidden items-center gap-2.5 rounded-xl px-3.5 py-2.5 shadow-lift sm:flex"
      >
        <svg viewBox="0 0 36 36" className="h-8 w-8 -rotate-90">
          <circle cx="18" cy="18" r="14" fill="none" stroke="rgb(var(--c-hairline)/0.12)" strokeWidth="5" />
          <motion.circle
            cx="18"
            cy="18"
            r="14"
            fill="none"
            stroke="rgb(var(--c-cyan))"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 14}
            initial={reduce ? { strokeDashoffset: 2 * Math.PI * 14 * 0.38 } : { strokeDashoffset: 2 * Math.PI * 14 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 14 * 0.38 }}
            transition={{ duration: 1.4, ease: EASE, delay: 1.9 }}
          />
        </svg>
        <div>
          <p className="text-[10.5px] text-faint">Electronics</p>
          <p className="font-display text-[13.5px] font-semibold text-ink">62% share</p>
        </div>
      </motion.div>
    </div>
  )
}

export default HeroMockup
