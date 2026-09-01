import { useCallback, useRef } from 'react'
import { useMotionValue, useSpring, useTransform } from 'framer-motion'

/**
 * Tracks the pointer within an element and exposes springy tilt values.
 * Used by the hero mockup and the spotlight cards.
 */
export function useTilt({ max = 7, stiffness = 120, damping = 18 } = {}) {
  const ref = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const sx = useSpring(x, { stiffness, damping })
  const sy = useSpring(y, { stiffness, damping })

  const rotateY = useTransform(sx, [-0.5, 0.5], [-max, max])
  const rotateX = useTransform(sy, [-0.5, 0.5], [max, -max])

  const onMouseMove = useCallback(
    (event) => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      x.set((event.clientX - rect.left) / rect.width - 0.5)
      y.set((event.clientY - rect.top) / rect.height - 0.5)
    },
    [x, y],
  )

  const onMouseLeave = useCallback(() => {
    x.set(0)
    y.set(0)
  }, [x, y])

  return { ref, rotateX, rotateY, sx, sy, onMouseMove, onMouseLeave }
}

/** Raw pointer offset inside an element, in pixels. Used for the spotlight. */
export function usePointer() {
  const ref = useRef(null)
  const px = useMotionValue(-400)
  const py = useMotionValue(-400)

  const onMouseMove = useCallback(
    (event) => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      px.set(event.clientX - rect.left)
      py.set(event.clientY - rect.top)
    },
    [px, py],
  )

  const onMouseLeave = useCallback(() => {
    px.set(-400)
    py.set(-400)
  }, [px, py])

  return { ref, px, py, onMouseMove, onMouseLeave }
}
