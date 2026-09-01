import { cn } from '@/lib/cn'

/**
 * Fine technical grid that dissolves toward the edges of its container.
 */
export function GridBackdrop({ className, size = 48, fade = 'edges' }) {
  const id = `grid-${size}`
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0',
        fade === 'edges' ? 'mask-fade-edges' : 'mask-fade-b',
        className,
      )}
    >
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse">
            <path
              d={`M ${size} 0 L 0 0 0 ${size}`}
              fill="none"
              stroke="rgb(var(--c-hairline))"
              strokeOpacity="0.11"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
    </div>
  )
}

export default GridBackdrop
