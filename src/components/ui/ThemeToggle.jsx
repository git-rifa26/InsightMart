import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/cn'

/** Icon button that crossfades and rotates between the sun and moon. */
export function ThemeToggle({ className }) {
  const { isDark, toggle } = useTheme()

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={cn(
        'relative grid h-9 w-9 place-items-center overflow-hidden rounded-lg',
        'border border-[rgb(var(--c-hairline)/0.12)] text-muted',
        'transition-colors duration-200 hover:text-ink hover:border-[rgb(var(--c-hairline)/0.24)]',
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? 'moon' : 'sun'}
          initial={{ opacity: 0, rotate: -70, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 70, scale: 0.6 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="absolute grid place-items-center"
        >
          {isDark ? <Moon className="h-4 w-4" strokeWidth={1.9} /> : <Sun className="h-4 w-4" strokeWidth={1.9} />}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}

export default ThemeToggle
