import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X, Search, Bell } from 'lucide-react'

import Sidebar from '@/components/Sidebar'
import ThemeToggle from '@/components/ui/ThemeToggle'
import Badge from '@/components/ui/Badge'
import { useAuth } from '@/context/AuthContext'
import { useLockBodyScroll } from '@/hooks/useOnClickOutside'
import { APP_NAV } from '@/lib/constants'
import { cn } from '@/lib/cn'
import { SPRING } from '@/lib/motion'

/**
 * Signed-in shell: navigation rail on the left, a slim top bar, the routed
 * page, and the routed content.
 */
export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { user, plan } = useAuth()
  const location = useLocation()

  useLockBodyScroll(drawerOpen)

  const current = APP_NAV.find((item) => item.to === location.pathname)

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      {/* Desktop rail */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((value) => !value)}
        className="hidden lg:flex"
      />

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={SPRING}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              <Sidebar collapsed={false} onNavigate={() => setDrawerOpen(false)} className="h-full" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[rgb(var(--c-hairline)/0.09)] bg-[rgb(var(--c-surface)/0.5)] px-4 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen((open) => !open)}
              aria-label="Open navigation"
              className="grid h-9 w-9 place-items-center rounded-lg border border-[rgb(var(--c-hairline)/0.12)] text-ink lg:hidden"
            >
              {drawerOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

            {collapsed && (
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                aria-label="Expand sidebar"
                className="hidden h-9 w-9 place-items-center rounded-lg border border-[rgb(var(--c-hairline)/0.12)] text-ink lg:grid"
              >
                <Menu className="h-4 w-4" />
              </button>
            )}

            <div className="min-w-0">
              <h1 className="truncate font-display text-[15px] font-semibold leading-tight text-ink">
                {current?.label ?? 'InsightMart'}
              </h1>
              <p className="truncate text-[11.5px] text-faint">
                Welcome back, {user?.name?.split(' ')[0] ?? 'there'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Search"
              className="hidden h-9 items-center gap-2 rounded-lg border border-[rgb(var(--c-hairline)/0.12)] px-3 text-[13px] text-faint transition-colors hover:text-ink md:flex"
            >
              <Search className="h-3.5 w-3.5" strokeWidth={2} />
              <span>Search</span>
              <kbd className="ml-2 rounded border border-[rgb(var(--c-hairline)/0.14)] px-1.5 py-0.5 font-mono text-[10px] text-faint">
                /
              </kbd>
            </button>

            <Badge tone={plan.id === 'free' ? 'neutral' : 'brand'} className="hidden sm:inline-flex">
              {plan.name}
            </Badge>

            <button
              type="button"
              aria-label="Notifications"
              className="relative grid h-9 w-9 place-items-center rounded-lg border border-[rgb(var(--c-hairline)/0.12)] text-muted transition-colors hover:text-ink"
            >
              <Bell className="h-4 w-4" strokeWidth={1.9} />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-danger" />
            </button>

            <ThemeToggle />
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
