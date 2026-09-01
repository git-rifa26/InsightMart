import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, Building2, UserRound, ArrowRight, AlertCircle, Check } from 'lucide-react'

import AuthLayout from '@/components/layout/AuthLayout'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { PageTransition } from '@/components/motion'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { EASE } from '@/lib/motion'
import { cn } from '@/lib/cn'

const ACCOUNT_TYPES = [
  {
    id: 'individual',
    label: 'Individual',
    icon: UserRound,
    blurb: 'A single-person account with Dashboard and CSV Analysis.',
  },
  {
    id: 'enterprise',
    label: 'Enterprise',
    icon: Building2,
    blurb: 'Create an organisation, invite a team and share analysis.',
  },
]

/** Cheap, legible strength signal - length, case mix, digits, symbols. */
function scorePassword(value = '') {
  let score = 0
  if (value.length >= 8) score += 1
  if (value.length >= 12) score += 1
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1
  if (/\d/.test(value)) score += 1
  if (/[^A-Za-z0-9]/.test(value)) score += 1
  return Math.min(score, 4)
}

const STRENGTH = [
  { label: 'Too short', tone: 'bg-danger', text: 'text-danger' },
  { label: 'Weak', tone: 'bg-danger', text: 'text-danger' },
  { label: 'Fair', tone: 'bg-warn', text: 'text-warn' },
  { label: 'Good', tone: 'bg-success', text: 'text-success' },
  { label: 'Strong', tone: 'bg-success', text: 'text-success' },
]

export default function Register() {
  const { register: createAccount, pending } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [accountType, setAccountType] = useState('individual')
  const [formError, setFormError] = useState(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: { name: '', email: '', organisationName: '', password: '', confirm: '' },
  })

  const password = watch('password', '')
  const strength = scorePassword(password)
  const isEnterprise = accountType === 'enterprise'

  const onSubmit = async (values) => {
    setFormError(null)
    try {
      const user = await createAccount({ ...values, accountType })
      toast.success(`Account created. Welcome, ${user.name.split(' ')[0]}.`)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setFormError(error.message)
    }
  }

  return (
    <PageTransition>
      <AuthLayout
        title="Create your account"
        subtitle="Start on the free plan. No payment details required."
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Account type - the choice that drives role and routing */}
          <div>
            <p className="mb-2 text-[13px] font-medium text-muted">Account type</p>
            <div className="relative grid grid-cols-2 gap-1.5 rounded-xl border border-[rgb(var(--c-hairline)/0.11)] bg-[rgb(var(--c-hairline)/0.03)] p-1.5">
              {ACCOUNT_TYPES.map((type) => {
                const active = accountType === type.id
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setAccountType(type.id)}
                    aria-pressed={active}
                    className="relative rounded-lg px-3 py-2.5 text-center transition-colors duration-200"
                  >
                    {active && (
                      <motion.span
                        layoutId="account-type-pill"
                        className="absolute inset-0 rounded-lg bg-[rgb(var(--c-brand)/0.15)] ring-1 ring-[rgb(var(--c-brand)/0.4)]"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                    <span className="relative flex items-center justify-center gap-2">
                      <type.icon
                        className={cn('h-4 w-4', active ? 'text-brand' : 'text-faint')}
                        strokeWidth={1.95}
                      />
                      <span
                        className={cn(
                          'text-[13.5px] font-medium',
                          active ? 'text-ink' : 'text-muted',
                        )}
                      >
                        {type.label}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.p
                key={accountType}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.22 }}
                className="mt-2 text-[12.5px] leading-relaxed text-faint"
              >
                {ACCOUNT_TYPES.find((t) => t.id === accountType)?.blurb}
              </motion.p>
            </AnimatePresence>
          </div>

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
            label="Full name"
            icon={User}
            placeholder="Ananya Rao"
            autoComplete="name"
            error={errors.name?.message}
            {...register('name', {
              required: 'Enter your name.',
              minLength: { value: 2, message: 'That name looks too short.' },
            })}
          />

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

          {/* Only Enterprise accounts name an organisation */}
          <AnimatePresence initial={false}>
            {isEnterprise && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="overflow-hidden"
              >
                <div className="pt-0.5">
                  <Input
                    label="Organisation name"
                    icon={Building2}
                    placeholder="Northwind Retail Group"
                    hint="You can invite team members once your account is created."
                    error={errors.organisationName?.message}
                    {...register('organisationName', {
                      validate: (value) =>
                        !isEnterprise || value.trim().length > 1 || 'Name your organisation.',
                    })}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <Input
              label="Password"
              type="password"
              icon={Lock}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register('password', {
                required: 'Choose a password.',
                minLength: { value: 8, message: 'Use at least 8 characters.' },
              })}
            />

            {/* Strength meter */}
            <AnimatePresence>
              {password.length > 0 && !errors.password && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.24 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-2 pt-2">
                    <div className="flex flex-1 gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <span
                          key={i}
                          className="h-1 flex-1 overflow-hidden rounded-full bg-[rgb(var(--c-hairline)/0.1)]"
                        >
                          <motion.span
                            className={cn('block h-full rounded-full', STRENGTH[strength].tone)}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: i < strength ? 1 : 0 }}
                            style={{ transformOrigin: 'left' }}
                            transition={{ duration: 0.3, ease: EASE }}
                          />
                        </span>
                      ))}
                    </div>
                    <span className={cn('text-[12px] font-medium', STRENGTH[strength].text)}>
                      {STRENGTH[strength].label}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Input
            label="Confirm password"
            type="password"
            icon={Lock}
            placeholder="Repeat your password"
            autoComplete="new-password"
            error={errors.confirm?.message}
            {...register('confirm', {
              required: 'Confirm your password.',
              validate: (value) => value === password || 'The passwords do not match.',
            })}
          />

          <label className="flex cursor-pointer items-start gap-2.5 pt-1 text-[13px] leading-relaxed text-muted">
            <input
              type="checkbox"
              {...register('terms', { required: 'Please accept the terms to continue.' })}
              className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-[rgb(var(--c-hairline)/0.3)] accent-[rgb(var(--c-brand))]"
            />
            <span>
              I agree to the terms of service and privacy policy.
              {errors.terms && <span className="mt-1 block text-danger">{errors.terms.message}</span>}
            </span>
          </label>

          <Button type="submit" size="lg" loading={pending} iconRight={ArrowRight} className="w-full">
            Create account
          </Button>

          <ul className="space-y-1.5 pt-1">
            {['No payment details required', 'Free plan includes core metrics', 'Upgrade or downgrade at any time'].map(
              (item) => (
                <li key={item} className="flex items-center gap-2 text-[12.5px] text-faint">
                  <Check className="h-3.5 w-3.5 shrink-0 text-success" strokeWidth={2.5} />
                  {item}
                </li>
              ),
            )}
          </ul>
        </form>

        <p className="mt-8 text-center text-[13.5px] text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand transition-opacity hover:opacity-80">
            Sign in
          </Link>
        </p>
      </AuthLayout>
    </PageTransition>
  )
}
