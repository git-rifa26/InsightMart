import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { AnimatePresence, motion } from 'framer-motion'
import {
  User,
  Mail,
  Lock,
  ShieldCheck,
  CreditCard,
  Building2,
  Check,
  Sparkles,
  LogOut,
  Calendar,
} from 'lucide-react'

import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import { UnderlineTabs } from '@/components/ui/Tabs'
import { UsageMeter } from '@/components/ui/Progress'
import { PageTransition, Reveal } from '@/components/motion'
import { accountApi, errorMessage } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { PLANS, ROLE_LABEL } from '@/lib/constants'
import { initials, shortDate, currency } from '@/lib/formatters'
import { EASE } from '@/lib/motion'
import { cn } from '@/lib/cn'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'subscription', label: 'Subscription', icon: CreditCard },
]

function ProfileTab() {
  const { user, updateProfile } = useAuth()
  const toast = useToast()
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '' },
  })

  const onSubmit = async (values) => {
    setSaving(true)
    try {
      await updateProfile(values)
      toast.success('Your profile has been updated.')
    } catch (error) {
      toast.error(errorMessage(error, 'Those changes did not save.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="glass rim rounded-2xl p-6">
        <h2 className="text-[15px] font-semibold text-ink">Profile details</h2>
        <p className="mt-1 text-[12.5px] text-muted">
          This is what appears on your uploads and inside your organisation.
        </p>

        <div className="mt-6 space-y-4">
          <Input
            label="Full name"
            icon={User}
            error={errors.name?.message}
            {...register('name', { required: 'Enter your name.' })}
          />
          <Input
            label="Email address"
            type="email"
            icon={Mail}
            error={errors.email?.message}
            {...register('email', {
              required: 'Enter your email address.',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'That does not look like a valid email.' },
            })}
          />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button type="submit" loading={saving} disabled={!isDirty}>
            Save changes
          </Button>
          {!isDirty && <p className="text-[12.5px] text-faint">No changes to save</p>}
        </div>
      </form>

      {/* Identity card */}
      <div className="glass rim h-fit rounded-2xl p-6 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-gradient font-display text-[20px] font-semibold text-white">
          {initials(user?.name ?? '')}
        </span>
        <p className="mt-4 text-[15px] font-semibold text-ink">{user?.name}</p>
        <p className="mt-0.5 text-[12.5px] text-muted">{user?.email}</p>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Badge tone="brand" icon={ShieldCheck}>
            {ROLE_LABEL[user?.role] ?? 'Member'}
          </Badge>
        </div>

        <div className="my-5 divider" />

        <dl className="space-y-2.5 text-left">
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-1.5 text-[12.5px] text-muted">
              <Calendar className="h-3.5 w-3.5" strokeWidth={1.9} />
              Member since
            </dt>
            <dd className="text-[12.5px] font-medium text-ink">{shortDate(user?.joinedAt)}</dd>
          </div>
          {user?.organisationId && (
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-1.5 text-[12.5px] text-muted">
                <Building2 className="h-3.5 w-3.5" strokeWidth={1.9} />
                Organisation
              </dt>
              <dd className="text-[12.5px] font-medium text-ink">
                {user.organisationName ?? '—'}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  )
}

function SecurityTab() {
  const { logout } = useAuth()
  const toast = useToast()
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { currentPassword: '', newPassword: '', confirm: '' } })

  const newPassword = watch('newPassword', '')

  const onSubmit = async (values) => {
    setSaving(true)
    try {
      await accountApi.changePassword(values)
      toast.success('Your password has been changed.')
      reset()
    } catch (error) {
      toast.error(errorMessage(error, 'That password change did not go through.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="glass rim rounded-2xl p-6">
        <h2 className="text-[15px] font-semibold text-ink">Change password</h2>
        <p className="mt-1 text-[12.5px] text-muted">
          Passwords are hashed by the backend before they are stored.
        </p>

        <div className="mt-6 space-y-4">
          <Input
            label="Current password"
            type="password"
            icon={Lock}
            autoComplete="current-password"
            hint="For the demo accounts this is demo1234"
            error={errors.currentPassword?.message}
            {...register('currentPassword', { required: 'Enter your current password.' })}
          />
          <Input
            label="New password"
            type="password"
            icon={Lock}
            autoComplete="new-password"
            error={errors.newPassword?.message}
            {...register('newPassword', {
              required: 'Choose a new password.',
              minLength: { value: 8, message: 'Use at least 8 characters.' },
            })}
          />
          <Input
            label="Confirm new password"
            type="password"
            icon={Lock}
            autoComplete="new-password"
            error={errors.confirm?.message}
            {...register('confirm', {
              required: 'Confirm your new password.',
              validate: (value) => value === newPassword || 'The passwords do not match.',
            })}
          />
        </div>

        <Button type="submit" loading={saving} className="mt-6">
          Update password
        </Button>
      </form>

      <div className="glass rim h-fit rounded-2xl p-6">
        <h3 className="text-[14.5px] font-semibold text-ink">Session</h3>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
          Signing out clears your token from this browser. You will need to sign in again to reach
          the dashboard.
        </p>
        <Button variant="secondary" icon={LogOut} className="mt-4 w-full" onClick={logout}>
          Sign out
        </Button>
      </div>
    </div>
  )
}

function SubscriptionTab() {
  const { user, plan, changePlan } = useAuth()
  const toast = useToast()
  const [switching, setSwitching] = useState(null)

  const handleChange = async (planId) => {
    setSwitching(planId)
    try {
      await changePlan(planId)
      toast.success(`You are now on the ${PLANS.find((p) => p.id === planId).name} plan.`)
    } catch (error) {
      toast.error(errorMessage(error, 'That plan change did not go through.'))
    } finally {
      setSwitching(null)
    }
  }

  const uploadsUsed = user?.uploadsThisMonth ?? 0
  const uploadLimit = user?.uploadLimit ?? plan.limits.uploadsPerDay * 30

  return (
    <div className="space-y-4">
      {/* Current plan */}
      <div className="glass rim relative overflow-hidden rounded-2xl p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(55% 100% at 100% 0%, rgb(var(--c-brand) / 0.13), transparent 60%)',
          }}
        />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.07em] text-faint">
              Current plan
            </p>
            <div className="mt-2 flex items-center gap-2.5">
              <h2 className="font-display text-[26px] font-semibold leading-none text-ink">
                {plan.name}
              </h2>
              {plan.highlight && <Badge tone="brand">Most popular</Badge>}
            </div>
            <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-muted">{plan.tagline}</p>
          </div>

          <div className="text-right">
            <p className="font-display text-[26px] font-semibold leading-none text-ink">
              {plan.price.monthly === 0 ? 'Free' : currency(plan.price.monthly)}
            </p>
            {plan.price.monthly > 0 && <p className="mt-1 text-[12px] text-faint">per month</p>}
          </div>
        </div>

        <div className="relative mt-7 grid gap-5 sm:grid-cols-2">
          <UsageMeter label="CSV uploads this month" used={uploadsUsed} limit={uploadLimit} />
          <UsageMeter
            label="Seats used"
            used={user?.seatsUsed ?? 1}
            limit={user?.seatLimit ?? plan.limits.seats}
            unit="seats"
          />
        </div>
      </div>

      {/* Switch plan */}
      <div className="glass rim rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-semibold text-ink">Change plan</h3>
            <p className="mt-1 text-[12.5px] text-muted">
              Upgrade or downgrade at any time. No payment gateway is required in this version.
            </p>
          </div>
          <Button as={Link} to="/plans" size="sm" variant="ghost">
            Compare all features
          </Button>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {PLANS.map((option) => {
            const isCurrent = option.id === plan.id
            return (
              <div
                key={option.id}
                className={cn(
                  'rounded-xl border p-4 transition-colors duration-200',
                  isCurrent
                    ? 'border-[rgb(var(--c-brand)/0.45)] bg-[rgb(var(--c-brand)/0.06)]'
                    : 'border-[rgb(var(--c-hairline)/0.11)] hover:border-[rgb(var(--c-hairline)/0.22)]',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[14.5px] font-semibold text-ink">{option.name}</p>
                  {isCurrent && <Check className="h-4 w-4 text-brand" strokeWidth={2.6} />}
                </div>
                <p className="numeric mt-1.5 font-display text-[19px] font-semibold text-ink">
                  {option.price.monthly === 0 ? 'Free' : currency(option.price.monthly)}
                </p>
                <ul className="mt-3 space-y-1.5">
                  {option.features.slice(0, 3).map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-[12px] text-muted">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-success" strokeWidth={2.8} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  size="sm"
                  variant={isCurrent ? 'secondary' : 'primary'}
                  disabled={isCurrent}
                  loading={switching === option.id}
                  onClick={() => handleChange(option.id)}
                  className="mt-4 w-full"
                  icon={!isCurrent ? Sparkles : undefined}
                >
                  {isCurrent ? 'Current plan' : `Switch to ${option.name}`}
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function MyAccount() {
  const [tab, setTab] = useState('profile')

  return (
    <PageTransition className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <h1 className="font-display text-[24px] font-semibold tracking-[-0.025em] text-ink">
          My account
        </h1>
        <p className="mt-1 text-[13.5px] text-muted">
          Manage your profile, password and subscription.
        </p>
      </motion.div>

      <Reveal direction="none">
        <UnderlineTabs items={TABS} value={tab} onChange={setTab} layoutId="account-tabs" />
      </Reveal>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: EASE }}
        >
          {tab === 'profile' && <ProfileTab />}
          {tab === 'security' && <SecurityTab />}
          {tab === 'subscription' && <SubscriptionTab />}
        </motion.div>
      </AnimatePresence>
    </PageTransition>
  )
}
