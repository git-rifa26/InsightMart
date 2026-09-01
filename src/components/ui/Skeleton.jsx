import { cn } from '@/lib/cn'

/** Shimmering placeholder used while data resolves. */
export function Skeleton({ className }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-[rgb(var(--c-hairline)/0.07)]',
        className,
      )}
    >
      <div
        className="absolute inset-0 animate-shimmer"
        style={{
          backgroundImage:
            'linear-gradient(90deg, transparent, rgb(var(--c-hairline) / 0.09), transparent)',
          backgroundSize: '200% 100%',
        }}
      />
    </div>
  )
}

export function SkeletonCard({ className }) {
  return (
    <div className={cn('glass rim space-y-3 rounded-2xl p-6', className)}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-3 w-full" />
    </div>
  )
}

export default Skeleton
