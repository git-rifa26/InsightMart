import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageSquare, X, Send, Headset } from 'lucide-react'

import Badge from '@/components/ui/Badge'
import { chatApi } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { CHAT_SEED } from '@/services/mock/mockData'
import { cn } from '@/lib/cn'
import { SPRING, EASE } from '@/lib/motion'

/**
 * Support panel that sits alongside the analytics view, per section 5.4 of
 * the documentation. Slides in from the right on smaller screens and docks
 * as a column on wide ones.
 */
export function ChatSidebar({ open, onClose, docked = false }) {
  const { plan } = useAuth()
  const [messages, setMessages] = useState(CHAT_SEED)
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  const send = async (event) => {
    event.preventDefault()
    const text = draft.trim()
    if (!text || typing) return

    const outgoing = { id: `msg_${Date.now()}`, author: 'user', text, at: new Date().toISOString() }
    setMessages((list) => [...list, outgoing])
    setDraft('')
    setTyping(true)

    try {
      const { message } = await chatApi.send({ text })
      setMessages((list) => [...list, message])
    } catch {
      setMessages((list) => [
        ...list,
        {
          id: `msg_err_${Date.now()}`,
          author: 'agent',
          text: 'I could not reach support just now. Please try again in a moment.',
          at: new Date().toISOString(),
        },
      ])
    } finally {
      setTyping(false)
    }
  }

  const panel = (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-[rgb(var(--c-hairline)/0.09)] px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[rgb(var(--c-brand)/0.13)] text-brand">
            <Headset className="h-4 w-4" strokeWidth={1.9} />
          </span>
          <div>
            <p className="text-[13.5px] font-semibold leading-tight text-ink">Support</p>
            <p className="text-[11.5px] text-faint">Usually replies in a minute</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={plan.id === 'free' ? 'neutral' : 'brand'}>
            {plan.id === 'free' ? 'Basic' : 'Priority'}
          </Badge>
          {!docked && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close support panel"
              className="rounded-md p-1.5 text-faint transition-colors hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((message) => {
          const mine = message.author === 'user'
          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.32, ease: EASE }}
              className={cn('flex', mine ? 'justify-end' : 'justify-start')}
            >
              <p
                className={cn(
                  'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed',
                  mine
                    ? 'rounded-br-md bg-brand-gradient text-white'
                    : 'rounded-bl-md bg-[rgb(var(--c-hairline)/0.06)] text-ink',
                )}
              >
                {message.text}
              </p>
            </motion.div>
          )
        })}

        <AnimatePresence>
          {typing && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
              <span className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-[rgb(var(--c-hairline)/0.06)] px-4 py-3">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-faint"
                    animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form onSubmit={send} className="border-t border-[rgb(var(--c-hairline)/0.09)] p-3">
        <div className="flex items-center gap-2 rounded-xl border border-[rgb(var(--c-hairline)/0.12)] bg-[rgb(var(--c-hairline)/0.04)] px-3 py-1.5 transition-colors focus-within:border-[rgb(var(--c-brand)/0.5)]">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask about uploads, charts or exports"
            aria-label="Message support"
            className="h-8 flex-1 bg-transparent text-[13px] text-ink placeholder:text-faint focus:outline-none"
          />
          <motion.button
            type="submit"
            disabled={!draft.trim() || typing}
            whileTap={{ scale: 0.9 }}
            aria-label="Send message"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-gradient text-white disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" strokeWidth={2.2} />
          </motion.button>
        </div>
      </form>
    </div>
  )

  if (docked) {
    return (
      <div className="hidden w-[320px] shrink-0 border-l border-[rgb(var(--c-hairline)/0.09)] bg-[rgb(var(--c-surface)/0.5)] backdrop-blur-xl xl:block">
        {panel}
      </div>
    )
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm xl:hidden"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={SPRING}
            className="glass fixed inset-y-0 right-0 z-50 w-[min(22rem,100vw)] xl:hidden"
          >
            {panel}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

/** Floating trigger shown when the panel is not docked. */
export function ChatLauncher({ onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.6, type: 'spring', stiffness: 320, damping: 22 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.94 }}
      aria-label="Open support panel"
      className="fixed bottom-5 right-5 z-30 grid h-12 w-12 place-items-center rounded-full bg-brand-gradient text-white shadow-[0_12px_36px_-10px_rgb(var(--c-brand)/0.9)] xl:hidden"
    >
      <MessageSquare className="h-5 w-5" strokeWidth={2} />
      <span className="absolute inset-0 animate-pulse-ring rounded-full bg-[rgb(var(--c-brand)/0.4)]" />
    </motion.button>
  )
}

export default ChatSidebar
