/**
 * Shared motion language.
 *
 * Every variant here is written so that a `reduce` motion preference can
 * collapse it to an instant state change - see `useMotionSafe` below.
 */

export const EASE = [0.22, 1, 0.36, 1]
export const EASE_OUT = [0.16, 1, 0.3, 1]
export const SPRING = { type: 'spring', stiffness: 260, damping: 30, mass: 0.9 }
export const SPRING_SOFT = { type: 'spring', stiffness: 140, damping: 22 }
export const SPRING_SNAPPY = { type: 'spring', stiffness: 420, damping: 34 }

/** Page-level route transition. */
export const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.32, ease: EASE } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: 'easeIn' } },
}

/** Parent that releases its children one after another. */
export const staggerParent = (stagger = 0.06, delay = 0) => ({
  initial: {},
  animate: { transition: { staggerChildren: stagger, delayChildren: delay } },
})

/** The default child: rises and fades in. */
export const riseIn = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
}

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5, ease: EASE } },
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: EASE } },
}

export const slideFromRight = {
  initial: { x: '100%' },
  animate: { x: 0, transition: SPRING },
  exit: { x: '100%', transition: { duration: 0.25, ease: 'easeIn' } },
}

/** Modal / dialog surface. */
export const popIn = {
  initial: { opacity: 0, scale: 0.94, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0, transition: SPRING_SNAPPY },
  exit: { opacity: 0, scale: 0.97, y: 6, transition: { duration: 0.15 } },
}

/** Collapse any variant object to a no-movement version. */
export function stripMotion(variants) {
  const flat = {}
  for (const key of Object.keys(variants)) {
    flat[key] = { opacity: 1, x: 0, y: 0, scale: 1, transition: { duration: 0 } }
  }
  return flat
}

/** Split a sentence into words for per-word entry animation. */
export function toWords(text) {
  return text.split(' ').map((word, i) => ({ word, key: `${word}-${i}` }))
}
