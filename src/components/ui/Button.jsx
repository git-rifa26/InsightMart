import { forwardRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

const VARIANTS = {
  primary:
    'bg-brand-gradient text-white shadow-[0_10px_30px_-12px_rgb(var(--c-brand)/0.85)] hover:shadow-[0_16px_40px_-12px_rgb(var(--c-brand)/0.95)]',
  secondary:
    'glass text-ink hover:bg-[rgb(var(--c-hairline)/0.06)]',
  ghost: 'text-muted hover:text-ink hover:bg-[rgb(var(--c-hairline)/0.06)]',
  outline:
    'border border-[rgb(var(--c-hairline)/0.16)] text-ink hover:border-[rgb(var(--c-brand)/0.5)] hover:text-brand',
  danger: 'bg-danger text-white hover:brightness-110',
  subtle: 'bg-[rgb(var(--c-brand)/0.12)] text-brand hover:bg-[rgb(var(--c-brand)/0.18)]',
}

const SIZES = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5 rounded-lg',
  md: 'h-11 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-[52px] px-7 text-[15px] gap-2.5 rounded-xl',
}

/**
 * The single button used everywhere. The primary variant carries a sheen
 * that sweeps across on hover.
 */
export const Button = forwardRef(function Button(
  {
    children,
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon: Icon,
    iconRight: IconRight,
    as: Tag = 'button',
    ...rest
  },
  ref,
) {
  const reduce = useReducedMotion()
  const MotionTag = motion(Tag)

  return (
    <MotionTag
      ref={ref}
      disabled={Tag === 'button' ? disabled || loading : undefined}
      whileHover={reduce || disabled ? undefined : { y: -1 }}
      whileTap={reduce || disabled ? undefined : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
      className={cn(
        'group/btn relative inline-flex select-none items-center justify-center overflow-hidden font-medium',
        'transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50',
        SIZES[size],
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {variant === 'primary' && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-expo group-hover/btn:translate-x-full"
        />
      )}
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        Icon && <Icon className={cn(size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4')} strokeWidth={2} />
      )}
      <span className="relative">{children}</span>
      {IconRight && (
        <IconRight
          className={cn(
            'transition-transform duration-300 group-hover/btn:translate-x-0.5',
            size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
          )}
          strokeWidth={2}
        />
      )}
    </MotionTag>
  )
})

export default Button
