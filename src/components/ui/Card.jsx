import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

/** Frosted panel with a light-catching rim. The app's default surface. */
export const Card = forwardRef(function Card({ children, className, padded = true, rim = true, ...rest }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        'glass relative rounded-2xl shadow-soft',
        rim && 'rim',
        padded && 'p-5 sm:p-6',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
})

export function CardHeader({ title, description, action, className, icon: Icon }) {
  return (
    <div className={cn('mb-5 flex items-start justify-between gap-4', className)}>
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[rgb(var(--c-brand)/0.12)] text-brand">
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
          </span>
        )}
        <div>
          <h3 className="text-[15px] font-semibold leading-tight text-ink">{title}</h3>
          {description && <p className="mt-1 text-[13px] leading-relaxed text-muted">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export default Card
