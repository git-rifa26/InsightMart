import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { STORAGE_KEYS } from '@/lib/constants'

const ThemeContext = createContext(null)

const resolve = (mode) => {
  if (mode !== 'system') return mode
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Holds the user's theme preference ('dark' | 'light' | 'system') and keeps
 * the resolved value stamped on <html data-theme>. The matching boot script
 * in index.html applies it before first paint so nothing flashes.
 */
export function ThemeProvider({ children }) {
  const [mode, setMode] = useLocalStorage(STORAGE_KEYS.theme, 'dark')
  const [resolved, setResolved] = useState(() => resolve(mode))

  useEffect(() => {
    const next = resolve(mode)
    setResolved(next)
    document.documentElement.setAttribute('data-theme', next)
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', next === 'dark' ? '#0A0B10' : '#FAFAFC')
  }, [mode])

  // Follow the OS only while the user has actually chosen 'system'.
  useEffect(() => {
    if (mode !== 'system') return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setMode('system')
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [mode, setMode])

  const toggle = useCallback(() => {
    setMode(resolve(mode) === 'dark' ? 'light' : 'dark')
  }, [mode, setMode])

  const value = useMemo(
    () => ({ mode, resolved, isDark: resolved === 'dark', setMode, toggle }),
    [mode, resolved, setMode, toggle],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside a ThemeProvider')
  return context
}
