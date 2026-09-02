import { cn } from '@/lib/cn'

const TONES = {
  neutral: 'bg-[rgb(var(--c-hairline)/0.08)] text-muted',
  brand: 'bg-[rgb(var(--c-brand)/0.14)] text-brand',
  success: 'bg-[rgb(var(--c-success)/0.14)] text-success',
  warn: 'bg-[rgb(var(--c-warn)/0.15)] text-warn',
  danger: 'bg-[rgb(var(--c-danger)/0.14)] text-danger',
  violet: 'bg-[rgb(var(--c-violet)/0.16)] text-[rgb(var(--c-violet))]',
  cyan: 'bg-[rgb(var(--c-cyan)/0.16)] text-[rgb(var(--c-cyan))]',
}

export function Badge({ children, tone = 'neutral', className, dot = false, icon: Icon }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium leading-none tracking-wide',
        TONES[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {Icon && <Icon className="h-3 w-3" strokeWidth={2.2} />}
      {children}
    </span>
  )
}

export default Badge
