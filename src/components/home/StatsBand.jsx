import { Reveal, CountUp } from '@/components/motion'
import { GridBackdrop } from '@/components/motion'

const STATS = [
  { value: 4, suffix: '', label: 'Chart types', hint: 'Bar, line, histogram and donut' },
  { value: 8, suffix: '', label: 'Application pages', hint: 'Home through to Admin' },
  { value: 3, suffix: '', label: 'Subscription tiers', hint: 'Free, Pro and Enterprise' },
  { value: 6, suffix: '+', label: 'Insight categories', hint: 'Trends, performers, retention and more' },
]

export function StatsBand() {
  return (
    <section id="analytics" className="section relative scroll-mt-24 py-8">
      <Reveal>
        <div className="glass rim relative overflow-hidden rounded-3xl px-6 py-12 sm:px-10">
          <GridBackdrop size={40} className="opacity-60" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(70% 120% at 50% 0%, rgb(var(--c-brand) / 0.12), transparent 65%)',
            }}
          />

          <div className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((stat, i) => (
              <div key={stat.label} className="text-center sm:text-left">
                <p className="font-display text-[40px] font-semibold leading-none tracking-[-0.03em] text-ink sm:text-[46px]">
                  <CountUp
                    value={stat.value}
                    delay={i * 0.1}
                    format={(v) => `${Math.round(v)}${stat.suffix}`}
                  />
                </p>
                <p className="mt-3 text-[14px] font-medium text-ink">{stat.label}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-faint">{stat.hint}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  )
}

export default StatsBand
