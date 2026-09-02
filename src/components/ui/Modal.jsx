import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

import { useEscapeKey, useLockBodyScroll, useOnClickOutside } from '@/hooks/useOnClickOutside'
import { popIn } from '@/lib/motion'
import { cn } from '@/lib/cn'

export function Modal({ open, onClose, title, description, children, footer, className }) {
  const panelRef = useRef(null)

  useEscapeKey(onClose, open)
  useLockBodyScroll(open)
  useOnClickOutside(panelRef, onClose, open)

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] grid place-items-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            variants={popIn}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              'glass rim relative w-full max-w-md rounded-2xl p-6 shadow-lift',
              className,
            )}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="absolute right-4 top-4 rounded-lg p-1.5 text-faint transition-colors hover:bg-[rgb(var(--c-hairline)/0.07)] hover:text-ink"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>

            {title && <h2 className="pr-8 text-[17px] font-semibold text-ink">{title}</h2>}
            {description && (
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{description}</p>
            )}

            <div className={cn(title && 'mt-5')}>{children}</div>

            {footer && <div className="mt-6 flex justify-end gap-2.5">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export default Modal
