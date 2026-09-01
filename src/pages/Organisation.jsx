import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Building2,
  UserPlus,
  Users,
  Trash2,
  Mail,
  User,
  ShieldCheck,
  Clock,
  MoreHorizontal,
  Upload,
} from 'lucide-react'

import ChartCard from '@/components/ChartCard'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input, { Select } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { UsageMeter } from '@/components/ui/Progress'
import { Table, THead, TRow, TCell } from '@/components/ui/Table'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageTransition, Reveal, CountUp } from '@/components/motion'
import { organisationApi, errorMessage } from '@/services/api'
import { useToast } from '@/context/ToastContext'
import { initials, number, relativeTime, shortDate } from '@/lib/formatters'
import { EASE } from '@/lib/motion'

const ROLE_OPTIONS = ['Owner', 'Analyst', 'Viewer']

const STATUS_TONE = { active: 'success', invited: 'warn', suspended: 'danger' }

export default function Organisation() {
  const toast = useToast()
  const [org, setOrg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [removing, setRemoving] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { name: '', email: '', role: 'Analyst' } })

  useEffect(() => {
    let cancelled = false
    organisationApi
      .get()
      .then(({ organisation }) => !cancelled && setOrg(organisation))
      .catch((error) => !cancelled && toast.error(errorMessage(error, 'Could not load your organisation.')))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onInvite = async (values) => {
    setInviting(true)
    try {
      const { member } = await organisationApi.invite(values)
      setOrg((prev) => ({
        ...prev,
        members: [...prev.members, member],
        seatsUsed: prev.seatsUsed + 1,
      }))
      toast.success(`Invitation sent to ${member.email}.`)
      reset()
      setInviteOpen(false)
    } catch (error) {
      toast.error(errorMessage(error, 'That invitation could not be sent.'))
    } finally {
      setInviting(false)
    }
  }

  const onRemove = async (member) => {
    setRemoving(member.id)
    try {
      await organisationApi.remove({ memberId: member.id })
      setOrg((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.id !== member.id),
        seatsUsed: Math.max(0, prev.seatsUsed - 1),
      }))
      toast.success(`${member.name} was removed from the organisation.`)
    } catch (error) {
      toast.error(errorMessage(error, 'That member could not be removed.'))
    } finally {
      setRemoving(null)
    }
  }

  const onRoleChange = async (member, role) => {
    const previous = org.members
    setOrg((prev) => ({
      ...prev,
      members: prev.members.map((m) => (m.id === member.id ? { ...m, role } : m)),
    }))
    try {
      await organisationApi.updateRole({ memberId: member.id, role })
      toast.success(`${member.name} is now a ${role}.`)
    } catch (error) {
      setOrg((prev) => ({ ...prev, members: previous }))
      toast.error(errorMessage(error, 'That role change did not save.'))
    }
  }

  const members = org?.members ?? []
  const active = members.filter((m) => m.status === 'active').length
  const pending = members.filter((m) => m.status === 'invited')
  const totalUploads = members.reduce((sum, m) => sum + m.uploads, 0)

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
                </div>
              </div>
            </div>

            <Button icon={UserPlus} onClick={() => setInviteOpen(true)}>
              Invite member
            </Button>
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

      {/* Seat usage */}
      <Reveal>
        <div className="glass rim rounded-2xl p-5 sm:p-6">
          <UsageMeter
            label="Seats used"
            used={org?.seatsUsed ?? 0}
            limit={org?.seatLimit ?? 25}
            unit="seats"
          />
          <p className="mt-3 text-[12.5px] text-muted">
            Enterprise includes {org?.seatLimit ?? 25} seats. Members share the organisation's uploads
            and analysis.
          </p>
        </div>
      </Reveal>

      {/* Members table */}
      <ChartCard
        loading={loading}
        title="Team members"
        description="Roles control what each person can reach inside the organisation."
        icon={Users}
        action={
          <Button size="sm" variant="secondary" icon={UserPlus} onClick={() => setInviteOpen(true)}>
            Invite
          </Button>
        }
      >
        {members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No members yet"
            description="Invite your team so they can upload files and share analysis."
            action={
              <Button size="sm" icon={UserPlus} onClick={() => setInviteOpen(true)}>
                Invite a member
              </Button>
            }
          />
        ) : (
          <Table>
            <THead
              columns={[
                { label: 'Member' },
                { label: 'Role' },
                { label: 'Status' },
                { label: 'Uploads', align: 'right' },
                { label: 'Last active', align: 'right' },
                { label: '', align: 'right' },
              ]}
            />
            <tbody>
              <AnimatePresence initial={false}>
                {members.map((member, i) => (
                  <TRow key={member.id} index={i}>
                    <TCell>
                      <span className="flex items-center gap-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-gradient text-[11.5px] font-semibold text-white">
                          {initials(member.name)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-medium text-ink">
                            {member.name}
                          </span>
                          <span className="block truncate text-[11.5px] text-faint">
                            {member.email}
                          </span>
                        </span>
                      </span>
                    </TCell>

                    <TCell>
                      {member.role === 'Owner' ? (
                        <Badge tone="brand">Owner</Badge>
                      ) : (
                        <select
                          value={member.role}
                          onChange={(event) => onRoleChange(member, event.target.value)}
                          aria-label={`Role for ${member.name}`}
                          className="rounded-lg border border-[rgb(var(--c-hairline)/0.12)] bg-transparent px-2 py-1 text-[12.5px] text-ink transition-colors hover:border-[rgb(var(--c-hairline)/0.24)] focus:border-[rgb(var(--c-brand)/0.6)] focus:outline-none"
                        >
                          {ROLE_OPTIONS.filter((r) => r !== 'Owner').map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      )}
                    </TCell>

                    <TCell>
                      <Badge tone={STATUS_TONE[member.status]} dot>
                        {member.status === 'invited'
                          ? 'Invited'
                          : member.status === 'suspended'
                            ? 'Suspended'
                            : 'Active'}
                      </Badge>
                    </TCell>

                    <TCell align="right" numeric muted>
                      {number(member.uploads)}
                    </TCell>

                    <TCell align="right" muted>
                      {member.lastActive ? relativeTime(member.lastActive) : 'Never'}
                    </TCell>

                    <TCell align="right">
                      {member.role !== 'Owner' && (
                        <button
                          type="button"
                          onClick={() => onRemove(member)}
                          disabled={removing === member.id}
                          aria-label={`Remove ${member.name}`}
                          className="rounded-lg p-1.5 text-faint opacity-0 transition-all duration-200 hover:bg-[rgb(var(--c-danger)/0.12)] hover:text-danger focus:opacity-100 group-hover:opacity-100 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                        </button>
                      )}
                    </TCell>
                  </TRow>
                ))}
              </AnimatePresence>
            </tbody>
          </Table>
        )}
      </ChartCard>

      {/* Pending invitations */}
      {pending.length > 0 && (
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

      {/* Invite modal */}
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite a team member"
        description="They will receive an email invitation to join this organisation."
      >
        <form onSubmit={handleSubmit(onInvite)} noValidate className="space-y-4">
          <Input
            label="Full name"
            icon={User}
            placeholder="Kabir Nair"
            error={errors.name?.message}
            {...register('name', { required: 'Enter their name.' })}
          />
          <Input
            label="Email address"
            type="email"
            icon={Mail}
            placeholder="kabir@company.com"
            error={errors.email?.message}
            {...register('email', {
              required: 'Enter their email address.',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'That does not look like a valid email.' },
            })}
          />
          <Select label="Role" {...register('role')}>
            <option value="Analyst">Analyst - can upload and analyse</option>
            <option value="Viewer">Viewer - can read dashboards only</option>
          </Select>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button type="button" variant="ghost" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={inviting} icon={UserPlus}>
              Send invitation
            </Button>
          </div>
        </form>
      </Modal>
    </PageTransition>
  )
}
