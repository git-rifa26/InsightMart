import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut, ChevronsLeft, Sparkles } from 'lucide-react'

import Logo, { LogoMark } from '@/components/ui/Logo'
import Button from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { APP_NAV, ROLE_LABEL } from '@/lib/constants'
import { initials } from '@/lib/formatters'
import { cn } from '@/lib/cn'

/**
 * Application navigation rail. The active item is marked by a shared-layout
 * pill that slides between entries rather than snapping.
 */
export function Sidebar({ collapsed, onToggleCollapse, onNavigate, className }) {
  const { user, role, plan, logout } = useAuth()
  const navigate = useNavigate()

  const items = APP_NAV.filter((item) => item.roles.includes(role))

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-[rgb(var(--c-hairline)/0.09)] bg-[rgb(var(--c-surface)/0.6)] backdrop-blur-xl',
        'transition-[width] duration-300 ease-expo',
        collapsed ? 'w-[76px]' : 'w-[248px]',
        className,
      )}
    >
      <div className={cn('flex h-16 items-center px-4', collapsed ? 'justify-center' : 'justify-between')}>
        {collapsed ? (
          <LogoMark size={30} />
        ) : (
          <>
            <Logo size={30} />
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Collapse sidebar"
              className="hidden rounded-md p-1.5 text-faint transition-colors hover:bg-[rgb(var(--c-hairline)/0.07)] hover:text-ink lg:block"
            >
              <ChevronsLeft className="h-4 w-4" strokeWidth={2} />
            </button>
          </>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium',
                'transition-colors duration-200',
                collapsed && 'justify-center px-0',
                isActive ? 'text-ink' : 'text-muted hover:text-ink',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-[rgb(var(--c-brand)/0.13)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-bar"
                    className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-gradient"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <item.icon
                  className={cn(
                    'relative h-[18px] w-[18px] shrink-0 transition-colors',
                    isActive ? 'text-brand' : 'text-faint group-hover:text-muted',
                  )}
                  strokeWidth={1.9}
                />
                {!collapsed && <span className="relative truncate">{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Upgrade nudge, only while there is somewhere to upgrade to. */}
      {!collapsed && plan.id === 'free' && (
        <div className="mx-3 mb-3 overflow-hidden rounded-xl border border-[rgb(var(--c-brand)/0.22)] bg-brand-gradient-soft p-3.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand" strokeWidth={2} />
            <p className="text-[13px] font-semibold text-ink">Unlock full analysis</p>
          </div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
            Pro adds the complete analysis suite and PDF report export.
          </p>
          <Button size="sm" className="mt-3 w-full" onClick={() => navigate('/plans')}>
            View plans
          </Button>
        </div>
      )}

      <div className="border-t border-[rgb(var(--c-hairline)/0.09)] p-3">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-gradient text-[12.5px] font-semibold text-white">
            {initials(user?.name ?? 'User')}
          </span>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium leading-tight text-ink">{user?.name}</p>
              <p className="truncate text-[11.5px] text-faint">{ROLE_LABEL[role] ?? 'Member'}</p>
            </div>
          )}
          {!collapsed && (
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Sign out"
              className="rounded-md p-1.5 text-faint transition-colors hover:bg-[rgb(var(--c-danger)/0.12)] hover:text-danger"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.9} />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
