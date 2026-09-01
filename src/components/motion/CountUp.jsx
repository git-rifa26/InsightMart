import { useCountUp } from '@/hooks/useCountUp'
import { cn } from '@/lib/cn'

/**
 * Renders a number that animates up from zero when scrolled into view.
 * `format` receives the live value so currency/percent styles all work.
 */
export function CountUp({ value, format = (v) => v.toLocaleString(), className, duration = 1.6, delay = 0, decimals = 0 }) {
  const { ref, display } = useCountUp(value, { duration, delay, decimals })

  return (
    <span ref={ref} className={cn('numeric', className)}>
      {format(display)}
    </span>
  )
}

export default CountUp
