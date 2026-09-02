import { forwardRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * Labelled field with an animated error message and optional password reveal.
 */
export const Input = forwardRef(function Input(
  { label, error, hint, icon: Icon, type = 'text', className, containerClassName, id, ...rest },
  ref,
) {
  const [reveal, setReveal] = useState(false)
  const isPassword = type === 'password'
  const resolvedType = isPassword && reveal ? 'text' : type
  const fieldId = id ?? rest.name

  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label htmlFor={fieldId} className="mb-1.5 block text-[13px] font-medium text-muted">
          {label}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
            strokeWidth={1.9}
          />
        )}
        <input
          ref={ref}
          id={fieldId}
          type={resolvedType}
          aria-invalid={Boolean(error)}
          className={cn(
            'h-11 w-full rounded-xl border bg-[rgb(var(--c-hairline)/0.04)] px-3.5 text-sm text-ink',
            'placeholder:text-faint transition-all duration-200',
            'border-[rgb(var(--c-hairline)/0.12)]',
            'hover:border-[rgb(var(--c-hairline)/0.2)]',
            'focus:border-[rgb(var(--c-brand)/0.6)] focus:bg-[rgb(var(--c-hairline)/0.02)] focus:outline-none',
            'focus:ring-4 focus:ring-[rgb(var(--c-brand)/0.12)]',
            Icon && 'pl-10',
            isPassword && 'pr-11',
            error && 'border-[rgb(var(--c-danger)/0.55)] focus:ring-[rgb(var(--c-danger)/0.14)]',
            className,
          )}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-faint transition-colors hover:text-ink"
          >
            {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {error ? (
          <motion.p
            key="error"
            initial={{ opacity: 0, height: 0, y: -4 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1.5 overflow-hidden pt-1.5 text-[12.5px] text-danger"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
            {error}
          </motion.p>
        ) : hint ? (
          <p key="hint" className="pt-1.5 text-[12.5px] text-faint">
            {hint}
          </p>
        ) : null}
      </AnimatePresence>
    </div>
  )
})

export const Select = forwardRef(function Select({ label, error, children, className, id, ...rest }, ref) {
  const fieldId = id ?? rest.name
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={fieldId} className="mb-1.5 block text-[13px] font-medium text-muted">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={fieldId}
        className={cn(
          'h-11 w-full appearance-none rounded-xl border border-[rgb(var(--c-hairline)/0.12)]',
          'bg-[rgb(var(--c-hairline)/0.04)] px-3.5 text-sm text-ink transition-all duration-200',
          'focus:border-[rgb(var(--c-brand)/0.6)] focus:outline-none focus:ring-4 focus:ring-[rgb(var(--c-brand)/0.12)]',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      {error && <p className="pt-1.5 text-[12.5px] text-danger">{error}</p>}
    </div>
  )
})

export default Input
