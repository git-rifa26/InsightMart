import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from 'framer-motion'
import { Menu, X, ArrowRight, LayoutDashboard } from 'lucide-react'

import Logo from '@/components/ui/Logo'
import Button from '@/components/ui/Button'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { useAuth } from '@/context/AuthContext'
import { useLockBodyScroll } from '@/hooks/useOnClickOutside'
import { MARKETING_NAV } from '@/lib/constants'
import { cn } from '@/lib/cn'
import { EASE, SPRING } from '@/lib/motion'

/**
 * The public marketing header. It starts transparent over the hero and
 * condenses into a frosted bar once the page scrolls.
 */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', (latest) => setScrolled(latest > 24))
  useLockBodyScroll(menuOpen)

  useEffect(() => {
    setMenuOpen(false)
  }, [])

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
        className="fixed inset-x-0 top-0 z-50"
      >
        <div
          className={cn(
            'mx-auto mt-3 flex h-14 max-w-7xl items-center justify-between gap-4 rounded-2xl px-4 sm:px-5',
            'transition-all duration-500 ease-expo',
            scrolled
              ? 'glass rim mx-3 shadow-soft sm:mx-6 lg:mx-auto'
              : 'mx-3 border border-transparent bg-transparent sm:mx-6 lg:mx-auto',
          )}
        >
          <Link to="/" className="rounded-lg" aria-label="InsightMart home">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {MARKETING_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'group relative rounded-lg px-3.5 py-2 text-[13.5px] font-medium transition-colors duration-200',
                    isActive && item.to === '/plans' ? 'text-ink' : 'text-muted hover:text-ink',
                  )
                }
              >
                {item.label}
                <span className="absolute inset-x-3.5 bottom-1 h-px origin-left scale-x-0 bg-brand-gradient transition-transform duration-300 ease-expo group-hover:scale-x-100" />
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle className="hidden sm:grid" />

            {isAuthenticated ? (
              <Button
                size="sm"
                icon={LayoutDashboard}
                onClick={() => navigate('/dashboard')}
                className="hidden sm:inline-flex"
              >
                Dashboard
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate('/login')}
                  className="hidden sm:inline-flex"
                >
                  Sign in
                </Button>
                <Button
                  size="sm"
                  iconRight={ArrowRight}
                  onClick={() => navigate('/register')}
                  className="hidden sm:inline-flex"
                >
                  Get started
                </Button>
              </>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
              className="grid h-9 w-9 place-items-center rounded-lg border border-[rgb(var(--c-hairline)/0.12)] text-ink md:hidden"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile sheet */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ y: '-100%' }}
              animate={{ y: 0 }}
              exit={{ y: '-100%' }}
              transition={SPRING}
              className="glass fixed inset-x-0 top-0 z-40 rounded-b-3xl px-5 pb-6 pt-20 md:hidden"
            >
              <nav className="flex flex-col gap-1">
                {MARKETING_NAV.map((item, i) => (
                  <motion.div
                    key={item.to}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.06 + i * 0.05 }}
                  >
                    <Link
                      to={item.to}
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-xl px-3 py-3 text-[15px] font-medium text-ink transition-colors hover:bg-[rgb(var(--c-hairline)/0.06)]"
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div className="my-4 divider" />

              <div className="flex items-center gap-2.5">
                {isAuthenticated ? (
                  <Button
                    className="flex-1"
                    icon={LayoutDashboard}
                    onClick={() => {
                      setMenuOpen(false)
                      navigate('/dashboard')
                    }}
                  >
                    Go to dashboard
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => {
                        setMenuOpen(false)
                        navigate('/login')
                      }}
                    >
                      Sign in
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => {
                        setMenuOpen(false)
                        navigate('/register')
                      }}
                    >
                      Get started
                    </Button>
                  </>
                )}
                <ThemeToggle />
              </div>

              {isAuthenticated && user && (
                <p className="mt-4 text-center text-[12.5px] text-faint">Signed in as {user.email}</p>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar
