import { Link } from 'react-router-dom'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, ArrowUpRight, ChevronDown } from 'lucide-react'

import HeroMockup from './HeroMockup'
import Button from '@/components/ui/Button'
import MagneticButton from '@/components/motion/MagneticButton'
import { AuroraBackground, GridBackdrop } from '@/components/motion'
import { useTilt } from '@/hooks/useMousePosition'
import { EASE } from '@/lib/motion'

const HEADLINE_LEAD = 'Turn a raw sales CSV into'
const HEADLINE_ACCENT = 'decisions you can defend'

const PROOF = [
  { value: '4 roles', label: 'Individual, Enterprise, Team, Admin' },
  { value: '4 chart types', label: 'Bar, line, histogram, donut' },
  { value: 'PDF export', label: 'With executive summary' },
]

/** Each word rises into place, so the headline assembles rather than appears. */
function AnimatedHeadline({ text, className, delayOffset = 0 }) {
  const reduce = useReducedMotion()
  const words = text.split(' ')

  return (
    <span className={className}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <motion.span
            className="inline-block"
            initial={reduce ? { y: 0, opacity: 1 } : { y: '105%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 0.85,
              ease: EASE,
              delay: reduce ? 0 : delayOffset + i * 0.055,
            }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 && <span>&nbsp;</span>}
        </span>
      ))}
    </span>
  )
}

export function Hero() {
  const reduce = useReducedMotion()
  const tilt = useTilt({ max: 6.5 })
  const { scrollY } = useScroll()

  // The scroll cue fades out as soon as the visitor starts moving.
  const cueOpacity = useTransform(scrollY, [0, 140], [1, 0])

  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden pb-20 pt-28 sm:pb-24 sm:pt-32">
      {/* Backdrop stack */}
      <GridBackdrop size={48} />
      <AuroraBackground />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] opacity-60"
        style={{
          background:
            'radial-gradient(60% 50% at 22% 12%, rgb(var(--c-brand) / 0.16), transparent 70%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[rgb(var(--c-canvas))]"
      />

      <div className="section relative grid items-center gap-14 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-12">
        {/* Copy column */}
        <div>
          <motion.div
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <Link
              to="/plans"
              className="glass group inline-flex items-center gap-2.5 rounded-full py-1.5 pl-2 pr-3.5 text-[12.5px] font-medium text-muted transition-colors duration-300 hover:text-ink"
            >
              <span className="relative grid h-5 w-5 place-items-center">
                <span className="absolute h-1.5 w-1.5 rounded-full bg-brand" />
                <span className="absolute h-1.5 w-1.5 animate-pulse-ring rounded-full bg-brand" />
              </span>
              Sales analytics, without the spreadsheet
              <ArrowUpRight
                className="h-3.5 w-3.5 text-faint transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                strokeWidth={2.2}
              />
            </Link>
          </motion.div>

          <h1 className="mt-6 text-display-xl">
            <AnimatedHeadline text={HEADLINE_LEAD} delayOffset={0.12} />{' '}
            <AnimatedHeadline text={HEADLINE_ACCENT} className="text-gradient" delayOffset={0.34} />
          </h1>

          <motion.p
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.55 }}
            className="mt-6 max-w-xl text-[16px] leading-relaxed text-muted sm:text-[17px]"
          >
            Upload your sales file and InsightMart cleans it, computes the KPIs that matter, and
            renders revenue trends, top performers, branch profitability and retention as charts you
            can hand to anyone.
          </motion.p>

          <motion.div
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.68 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <MagneticButton as={Link} to="/register" className="inline-block">
              <Button as="span" size="lg" iconRight={ArrowRight} className="w-full sm:w-auto">
                Get started free
              </Button>
            </MagneticButton>

            <Button as={Link} to="/plans" size="lg" variant="secondary" className="w-full sm:w-auto">
              View plans
            </Button>
          </motion.div>

          <motion.dl
            initial={reduce ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.95 }}
            className="mt-10 grid max-w-lg grid-cols-3 gap-px overflow-hidden rounded-xl bg-[rgb(var(--c-hairline)/0.09)]"
          >
            {PROOF.map((item) => (
              <div key={item.label} className="bg-canvas px-3 py-3 sm:px-4">
                <dt className="font-display text-[15px] font-semibold leading-none text-ink">
                  {item.value}
                </dt>
                <dd className="mt-1.5 text-[11.5px] leading-tight text-faint">{item.label}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* Product visual column */}
        <div
          ref={tilt.ref}
          onMouseMove={reduce ? undefined : tilt.onMouseMove}
          onMouseLeave={reduce ? undefined : tilt.onMouseLeave}
          className="perspective relative"
        >
          <motion.div
            style={reduce ? undefined : { rotateX: tilt.rotateX, rotateY: tilt.rotateY }}
            className="preserve-3d"
          >
            <HeroMockup />
          </motion.div>
        </div>
      </div>

      {/* Scroll cue */}
      <motion.div
        style={{ opacity: cueOpacity }}
        className="pointer-events-none absolute inset-x-0 bottom-7 hidden justify-center lg:flex"
        aria-hidden="true"
      >
        <motion.span
          animate={reduce ? undefined : { y: [0, 7, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-1.5 text-faint"
        >
          <span className="text-[11px] font-medium uppercase tracking-[0.14em]">Scroll</span>
          <ChevronDown className="h-4 w-4" strokeWidth={2} />
        </motion.span>
      </motion.div>
    </section>
  )
}

export default Hero
