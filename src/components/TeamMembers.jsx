import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import {
  Users,
  UserPlus,
  Trash2,
  Mail,
  User,
  Crown,
  Eye,
  BarChart3,
  Info,
} from 'lucide-react'

import ChartCard from '@/components/ChartCard'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input, { Select } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { Table, THead, TRow, TCell } from '@/components/ui/Table'
import { EmptyState } from '@/components/ui/EmptyState'
import { organisationApi, errorMessage } from '@/services/api'
import { useToast } from '@/context/ToastContext'
import { ORG_ROLE_HINT } from '@/lib/constants'
import { initials, number, relativeTime } from '@/lib/formatters'
import { cn } from '@/lib/cn'

const STATUS_TONE = { active: 'success', invited: 'warn', suspended: 'danger' }
const ROLE_ICON = { Lead: Crown, Analyst: BarChart3, Viewer: Eye }

/**
 * The organisation's team roster.
 *
 * A team lead gets management controls - invite, change role, remove. Every
 * other member sees the same roster read-only, so they know who is on the
 * team without being able to change it.
 */
export function TeamMembers({ organisation, onChange, canManage }) {
  const toast = useToast()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [removing, setRemoving] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: { name: '', email: '', role: 'Analyst' } })

  const draftRole = watch('role')
  const members = organisation?.members ?? []

  const onInvite = async (values) => {
    setInviting(true)
    try {
      const { member } = await organisationApi.invite(values)
      onChange({
        ...organisation,
        members: [...members, member],
        seatsUsed: organisation.seatsUsed + 1,
      })
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
      onChange({
        ...organisation,
        members: members.filter((m) => m.id !== member.id),
        seatsUsed: Math.max(0, organisation.seatsUsed - 1),
      })
      toast.success(`${member.name} was removed from the team.`)
    } catch (error) {
      toast.error(errorMessage(error, 'That member could not be removed.'))
    } finally {
      setRemoving(null)
    }
  }

  const onRoleChange = async (member, role) => {
    const previous = members
    onChange({
      ...organisation,
      members: members.map((m) => (m.id === member.id ? { ...m, role } : m)),
    })
    try {
      await organisationApi.updateRole({ memberId: member.id, role })
      toast.success(`${member.name} is now a ${role}.`)
    } catch (error) {
      onChange({ ...organisation, members: previous })
      toast.error(errorMessage(error, 'That role change did not save.'))
    }
  }

  const columns = [
    { label: 'Member' },
    { label: 'Role' },
    { label: 'Status' },
    { label: 'Uploads', align: 'right' },
    { label: 'Last active', align: 'right' },
  ]
  if (canManage) columns.push({ label: '', align: 'right' })

  return (
    <>
      <ChartCard
        title="Team members"
        description={
          canManage
            ? 'Invite people, set what they can do, and remove them when they leave.'
            : 'Everyone with access to this organisation. Only the team lead can make changes.'
        }
        icon={Users}
        action={
          canManage ? (
            <Button size="sm" icon={UserPlus} onClick={() => setInviteOpen(true)}>
              Invite member
            </Button>
          ) : (
            <Badge tone="neutral" icon={Eye}>
              Read only
            </Badge>
          )
        }
      >
        {members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No members yet"
            description={
              canManage
                ? 'Invite your team so they can upload files and share analysis.'
                : 'Nobody has been added to this organisation yet.'
            }
            action={
              canManage && (
                <Button size="sm" icon={UserPlus} onClick={() => setInviteOpen(true)}>
                  Invite a member
                </Button>
              )
            }
          />
        ) : (
          <Table>
            <THead columns={columns} />
            <tbody>
              <AnimatePresence initial={false}>
                {members.map((member, i) => {
                  const RoleIcon = ROLE_ICON[member.role] ?? Eye
                  const isLead = member.role === 'Lead'

                  return (
                    <TRow key={member.id} index={i}>
                      <TCell>
                        <span className="flex items-center gap-3">
                          <span
                            className={cn(
                              'grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11.5px] font-semibold text-white',
                              isLead ? 'bg-brand-gradient' : 'bg-[rgb(var(--c-hairline)/0.22)]',
                            )}
                          >
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
                        {isLead ? (
                          <Badge tone="brand" icon={Crown}>
                            Team lead
                          </Badge>
                        ) : canManage ? (
                          <select
                            value={member.role}
                            onChange={(event) => onRoleChange(member, event.target.value)}
                            aria-label={`Role for ${member.name}`}
                            className="rounded-lg border border-[rgb(var(--c-hairline)/0.12)] bg-transparent px-2 py-1 text-[12.5px] text-ink transition-colors hover:border-[rgb(var(--c-hairline)/0.24)] focus:border-[rgb(var(--c-brand)/0.6)] focus:outline-none"
                          >
                            <option value="Analyst">Analyst</option>
                            <option value="Viewer">Viewer</option>
                          </select>
                        ) : (
                          <span className="flex items-center gap-1.5 text-[12.5px] text-muted">
                            <RoleIcon className="h-3.5 w-3.5 text-faint" strokeWidth={2} />
                            {member.role}
                          </span>
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

                      {canManage && (
                        <TCell align="right">
                          {!isLead && (
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
                      )}
                    </TRow>
                  )
                })}
              </AnimatePresence>
            </tbody>
          </Table>
        )}

        {!canManage && (
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-[rgb(var(--c-hairline)/0.1)] bg-[rgb(var(--c-hairline)/0.03)] p-3 text-[12.5px] leading-relaxed text-muted">
            <Info className="mt-px h-3.5 w-3.5 shrink-0 text-faint" strokeWidth={2} />
            You are a member of this organisation. Ask your team lead to change roles or invite
            someone new.
          </p>
        )}
      </ChartCard>

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
          <div>
            <Select label="Role" {...register('role')}>
              <option value="Analyst">Analyst</option>
              <option value="Viewer">Viewer</option>
            </Select>
            <motion.p
              key={draftRole}
              initial={{ opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-1.5 text-[12.5px] text-faint"
            >
              {ORG_ROLE_HINT[draftRole]}
            </motion.p>
          </div>

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
    </>
  )
}

export default TeamMembers
