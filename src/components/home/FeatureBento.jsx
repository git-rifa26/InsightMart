import { motion, useReducedMotion } from 'framer-motion'
import {
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  FileDown,
  Users,
  ShieldCheck,
  Building2,
} from 'lucide-react'

import { Reveal, Spotlight } from '@/components/motion'
import { cn } from '@/lib/cn'
import { EASE } from '@/lib/motion'

/** A small live sparkline used inside the lead feature tile. */
function MiniTrend() {
  const reduce = useReducedMotion()
  const path = 'M 0 46 C 26 40, 34 30, 58 34 S 96 18, 122 22 S 164 8, 190 4'

  return (
    <svg viewBox="0 0 190 52" className="mt-5 h-16 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="bento-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgb(var(--c-brand))" />
          <stop offset="100%" stopColor="rgb(var(--c-cyan))" />
        </linearGradient>
      </defs>
      <motion.path
        d={path}
        fill="none"
        stroke="url(#bento-line)"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.6, ease: EASE }}
      />
    </svg>
  )
}

/** Bars that grow when the tile scrolls into view. */
function MiniBars({ values = [40, 68, 52, 88, 62, 76] }) {
  const reduce = useReducedMotion()
  return (
    <div className="mt-5 flex h-16 items-end gap-1.5">
      {values.map((value, i) => (
        <motion.span
          key={i}
          className="flex-1 rounded-t-[3px] bg-brand-gradient"
          initial={reduce ? { height: `${value}%` } : { height: 0 }}
          whileInView={{ height: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE, delay: i * 0.07 }}
        />
      ))}
    </div>
  )
}

/** Donut that sweeps in. */
function MiniDonut() {
  const reduce = useReducedMotion()
  const circumference = 2 * Math.PI * 15

  return (
    <div className="mt-5 flex h-16 items-center justify-center">
      <svg viewBox="0 0 40 40" className="h-16 w-16 -rotate-90">
        <circle cx="20" cy="20" r="15" fill="none" stroke="rgb(var(--c-hairline)/0.1)" strokeWidth="6" />
        <motion.circle
          cx="20"
          cy="20"
          r="15"
          fill="none"
          stroke="rgb(var(--c-violet))"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={reduce ? { strokeDashoffset: circumference * 0.42 } : { strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: circumference * 0.42 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: EASE }}
        />
      </svg>
    </div>
  )
}

const TILES = [
  {
    title: 'Every KPI, computed on upload',
    body: 'Revenue, orders, average order value, repeat purchase rate and margin are derived the moment your file is parsed - no formulas to maintain.',
    icon: Activity,
    span: 'md:col-span-2',
    visual: <MiniTrend />,
  },
  {
    title: 'Sales by month, quarter and year',
    body: 'Switch the period and the bars redraw against the same dataset.',
    icon: BarChart3,
    visual: <MiniBars />,
  },
  {
    title: 'Share by category and region',
    body: 'See where the volume actually sits.',
    icon: PieChart,
    visual: <MiniDonut />,
  },
  {
    title: 'Branch profitability',
    body: 'Where cost data exists, revenue is set against cost per branch so you can see not just where sales are highest, but where they are most profitable.',
    icon: LineChart,
    span: 'md:col-span-2',
    visual: <MiniBars values={[72, 58, 84, 46, 66, 92, 54]} />,
  },
  {
    title: 'Executive PDF export',
    body: 'Generate a report with an executive summary and hand it to someone who will never open the app.',
    icon: FileDown,
  },
  {
    title: 'Organisations and team members',
    body: 'Enterprise accounts invite a team, assign roles, and share analysis inside one workspace.',
    icon: Building2,
  },
  {
    title: 'Retention and repeat purchase',
    body: 'New against returning customers, tracked month over month.',
    icon: Users,
  },
  {
    title: 'Admin oversight',
    body: 'Platform-wide view of every user, organisation, upload and subscription.',
    icon: ShieldCheck,
  },
]

export function FeatureBento() {
  return (
    <section id="features" className="section relative scroll-mt-24 py-24 sm:py-28">
      <Reveal>
        <p className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-brand">
          What you get
        </p>
        <h2 className="mt-3 max-w-2xl text-display-lg">
          The analysis you would build by hand, already built
        </h2>
        <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-muted">
          Each module maps to a section of the platform, from the dashboard summary through to the
          full CSV analysis suite.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {TILES.map((tile, i) => (
          <Reveal key={tile.title} delay={(i % 4) * 0.06} className={cn(tile.span)}>
            <Spotlight className="glass rim h-full rounded-2xl p-5 transition-transform duration-500 ease-expo hover:-translate-y-1 sm:p-6">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[rgb(var(--c-brand)/0.12)] text-brand">
                <tile.icon className="h-[19px] w-[19px]" strokeWidth={1.85} />
              </span>
              <h3 className="mt-4 text-[15.5px] font-semibold leading-snug text-ink">{tile.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{tile.body}</p>
              {tile.visual}
            </Spotlight>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export default FeatureBento
