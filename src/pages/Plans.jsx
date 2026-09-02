import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Minus, ChevronDown, Sparkles, ArrowRight } from 'lucide-react'

import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { SegmentedTabs } from '@/components/ui/Tabs'
import { Reveal, Spotlight, AuroraBackground, GridBackdrop, PageTransition } from '@/components/motion'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { PLANS, PLAN_MATRIX } from '@/lib/constants'
import { currency } from '@/lib/formatters'
import { EASE } from '@/lib/motion'
import { cn } from '@/lib/cn'

const BILLING = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'annual', label: 'Annual' },
]

const FAQS = [
  {
    q: 'What happens when I hit the Free upload limit?',
    a: 'Free accounts get one CSV upload per day. Existing analyses stay available - you simply cannot upload another file until the next day, or until you move to Pro.',
  },
  {
    q: 'Do I need to enter payment details?',
    a: 'No. Payment gateway integration is out of scope for this version, so every tier is self-serve and no card is collected at any point.',
  },
  {
    q: 'What is the difference between Pro and Enterprise?',
    a: 'Pro is built around a single analyst and unlocks the full analysis suite plus PDF export. Enterprise adds an organisation: team members, roles, shared uploads and the Organisation page.',
  },
  {
    q: 'Can I try the premium features first?',
    a: 'Yes. Pro and Enterprise both include a trial period on premium features, so you can run a full analysis and export a report before committing.',
  },
  {
    q: 'Can I downgrade later?',
    a: 'Any time, from My Account. Your uploads and analyses are kept - the limits and feature access simply change to match the new tier.',
  },
]

/** Renders a matrix cell that may be a boolean or a descriptive string. */
function MatrixCell({ value }) {
  if (value === true) {
    return (
      <span className="grid h-5 w-5 place-items-center rounded-full bg-[rgb(var(--c-success)/0.14)]">
        <Check className="h-3 w-3 text-success" strokeWidth={3} />
      </span>
    )
  }
  if (value === false) {
    return <Minus className="h-4 w-4 text-faint" strokeWidth={2.2} />
  }
  return <span className="text-[13px] text-muted">{value}</span>
}

function FaqItem({ item, index }) {
  const [open, setOpen] = useState(false)

  return (
    <Reveal delay={index * 0.05}>
      <div className="glass rim overflow-hidden rounded-2xl">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        >
          <span className="text-[14.5px] font-medium text-ink">{item.q}</span>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25, ease: EASE }}>
            <ChevronDown className="h-4 w-4 shrink-0 text-faint" strokeWidth={2} />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="overflow-hidden"
            >
              <p className="px-5 pb-5 text-[13.5px] leading-relaxed text-muted">{item.a}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Reveal>
  )
}

export default function Plans() {
  const [billing, setBilling] = useState('monthly')
  const { isAuthenticated, plan: currentPlan, changePlan } = useAuth()
  const toast = useToast()
  const [switching, setSwitching] = useState(null)

  const handleSelect = async (planId) => {
    if (!isAuthenticated) return
    setSwitching(planId)
    try {
      await changePlan(planId)
      toast.success(`You are now on the ${PLANS.find((p) => p.id === planId).name} plan.`)
    } catch {
      toast.error('Could not change your plan. Please try again.')
    } finally {
      setSwitching(null)
    }
  }

  return (
    <PageTransition>
      {/* Header */}
      <section className="relative overflow-hidden pb-10 pt-32 sm:pt-36">
        <GridBackdrop size={48} />
        <AuroraBackground intensity={0.7} />

        <div className="section relative text-center">
          <Reveal>
            <Badge tone="brand" dot className="mx-auto">
              Feature plans
            </Badge>
            <h1 className="mx-auto mt-5 max-w-3xl text-display-lg">
              Three tiers. Pick the one that matches how much analysis you actually run.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-[15.5px] leading-relaxed text-muted">
              Free and Pro are self-serve. Enterprise adds an organisation and its team. No payment
              gateway is required in this version.
            </p>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="mt-8 flex flex-col items-center gap-2.5">
              <SegmentedTabs items={BILLING} value={billing} onChange={setBilling} layoutId="billing" />
              <AnimatePresence mode="wait">
                {billing === 'annual' && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-[12.5px] font-medium text-success"
                  >
                    Two months free on annual billing
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Tier cards */}
      <section className="section pb-20">
        <div className="grid gap-4 lg:grid-cols-3">
          {PLANS.map((plan, i) => {
            const price = plan.price[billing]
            const isCurrent = isAuthenticated && currentPlan.id === plan.id

            return (
              <Reveal key={plan.id} delay={i * 0.08}>
                <Spotlight
                  className={cn(
                    'glass rim relative h-full rounded-2xl p-6 transition-transform duration-500 ease-expo hover:-translate-y-1.5',
                    plan.highlight && 'ring-1 ring-[rgb(var(--c-brand)/0.45)]',
                  )}
                >
                  {plan.highlight && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-10 -top-px h-px bg-gradient-to-r from-transparent via-[rgb(var(--c-brand))] to-transparent"
                    />
                  )}

                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-display text-[20px] font-semibold text-ink">{plan.name}</h2>
                    {plan.highlight && (
                      <Badge tone="brand" icon={Sparkles}>
                        Most popular
                      </Badge>
                    )}
                    {isCurrent && <Badge tone="success">Current plan</Badge>}
                  </div>

                  <p className="mt-2 min-h-[42px] text-[13.5px] leading-relaxed text-muted">
                    {plan.tagline}
                  </p>

                  {/* Price morphs when the billing period changes */}
                  <div className="mt-6 flex items-baseline gap-1.5">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={`${plan.id}-${billing}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.28, ease: EASE }}
                        className="font-display text-[38px] font-semibold leading-none tracking-[-0.035em] text-ink"
                      >
                        {price === 0 ? 'Free' : currency(price)}
                      </motion.span>
                    </AnimatePresence>
                    {price > 0 && (
                      <span className="text-[13px] text-faint">
                        / {billing === 'monthly' ? 'month' : 'year'}
                      </span>
                    )}
                  </div>

                  <Button
                    variant={plan.highlight ? 'primary' : 'secondary'}
                    size="lg"
                    className="mt-6 w-full"
                    loading={switching === plan.id}
                    disabled={isCurrent}
                    onClick={() => handleSelect(plan.id)}
                    {...(!isAuthenticated ? { as: Link, to: '/register' } : {})}
                  >
                    {isCurrent ? 'Your current plan' : plan.cta}
                  </Button>

                  <div className="my-6 divider" />

                  <ul className="space-y-2.5">
                    {plan.features.map((feature, fi) => (
                      <motion.li
                        key={feature}
                        initial={{ opacity: 0, x: -6 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.35, delay: 0.1 + fi * 0.04 }}
                        className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-muted"
                      >
                        <Check className="mt-[3px] h-3.5 w-3.5 shrink-0 text-success" strokeWidth={2.6} />
                        {feature}
                      </motion.li>
                    ))}
                  </ul>
                </Spotlight>
              </Reveal>
            )
          })}
        </div>
      </section>

      {/* Comparison matrix */}
      <section className="section pb-20">
        <Reveal className="max-w-2xl">
          <h2 className="text-display-md">Compare every feature</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            The same limits the platform enforces, laid out side by side.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="glass rim mt-8 overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[42rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[rgb(var(--c-hairline)/0.1)]">
                    <th className="px-5 py-4 text-[12px] font-semibold uppercase tracking-[0.07em] text-faint">
                      Feature
                    </th>
                    {PLANS.map((plan) => (
                      <th
                        key={plan.id}
                        className={cn(
                          'px-5 py-4 text-[13px] font-semibold text-ink',
                          plan.highlight && 'bg-[rgb(var(--c-brand)/0.05)]',
                        )}
                      >
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PLAN_MATRIX.map((row, i) => (
                    <motion.tr
                      key={row.feature}
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.6 }}
                      transition={{ duration: 0.4, ease: EASE, delay: (i % 9) * 0.04 }}
                      className="border-b border-[rgb(var(--c-hairline)/0.06)] transition-colors hover:bg-[rgb(var(--c-hairline)/0.03)]"
                    >
                      <td className="px-5 py-3.5 text-[13.5px] font-medium text-ink">{row.feature}</td>
                      {['free', 'pro', 'enterprise'].map((key) => (
                        <td
                          key={key}
                          className={cn(
                            'px-5 py-3.5',
                            key === 'pro' && 'bg-[rgb(var(--c-brand)/0.04)]',
                          )}
                        >
                          <MatrixCell value={row[key]} />
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="section pb-24">
        <Reveal className="max-w-2xl">
          <h2 className="text-display-md">Questions worth answering</h2>
        </Reveal>

        <div className="mt-8 grid gap-3 lg:grid-cols-2">
          {FAQS.map((item, i) => (
            <FaqItem key={item.q} item={item} index={i} />
          ))}
        </div>

        {!isAuthenticated && (
          <Reveal delay={0.15}>
            <div className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-[rgb(var(--c-hairline)/0.1)] px-6 py-10 text-center">
              <h3 className="text-display-sm">Still deciding? Start on Free.</h3>
              <p className="max-w-md text-[14.5px] leading-relaxed text-muted">
                Run a real analysis on your own data, then upgrade only if the report earns it.
              </p>
              <Button as={Link} to="/register" size="lg" iconRight={ArrowRight} className="mt-1">
                Create free account
              </Button>
            </div>
          </Reveal>
        )}
      </section>
    </PageTransition>
  )
}
