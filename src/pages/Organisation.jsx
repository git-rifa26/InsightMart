import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Building2, Users, Clock, Upload, ShieldCheck, Crown, Eye } from 'lucide-react'

import ChartCard from '@/components/ChartCard'
import TeamMembers from '@/components/TeamMembers'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { UsageMeter } from '@/components/ui/Progress'
import { PageTransition, Reveal, CountUp } from '@/components/motion'
import { organisationApi, errorMessage } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { ROLES } from '@/lib/constants'
import { number, shortDate } from '@/lib/formatters'
import { EASE } from '@/lib/motion'

export default function Organisation() {
  const { user, role } = useAuth()
  const toast = useToast()
  const [org, setOrg] = useState(null)
  const [loading, setLoading] = useState(true)

  // The Enterprise account that owns the organisation is its team lead.
  // Admins can manage any organisation; invited members are read-only.
  const isLead = role === ROLES.ENTERPRISE || role === ROLES.ADMIN
  const canManage = isLead

  useEffect(() => {
    let cancelled = false
    organisationApi
      .get()
      .then(({ organisation }) => !cancelled && setOrg(organisation))
      .catch(
        (error) => !cancelled && toast.error(errorMessage(error, 'Could not load your organisation.')),
      )
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const members = org?.members ?? []
  const active = members.filter((m) => m.status === 'active').length
  const pending = members.filter((m) => m.status === 'invited')
  const totalUploads = members.reduce((sum, m) => sum + m.uploads, 0)
  const me = members.find((m) => m.email === user?.email)

  return (
    <PageTransition className="space-y-6">
      {/* Organisation header */}
      <Reveal>
        <div className="glass rim relative overflow-hidden rounded-2xl p-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                'radial-gradient(60% 100% at 0% 0%, rgb(var(--c-brand) / 0.12), transparent 60%)',
            }}
          />
          <div className="relative flex flex-wrap items-start justify-between gap-5">
            <div className="flex items-start gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-gradient text-white">
                <Building2 className="h-6 w-6" strokeWidth={1.8} />
              </span>
              <div>
                <h1 className="font-display text-[24px] font-semibold tracking-[-0.025em] text-ink">
                  {org?.name ?? 'Your organisation'}
                </h1>
                <p className="mt-1 text-[13.5px] text-muted">
                  {org?.industry} &middot; created {org ? shortDate(org.createdAt) : '—'}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge tone="brand" icon={ShieldCheck}>
                    Enterprise plan
                  </Badge>
                  <Badge tone="neutral" icon={Users}>
                    {members.length} members
                  </Badge>
                  {/* What the signed-in person can do here */}
                  {canManage ? (
                    <Badge tone="violet" icon={Crown}>
                      You are the team lead
                    </Badge>
                  ) : (
                    <Badge tone="neutral" icon={Eye}>
                      You are a {me?.role ?? 'team member'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Summary tiles */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Active members', value: active, icon: Users },
          { label: 'Pending invitations', value: pending.length, icon: Clock },
          { label: 'Uploads by team', value: totalUploads, icon: Upload },
        ].map((tile, i) => (
          <motion.div
            key={tile.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE, delay: i * 0.07 }}
            className="glass rim rounded-2xl p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[12px] font-medium uppercase tracking-[0.07em] text-faint">
                  {tile.label}
                </p>
                <p className="mt-2 font-display text-[26px] font-semibold leading-none text-ink">
                  <CountUp value={tile.value} format={(v) => number(Math.round(v))} delay={i * 0.07} />
                </p>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-[rgb(var(--c-brand)/0.12)] text-brand">
                <tile.icon className="h-[17px] w-[17px]" strokeWidth={1.9} />
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Seat usage - only the lead acts on this */}
      {canManage && (
        <Reveal>
          <div className="glass rim rounded-2xl p-5 sm:p-6">
            <UsageMeter
              label="Seats used"
              used={org?.seatsUsed ?? 0}
              limit={org?.seatLimit ?? 25}
              unit="seats"
            />
            <p className="mt-3 text-[12.5px] text-muted">
              Enterprise includes {org?.seatLimit ?? 25} seats. Members share the organisation's
              uploads and analysis.
            </p>
          </div>
        </Reveal>
      )}

      {/* Team members - management for the lead, read-only for everyone else */}
      {loading ? (
        <ChartCard loading title="Team members" icon={Users} />
      ) : (
        <TeamMembers organisation={org} onChange={setOrg} canManage={canManage} />
      )}

      {/* Pending invitations - a lead-only concern */}
      {canManage && pending.length > 0 && (
        <ChartCard
          title="Pending invitations"
          description="These people have been invited but have not joined yet."
          icon={Clock}
        >
          <ul className="space-y-2.5">
            {pending.map((member, i) => (
              <motion.li
                key={member.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                className="flex items-center justify-between gap-4 rounded-xl border border-[rgb(var(--c-hairline)/0.1)] px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-medium text-ink">{member.name}</p>
                  <p className="truncate text-[12px] text-faint">{member.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone="warn">{member.role}</Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toast.info(`Invitation resent to ${member.email}.`)}
                  >
                    Resend
                  </Button>
                </div>
              </motion.li>
            ))}
          </ul>
        </ChartCard>
      )}
    </PageTransition>
  )
}
