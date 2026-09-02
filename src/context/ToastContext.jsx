import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { SPRING_SNAPPY } from '@/lib/motion'

const ToastContext = createContext(null)

const TONES = {
  success: { icon: CheckCircle2, className: 'text-success', ring: 'rgb(var(--c-success)/0.3)' },
  error: { icon: XCircle, className: 'text-danger', ring: 'rgb(var(--c-danger)/0.3)' },
  warn: { icon: AlertTriangle, className: 'text-warn', ring: 'rgb(var(--c-warn)/0.3)' },
  info: { icon: Info, className: 'text-brand', ring: 'rgb(var(--c-brand)/0.3)' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const push = useCallback(
    (message, { tone = 'info', title, duration = 4200 } = {}) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      setToasts((list) => [...list.slice(-2), { id, message, tone, title }])
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), duration),
      )
      return id
    },
    [dismiss],
  )

  const toast = useMemo(
    () => ({
      push,
      dismiss,
      success: (message, options) => push(message, { ...options, tone: 'success' }),
      error: (message, options) => push(message, { ...options, tone: 'error' }),
      warn: (message, options) => push(message, { ...options, tone: 'warn' }),
      info: (message, options) => push(message, { ...options, tone: 'info' }),
    }),
    [push, dismiss],
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}

      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(24rem,calc(100vw-2.5rem))] flex-col gap-2.5"
      >
        <AnimatePresence initial={false}>
          {toasts.map((item) => {
            const tone = TONES[item.tone] ?? TONES.info
            const Icon = tone.icon
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.96, transition: { duration: 0.18 } }}
                transition={SPRING_SNAPPY}
                className="glass rim pointer-events-auto flex items-start gap-3 rounded-xl p-3.5 shadow-lift"
                style={{ boxShadow: `0 0 0 1px ${tone.ring}, 0 18px 44px -18px rgb(0 0 0 / 0.4)` }}
              >
                <Icon className={cn('mt-px h-[18px] w-[18px] shrink-0', tone.className)} strokeWidth={2} />
                <div className="min-w-0 flex-1">
                  {item.title && (
                    <p className="text-[13px] font-semibold leading-tight text-ink">{item.title}</p>
                  )}
                  <p className={cn('text-[13px] leading-snug text-muted', item.title && 'mt-0.5')}>
                    {item.message}
                  </p>
                </div>
                <button
                  onClick={() => dismiss(item.id)}
                  aria-label="Dismiss notification"
                  className="-m-1 rounded-md p-1 text-faint transition-colors hover:text-ink"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2.2} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside a ToastProvider')
  return context
}
