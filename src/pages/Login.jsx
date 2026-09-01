import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, ArrowRight, AlertCircle, UserRound, Building2, ShieldCheck, Copy, Check } from 'lucide-react'

import AuthLayout from '@/components/layout/AuthLayout'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { PageTransition } from '@/components/motion'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { DEMO_PASSWORD } from '@/services/mock/mockData'
import { EASE } from '@/lib/motion'
import { cn } from '@/lib/cn'

/**
 * The three seeded accounts. Selecting one fills the form so every
 * role-gated page can be reached without a backend.
 */
const DEMO_LOGINS = [
  {
    role: 'Individual',
    email: 'individual@insightmart.dev',
    icon: UserRound,
    blurb: 'Dashboard and CSV Analysis',
    tone: 'text-brand bg-[rgb(var(--c-brand)/0.12)]',
  },
  {
    role: 'Enterprise',
    email: 'enterprise@insightmart.dev',
    icon: Building2,
    blurb: 'Adds the Organisation page',
    tone: 'text-[rgb(var(--c-violet))] bg-[rgb(var(--c-violet)/0.14)]',
  },
  {
    role: 'Admin',
    email: 'admin@insightmart.dev',
    icon: ShieldCheck,
    blurb: 'Full platform oversight',
    tone: 'text-[rgb(var(--c-cyan))] bg-[rgb(var(--c-cyan)/0.14)]',
  },
]

export default function Login() {
  const { login, pending } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [formError, setFormError] = useState(null)
  const [copied, setCopied] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({ defaultValues: { email: '', password: '' } })

  const redirectTo = location.state?.from ?? '/dashboard'

  const onSubmit = async (values) => {
    setFormError(null)
    try {
      const user = await login(values)
      toast.success(`Signed in as ${user.name}.`)
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setFormError(error.message)
    }
  }

  /** Fill both fields, then submit so one click reaches the dashboard. */
  const useDemo = async (account) => {
    setValue('email', account.email, { shouldValidate: true })
    setValue('password', DEMO_PASSWORD, { shouldValidate: true })
    setFormError(null)
    await onSubmit({ email: account.email, password: DEMO_PASSWORD })
  }

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(DEMO_PASSWORD)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      toast.info(`Demo password: ${DEMO_PASSWORD}`)
    }
  }

  return (
    <PageTransition>
      <AuthLayout
        title="Welcome back"
        subtitle="Sign in to reach your dashboard, analysis and reports."
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <AnimatePresence>
            {formError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="overflow-hidden"
              >
                <p className="flex items-start gap-2 rounded-xl border border-[rgb(var(--c-danger)/0.3)] bg-[rgb(var(--c-danger)/0.09)] p-3 text-[13px] text-danger">
                  <AlertCircle className="mt-px h-4 w-4 shrink-0" strokeWidth={2.1} />
                  {formError}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <Input
            label="Email address"
            type="email"
            icon={Mail}
            placeholder="you@company.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email', {
              required: 'Enter your email address.',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'That does not look like a valid email.' },
            })}
          />

          <Input
            label="Password"
            type="password"
            icon={Lock}
            placeholder="Your password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password', {
              required: 'Enter your password.',
              minLength: { value: 6, message: 'Passwords are at least 6 characters.' },
            })}
          />

          <div className="flex items-center justify-between pt-1">
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-muted">
              <input
                type="checkbox"
                {...register('remember')}
                className="h-3.5 w-3.5 rounded border-[rgb(var(--c-hairline)/0.3)] accent-[rgb(var(--c-brand))]"
              />
              Keep me signed in
            </label>
            <button
              type="button"
              onClick={() => toast.info('Password recovery is handled by the Flask auth service.')}
              className="text-[13px] font-medium text-brand transition-opacity hover:opacity-80"
            >
              Forgot password?
            </button>
          </div>

          <Button type="submit" size="lg" loading={pending} iconRight={ArrowRight} className="w-full">
            Sign in
          </Button>
        </form>

        {/* Demo credentials */}
        <div className="mt-8">
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-[rgb(var(--c-hairline)/0.12)]" />
            <span className="text-[11.5px] font-medium uppercase tracking-[0.1em] text-faint">
              Demo accounts
            </span>
            <span className="h-px flex-1 bg-[rgb(var(--c-hairline)/0.12)]" />
          </div>

          <p className="mt-4 text-[13px] leading-relaxed text-muted">
            The backend is mocked, so these seeded accounts sign in immediately. Pick one to fill the
            form and continue.
          </p>

          <div className="mt-4 space-y-2">
            {DEMO_LOGINS.map((account, i) => (
              <motion.button
                key={account.email}
                type="button"
                onClick={() => useDemo(account)}
                disabled={pending}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE, delay: 0.15 + i * 0.07 }}
                whileHover={{ x: 3 }}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-xl border p-3 text-left',
                  'border-[rgb(var(--c-hairline)/0.11)] bg-[rgb(var(--c-hairline)/0.03)]',
                  'transition-colors duration-200 hover:border-[rgb(var(--c-brand)/0.4)]',
                  'disabled:pointer-events-none disabled:opacity-60',
                )}
              >
                <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg', account.tone)}>
                  <account.icon className="h-[17px] w-[17px]" strokeWidth={1.9} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="text-[13.5px] font-semibold leading-tight text-ink">
                      {account.role}
                    </span>
                    <span className="truncate text-[11.5px] text-faint">{account.blurb}</span>
                  </span>
                  <span className="mt-1 block font-mono text-[11.5px] text-muted">
                    {account.email}
                  </span>
                </span>

                <ArrowRight
                  className="h-4 w-4 shrink-0 text-faint transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-brand"
                  strokeWidth={2}
                />
              </motion.button>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[rgb(var(--c-hairline)/0.11)] bg-[rgb(var(--c-hairline)/0.03)] px-3.5 py-2.5">
            <div className="min-w-0">
              <p className="text-[11.5px] font-medium uppercase tracking-[0.08em] text-faint">
                Password for all three
              </p>
              <p className="mt-0.5 font-mono text-[13.5px] font-medium text-ink">{DEMO_PASSWORD}</p>
            </div>
            <button
              type="button"
              onClick={copyPassword}
              aria-label="Copy demo password"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[rgb(var(--c-hairline)/0.12)] text-muted transition-colors hover:text-ink"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={copied ? 'done' : 'copy'}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.16 }}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-success" strokeWidth={2.4} />
                  ) : (
                    <Copy className="h-3.5 w-3.5" strokeWidth={2} />
                  )}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-[13.5px] text-muted">
          New to InsightMart?{' '}
          <Link to="/register" className="font-medium text-brand transition-opacity hover:opacity-80">
            Create an account
          </Link>
        </p>
      </AuthLayout>
    </PageTransition>
  )
}
