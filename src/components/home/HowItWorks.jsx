import { useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { UserPlus, Upload, Sparkles, FileDown } from 'lucide-react'

import { Reveal } from '@/components/motion'
import { cn } from '@/lib/cn'

const STEPS = [
  {
    icon: UserPlus,
    title: 'Create your account',
    body: 'Register as an Individual or as an Enterprise. Enterprise accounts go on to create an organisation and invite their team.',
  },
  {
    icon: Upload,
    title: 'Upload your sales CSV',
    body: 'Drop the file in. The schema is validated, missing values are handled and the records are normalised before anything is stored.',
  },
  {
    icon: Sparkles,
    title: 'Read the analysis',
    body: 'KPIs, sales by period, top products and regions, order value distribution, retention and branch profitability - all rendered as charts.',
  },
  {
    icon: FileDown,
    title: 'Export and share',
    body: 'Generate a PDF report with an executive summary, or keep working in the dashboard with support alongside you.',
  },
]

export function HowItWorks() {
  const containerRef = useRef(null)
  const reduce = useReducedMotion()

  // The rail fills as the section moves through the viewport.
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 72%', 'end 65%'],
  })
  const railScale = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <section id="how-it-works" className="relative scroll-mt-24 overflow-hidden py-24 sm:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(50% 40% at 50% 0%, rgb(var(--c-violet) / 0.10), transparent 70%)',
        }}
      />

      <div className="section relative">
        <Reveal className="max-w-2xl">
          <p className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-brand">
            How it works
          </p>
          <h2 className="mt-3 text-display-lg">From spreadsheet to signed-off report</h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-muted">
            Four steps, start to finish. The same path every account follows.
          </p>
        </Reveal>

        <div ref={containerRef} className="relative mt-14">
          {/* The rail itself, behind the steps */}
          <div
            aria-hidden="true"
            className="absolute left-[27px] top-2 hidden h-[calc(100%-2rem)] w-px bg-[rgb(var(--c-hairline)/0.12)] md:block"
          />
          <motion.div
            aria-hidden="true"
            style={{ scaleY: reduce ? 1 : railScale }}
            className="absolute left-[27px] top-2 hidden h-[calc(100%-2rem)] w-px origin-top bg-brand-gradient md:block"
          />

          <div className="space-y-6 md:space-y-8">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.08} direction="left">
                <div className="flex gap-5 md:gap-8">
                  <div className="relative hidden shrink-0 md:block">
                    <span
                      className={cn(
                        'relative z-10 grid h-14 w-14 place-items-center rounded-2xl',
                        'glass rim text-brand',
                      )}
                    >
                      <step.icon className="h-5 w-5" strokeWidth={1.9} />
                    </span>
                  </div>

                  <div className="glass rim flex-1 rounded-2xl p-5 sm:p-6">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[rgb(var(--c-brand)/0.12)] text-brand md:hidden">
                        <step.icon className="h-4 w-4" strokeWidth={1.9} />
                      </span>
                      <span className="font-mono text-[12px] font-medium text-faint">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <h3 className="text-[16px] font-semibold text-ink">{step.title}</h3>
                    </div>
                    <p className="mt-2.5 text-[14px] leading-relaxed text-muted md:pl-0">{step.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
