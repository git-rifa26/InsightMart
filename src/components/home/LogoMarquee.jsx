import { Reveal } from '@/components/motion'

// The stack the platform is built on, per section 1 of the documentation.
const STACK = [
  'React',
  'React Router',
  'Axios',
  'Recharts',
  'Tailwind CSS',
  'Flask',
  'SQLAlchemy',
  'JWT',
  'Pandas',
  'ReportLab',
  'MySQL',
  'Gunicorn',
]

export function LogoMarquee() {
  const row = [...STACK, ...STACK]

  return (
    <section className="relative py-10">
      <Reveal>
        <p className="section text-center text-[12.5px] font-medium uppercase tracking-[0.14em] text-faint">
          Built on a stack you already trust
        </p>

        <div className="mask-fade-r relative mt-7 overflow-hidden">
          <div className="flex w-max animate-marquee gap-3">
            {row.map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="glass shrink-0 rounded-xl px-5 py-2.5 font-display text-[14px] font-medium tracking-[-0.01em] text-muted"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  )
}

export default LogoMarquee
