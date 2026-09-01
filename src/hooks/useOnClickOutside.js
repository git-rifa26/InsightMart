import { useEffect } from 'react'

export function useOnClickOutside(ref, handler, active = true) {
  useEffect(() => {
    if (!active) return
    const listener = (event) => {
      const el = ref.current
      if (!el || el.contains(event.target)) return
      handler(event)
    }
    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)
    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [ref, handler, active])
}

export function useEscapeKey(handler, active = true) {
  useEffect(() => {
    if (!active) return
    const onKey = (event) => {
      if (event.key === 'Escape') handler(event)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [handler, active])
}

/** Freeze background scroll while a drawer or modal is open. */
export function useLockBodyScroll(active) {
  useEffect(() => {
    if (!active) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [active])
}
