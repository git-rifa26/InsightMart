import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'

import Hero from '@/components/home/Hero'
import LogoMarquee from '@/components/home/LogoMarquee'
import FeatureBento from '@/components/home/FeatureBento'
import HowItWorks from '@/components/home/HowItWorks'
import StatsBand from '@/components/home/StatsBand'

import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import MagneticButton from '@/components/motion/MagneticButton'
import { Reveal, Spotlight, AuroraBackground, PageTransition } from '@/components/motion'
import { PLANS } from '@/lib/constants'
import { currency } from '@/lib/formatters'
import { cn } from '@/lib/cn'

/** Condensed pricing strip; the full comparison lives on /plans. */
function PlanPreview() {
  return (
    <section className="section py-24 sm:py-28">
      <Reveal className="max-w-2xl">
        <p className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-brand">Plans</p>
        <h2 className="mt-3 text-display-lg">Start free, upgrade when the analysis earns it</h2>
        <p className="mt-4 text-[15.5px] leading-relaxed text-muted">
          Free covers the core metrics. Pro unlocks the full analysis suite and PDF export.
          Enterprise adds an organisation and its team.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        {PLANS.map((plan, i) => (
          <Reveal key={plan.id} delay={i * 0.08}>
            <Spotlight
              className={cn(
                'glass rim h-full rounded-2xl p-6 transition-transform duration-500 ease-expo hover:-translate-y-1.5',
                plan.highlight && 'ring-1 ring-[rgb(var(--c-brand)/0.4)]',
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-[19px] font-semibold text-ink">{plan.name}</h3>
                {plan.highlight && <Badge tone="brand">Most popular</Badge>}
              </div>

              <p className="mt-2 min-h-[40px] text-[13.5px] leading-relaxed text-muted">
                {plan.tagline}
              </p>

              <p className="mt-5 font-display text-[34px] font-semibold leading-none tracking-[-0.03em] text-ink">
                {plan.price.monthly === 0 ? 'Free' : currency(plan.price.monthly)}
                {plan.price.monthly > 0 && (
                  <span className="ml-1 text-[13px] font-normal text-faint">/ month</span>
                )}
              </p>

              <ul className="mt-6 space-y-2.5">
                {plan.features.slice(0, 5).map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-[13.5px] text-muted">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" strokeWidth={2.6} />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                as={Link}
                to="/plans"
                variant={plan.highlight ? 'primary' : 'secondary'}
                className="mt-7 w-full"
              >
                {plan.cta}
              </Button>
            </Spotlight>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function ClosingCta() {
  return (
    <section className="section pb-8">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-[rgb(var(--c-hairline)/0.1)] px-6 py-16 text-center sm:px-12 sm:py-20">
          <AuroraBackground intensity={0.75} />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-display-md">
              Your next sales file is one upload away from being a report
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[15.5px] leading-relaxed text-muted">
              Create a free account and run your first analysis in a couple of minutes.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <MagneticButton as={Link} to="/register" className="inline-block">
                <Button as="span" size="lg" iconRight={ArrowRight}>
                  Create free account
                </Button>
              </MagneticButton>
              <Button as={Link} to="/login" size="lg" variant="secondary">
                Sign in
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

export default function Home() {
  return (
    <PageTransition>
      <Hero />
      <LogoMarquee />
      <FeatureBento />
      <HowItWorks />
      <StatsBand />
      <PlanPreview />
      <ClosingCta />
    </PageTransition>
  )
}
