import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Quote } from 'lucide-react'

import Logo from '@/components/ui/Logo'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { AuroraBackground, GridBackdrop } from '@/components/motion'
import { EASE } from '@/lib/motion'

const SERIES = [22, 30, 26, 38, 44, 41, 55, 61, 58, 72, 80, 94]
const W = 300
const H = 88

function buildPath(points, width, height) {
  const max = Math.max(...points)
  const min = Math.min(...points)
  const span = max - min || 1
  const step = width / (points.length - 1)
  const coords = points.map((v, i) => [i * step, height - ((v - min) / span) * (height - 10) - 5])

  return coords.reduce((path, [x, y], i) => {
    if (i === 0) return `M ${x} ${y}`
    const [px, py] = coords[i - 1]
    const cx = (px + x) / 2
    return `${path} C ${cx} ${py}, ${cx} ${y}, ${x} ${y}`
  }, '')
}

const PATH = buildPath(SERIES, W, H)

/**
 * Two-column shell for Login and Register: the form on the left, a brand
 * panel with a live mini-chart on the right.
 */
export function AuthLayout({ children, title, subtitle, aside }) {
  const reduce = useReducedMotion()

  return (
    <div className="relative flex min-h-[100svh] bg-canvas">
      {/* Form column */}
      <div className="relative flex w-full flex-col lg:w-[52%]">
        <header className="flex items-center justify-between px-6 py-6 sm:px-10">
          <Link to="/" aria-label="InsightMart home">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] text-muted transition-colors hover:text-ink sm:flex"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
              Back to site
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center px-6 pb-12 sm:px-10">
          <motion.div
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="w-full max-w-[420px]"
          >
            <h1 className="text-display-sm">{title}</h1>
            {subtitle && <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{subtitle}</p>}
            <div className="mt-8">{children}</div>
          </motion.div>
        </div>
      </div>

      {/* Brand panel */}
      <div className="relative hidden overflow-hidden border-l border-[rgb(var(--c-hairline)/0.09)] lg:block lg:w-[48%]">
        <GridBackdrop size={44} />
        <AuroraBackground intensity={1.1} />

        <div className="relative flex h-full flex-col justify-center px-12 xl:px-16">
          <motion.div
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: EASE, delay: 0.2 }}
          >
            {aside ?? (
              <>
                <Quote className="h-7 w-7 text-brand" strokeWidth={1.6} />
                <p className="mt-5 max-w-md font-display text-[24px] font-medium leading-[1.35] tracking-[-0.02em] text-ink xl:text-[27px]">
                  Every sales file has a story in it. InsightMart just reads it out loud.
                </p>
                <p className="mt-4 max-w-md text-[14px] leading-relaxed text-muted">
                  Upload once and get revenue trends, top performers, branch profitability and
                  retention as charts you can hand to anyone.
                </p>
              </>
            )}

            {/* Live mini-chart */}
            <div className="glass rim mt-10 max-w-md rounded-2xl p-5">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-[11.5px] font-medium uppercase tracking-[0.07em] text-faint">
                    Revenue trend
                  </p>
                  <p className="mt-1 font-display text-[24px] font-semibold leading-none text-ink">
                    &#8377;48.18L
                  </p>
                </div>
                <span className="rounded-full bg-[rgb(var(--c-success)/0.14)] px-2.5 py-1 text-[11.5px] font-medium text-success">
                  +18.4%
                </span>
              </div>

              <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 h-[84px] w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="auth-line" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgb(var(--c-brand))" />
                    <stop offset="100%" stopColor="rgb(var(--c-cyan))" />
                  </linearGradient>
                  <linearGradient id="auth-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(var(--c-brand))" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="rgb(var(--c-brand))" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <motion.path
                  d={`${PATH} L ${W} ${H} L 0 ${H} Z`}
                  fill="url(#auth-area)"
                  initial={reduce ? { opacity: 1 } : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 1.4 }}
                />
                <motion.path
                  d={PATH}
                  fill="none"
                  stroke="url(#auth-line)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.8, ease: EASE, delay: 0.6 }}
                />
              </svg>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
