import { Link } from 'react-router-dom'
import Logo from '@/components/ui/Logo'
import { GridBackdrop } from '@/components/motion'

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', to: '/#features' },
      { label: 'How it works', to: '/#how-it-works' },
      { label: 'Analytics', to: '/#analytics' },
      { label: 'Plans', to: '/plans' },
    ],
  },
  {
    title: 'Application',
    links: [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'CSV Analysis', to: '/analysis' },
      { label: 'Organisation', to: '/organisation' },
      { label: 'My Account', to: '/account' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Sign in', to: '/login' },
      { label: 'Create account', to: '/register' },
      { label: 'Free plan', to: '/plans' },
      { label: 'Enterprise', to: '/plans' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-[rgb(var(--c-hairline)/0.09)]">
      <GridBackdrop className="opacity-40" size={64} fade="b" />

      <div className="section relative py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-muted">
              Sales analytics and reporting for teams that would rather read a chart than a
              spreadsheet.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h4 className="text-[12.5px] font-semibold uppercase tracking-[0.09em] text-faint">
                {column.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-[13.5px] text-muted transition-colors duration-200 hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 divider" />

        <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-[12.5px] text-faint">
            &copy; {new Date().getFullYear()} InsightMart. Built with React, Flask and MySQL.
          </p>
          <p className="text-[12.5px] text-faint">
            Sales Analytics &amp; Reporting Platform
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
