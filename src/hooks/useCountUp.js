import { useEffect, useRef, useState } from 'react'
import { animate, useInView, useReducedMotion } from 'framer-motion'

/**
 * Animates a number from 0 to `value` the first time the element enters view.
 * Returns a ref to attach and the current display value.
 */
export function useCountUp(value, { duration = 1.6, decimals = 0, delay = 0 } = {}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-12% 0px' })
  const reduce = useReducedMotion()
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduce) {
      setDisplay(value)
      return
    }
    const controls = animate(0, value, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(Number(latest.toFixed(decimals))),
    })
    return () => controls.stop()
  }, [inView, value, duration, delay, decimals, reduce])

  return { ref, display }
}
