import { cn } from '@/lib/cn'

/**
 * The product mark: three ascending bars inside a rounded gradient tile,
 * echoing the bar charts the product is built around.
 */
export function LogoMark({ className, size = 32 }) {
  return (
    <span
      className={cn('relative inline-grid shrink-0 place-items-center rounded-[10px]', className)}
      style={{ width: size, height: size }}
    >
      <span className="absolute inset-0 rounded-[10px] bg-brand-gradient" />
      <span className="absolute inset-0 rounded-[10px] shadow-[inset_0_1px_0_0_rgb(255_255_255/0.28)]" />
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="relative"
        style={{ width: size * 0.58, height: size * 0.58 }}
        aria-hidden="true"
      >
        <rect x="3.5" y="13" width="4" height="7.5" rx="1.4" fill="white" fillOpacity="0.7" />
        <rect x="10" y="8.5" width="4" height="12" rx="1.4" fill="white" fillOpacity="0.88" />
        <rect x="16.5" y="4" width="4" height="16.5" rx="1.4" fill="white" />
      </svg>
    </span>
  )
}

export function Logo({ className, size = 32, showWordmark = true }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={size} />
      {showWordmark && (
        <span className="font-display text-[17px] font-semibold tracking-[-0.02em] text-ink">
          Insight<span className="text-muted">Mart</span>
        </span>
      )}
    </span>
  )
}

export default Logo
