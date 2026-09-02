import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom'
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from 'framer-motion'
import {
  LayoutGrid,
  Users,
  Building2,
  Database,
  ArrowLeft,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  RefreshCw,
} from 'lucide-react'

import Logo from '@/components/ui/Logo'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { GridBackdrop } from '@/components/motion'
import { adminApi, errorMessage } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useLockBodyScroll } from '@/hooks/useOnClickOutside'
import { initials } from '@/lib/formatters'
import { cn } from '@/lib/cn'
import { EASE, SPRING } from '@/lib/motion'

export const ADMIN_NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/organisations', label: 'Organisations', icon: Building2 },
  { to: '/admin/uploads', label: 'Uploads & data', icon: Database },
]

/**
 * The admin console has its own chrome: a top navigation bar rather than the
 * application sidebar, so it reads as a separate surface from the analytics
 * pages. Overview data is fetched once here and shared with every section.
 */
export default function AdminLayout() {
  const { user, logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const { scrollY } = useScroll()

  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useMotionValueEvent(scrollY, 'change', (latest) => setScrolled(latest > 12))
  useLockBodyScroll(menuOpen)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const payload = await adminApi.overview()
      setData(payload)
      if (isRefresh) toast.success('Platform data refreshed.')
    } catch (error) {
      toast.error(errorMessage(error, 'Could not load the admin overview.'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="relative min-h-screen bg-canvas">
      <GridBackdrop size={56} className="fixed inset-0 opacity-50" fade="b" />

      {/* Top bar */}
      <header
        className={cn(
          'sticky top-0 z-50 transition-all duration-300 ease-expo',
          scrolled
            ? 'border-b border-[rgb(var(--c-hairline)/0.1)] bg-[rgb(var(--c-surface)/0.75)] backdrop-blur-xl'
            : 'border-b border-transparent',
        )}
      >
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-5 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/admin" aria-label="Admin console">
              <Logo size={30} />
            </Link>
            <Badge tone="danger" icon={ShieldCheck} className="hidden sm:inline-flex">
              Admin console
            </Badge>
          </div>

          {/* Section navigation - the sliding pill is the active indicator */}
          <nav className="hidden items-center gap-1 rounded-xl border border-[rgb(var(--c-hairline)/0.1)] bg-[rgb(var(--c-hairline)/0.04)] p-1 lg:flex">
            {ADMIN_NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end}>
                {({ isActive }) => (
                  <span
                    className={cn(
                      'relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-medium',
                      'transition-colors duration-200',
                      isActive ? 'text-ink' : 'text-muted hover:text-ink',
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="admin-nav-pill"
                        className="absolute inset-0 rounded-lg bg-[rgb(var(--c-surface))] shadow-soft"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      />
                    )}
                    <item.icon
                      className={cn('relative h-4 w-4', isActive ? 'text-brand' : 'text-faint')}
                      strokeWidth={1.9}
                    />
                    <span className="relative">{item.label}</span>
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => load(true)}
              disabled={refreshing}
              aria-label="Refresh platform data"
              className="grid h-9 w-9 place-items-center rounded-lg border border-[rgb(var(--c-hairline)/0.12)] text-muted transition-colors hover:text-ink disabled:opacity-50"
            >
              <RefreshCw
                className={cn('h-4 w-4', refreshing && 'animate-spin')}
                strokeWidth={1.9}
              />
            </button>

            <Button
              as={Link}
              to="/dashboard"
              size="sm"
              variant="secondary"
              icon={ArrowLeft}
              className="hidden sm:inline-flex"
            >
              Back to app
            </Button>

            <ThemeToggle />

            <span className="hidden items-center gap-2.5 border-l border-[rgb(var(--c-hairline)/0.12)] pl-3 md:flex">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-gradient text-[11.5px] font-semibold text-white">
                {initials(user?.name ?? 'A')}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[12.5px] font-medium leading-tight text-ink">
                  {user?.name}
                </span>
                <span className="block text-[11px] text-faint">Administrator</span>
              </span>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Sign out"
                className="rounded-md p-1.5 text-faint transition-colors hover:bg-[rgb(var(--c-danger)/0.12)] hover:text-danger"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.9} />
              </button>
            </span>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Toggle admin navigation"
              aria-expanded={menuOpen}
              className="grid h-9 w-9 place-items-center rounded-lg border border-[rgb(var(--c-hairline)/0.12)] text-ink lg:hidden"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile navigation sheet */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={SPRING}
              className="glass fixed inset-x-3 top-[4.5rem] z-40 rounded-2xl p-3 lg:hidden"
            >
              {ADMIN_NAV.map((item, i) => (
                <motion.div
                  key={item.to}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.05 }}
                >
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-xl px-3 py-3 text-[14px] font-medium transition-colors',
                        isActive
                          ? 'bg-[rgb(var(--c-brand)/0.13)] text-ink'
                          : 'text-muted hover:bg-[rgb(var(--c-hairline)/0.06)] hover:text-ink',
                      )
                    }
                  >
                    <item.icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                    {item.label}
                  </NavLink>
                </motion.div>
              ))}

              <div className="my-2 divider" />

              <Button as={Link} to="/dashboard" variant="secondary" icon={ArrowLeft} className="w-full">
                Back to app
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Routed section */}
      <main className="relative mx-auto w-full max-w-[1400px] px-5 pb-20 pt-6 sm:px-8">
        <AnimatePresence mode="wait" initial={false}>
          <Outlet
            key={location.pathname}
            context={{ data, setData, loading, reload: () => load(true) }}
          />
        </AnimatePresence>
      </main>
    </div>
  )
}
