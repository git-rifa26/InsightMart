import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { AnimatePresence } from 'framer-motion'
import { Search, Pencil, Trash2, Ban, CheckCircle2, User, Mail, Users } from 'lucide-react'

import AdminSection from './AdminSection'
import ChartCard from '@/components/ChartCard'
import ConfirmDialog from '@/components/ConfirmDialog'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input, { Select } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { SegmentedTabs } from '@/components/ui/Tabs'
import { Table, THead, TRow, TCell } from '@/components/ui/Table'
import { EmptyState } from '@/components/ui/EmptyState'
import { adminApi, errorMessage } from '@/services/api'
import { useToast } from '@/context/ToastContext'
import { ROLE_LABEL } from '@/lib/constants'
import { initials, number, shortDate } from '@/lib/formatters'

const ROLE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'individual', label: 'Individual' },
  { id: 'enterprise', label: 'Lead' },
  { id: 'member', label: 'Team' },
  { id: 'admin', label: 'Admin' },
]

const PLAN_TONE = { free: 'neutral', pro: 'brand', enterprise: 'violet' }

const iconBtn =
  'rounded-lg p-1.5 text-faint opacity-0 transition-all duration-200 focus:opacity-100 group-hover:opacity-100 disabled:opacity-50'

export default function AdminUsers() {
  const { data, setData, loading } = useOutletContext()
  const toast = useToast()

  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [busy, setBusy] = useState(null)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  const users = useMemo(() => {
    const list = data?.users ?? []
    const q = query.trim().toLowerCase()
    return list.filter((user) => {
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      const matchesQuery =
        !q || user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q)
      return matchesRole && matchesQuery
    })
  }, [data, query, roleFilter])

  const openEditor = (user) => {
    reset({
      name: user.name,
      email: user.email,
      role: user.role,
      plan: user.plan,
      status: user.status,
    })
    setEditing(user)
  }

  const saveUser = async (values) => {
    setSaving(true)
    try {
      const { user } = await adminApi.updateUser({ userId: editing.id, patch: values })
      setData((prev) => ({ ...prev, users: prev.users.map((u) => (u.id === user.id ? user : u)) }))
      toast.success(`${user.name} updated.`)
      setEditing(null)
    } catch (error) {
      toast.error(errorMessage(error, 'Those changes did not save.'))
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (user) => {
    const next = user.status === 'suspended' ? 'active' : 'suspended'
    setBusy(user.id)
    try {
      await adminApi.setUserStatus({ userId: user.id, status: next })
      setData((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u.id === user.id ? { ...u, status: next } : u)),
      }))
      toast.success(`${user.name} is now ${next}.`)
    } catch (error) {
      toast.error(errorMessage(error, 'That change did not save.'))
    } finally {
      setBusy(null)
    }
  }

  const deleteUser = async () => {
    setDeleting(true)
    try {
      await adminApi.deleteUser({ userId: confirm.id })
      setData((prev) => ({
        ...prev,
        users: prev.users.filter((u) => u.id !== confirm.id),
        stats: { ...prev.stats, users: prev.stats.users - 1 },
      }))
      toast.success(`${confirm.name} deleted.`)
      setConfirm(null)
    } catch (error) {
      toast.error(errorMessage(error, 'That user could not be deleted.'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AdminSection
      title="Users"
      description="Every account on the platform. Edit details, suspend access, or delete permanently."
    >
      <ChartCard
        loading={loading}
        title={`${users.length} of ${data?.users?.length ?? 0} accounts`}
        description="Hover a row to reveal its actions."
        icon={Users}
        action={
          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <Input
              icon={Search}
              placeholder="Search name or email"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              containerClassName="w-full sm:w-56"
              className="h-9 text-[13px]"
              aria-label="Search users"
            />
            <SegmentedTabs
              items={ROLE_FILTERS}
              value={roleFilter}
              onChange={setRoleFilter}
              size="sm"
              layoutId="admin-role"
            />
          </div>
        }
      >
        {users.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No users match that search"
            description="Try a different name, email or role filter."
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setQuery('')
                  setRoleFilter('all')
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <Table>
            <THead
              columns={[
                { label: 'User' },
                { label: 'Role' },
                { label: 'Plan' },
                { label: 'Status' },
                { label: 'Uploads', align: 'right' },
                { label: 'Joined', align: 'right' },
                { label: 'Actions', align: 'right' },
              ]}
            />
            <tbody>
              <AnimatePresence initial={false}>
                {users.map((user, i) => (
                  <TRow key={user.id} index={i}>
                    <TCell>
                      <span className="flex items-center gap-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-gradient text-[11.5px] font-semibold text-white">
                          {initials(user.name)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-medium text-ink">
                            {user.name}
                          </span>
                          <span className="block truncate text-[11.5px] text-faint">
                            {user.email}
                          </span>
                        </span>
                      </span>
                    </TCell>
                    <TCell muted>{ROLE_LABEL[user.role] ?? user.role}</TCell>
                    <TCell>
                      <Badge tone={PLAN_TONE[user.plan] ?? 'neutral'}>
                        {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
                      </Badge>
                    </TCell>
                    <TCell>
                      <Badge tone={user.status === 'active' ? 'success' : 'danger'} dot>
                        {user.status === 'active' ? 'Active' : 'Suspended'}
                      </Badge>
                    </TCell>
                    <TCell align="right" numeric muted>
                      {number(user.uploadsThisMonth ?? 0)}
                    </TCell>
                    <TCell align="right" muted>
                      {shortDate(user.joinedAt)}
                    </TCell>
                    <TCell align="right">
                      <span className="flex items-center justify-end gap-0.5">
                        <button
                          type="button"
                          onClick={() => openEditor(user)}
                          aria-label={`Edit ${user.name}`}
                          className={`${iconBtn} hover:bg-[rgb(var(--c-brand)/0.12)] hover:text-brand`}
                        >
                          <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatus(user)}
                          disabled={busy === user.id}
                          aria-label={
                            user.status === 'active'
                              ? `Suspend ${user.name}`
                              : `Reinstate ${user.name}`
                          }
                          className={`${iconBtn} hover:bg-[rgb(var(--c-hairline)/0.08)] hover:text-ink`}
                        >
                          {user.status === 'active' ? (
                            <Ban className="h-3.5 w-3.5" strokeWidth={2} />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirm(user)}
                          aria-label={`Delete ${user.name}`}
                          className={`${iconBtn} hover:bg-[rgb(var(--c-danger)/0.12)] hover:text-danger`}
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                        </button>
                      </span>
                    </TCell>
                  </TRow>
                ))}
              </AnimatePresence>
            </tbody>
          </Table>
        )}
      </ChartCard>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit user"
        description={editing ? `Updating ${editing.name}. Changes apply immediately.` : undefined}
      >
        <form onSubmit={handleSubmit(saveUser)} noValidate className="space-y-4">
          <Input
            label="Full name"
            icon={User}
            error={errors.name?.message}
            {...register('name', { required: 'Enter a name.' })}
          />
          <Input
            label="Email address"
            type="email"
            icon={Mail}
            error={errors.email?.message}
            {...register('email', {
              required: 'Enter an email address.',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'That does not look like a valid email.' },
            })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Role" {...register('role')}>
              <option value="individual">Individual</option>
              <option value="enterprise">Team lead</option>
              <option value="member">Team member</option>
              <option value="admin">Administrator</option>
            </Select>
            <Select label="Plan" {...register('plan')}>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </Select>
          </div>
          <Select label="Status" {...register('status')}>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </Select>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save changes
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={deleteUser}
        loading={deleting}
        title={confirm ? `Delete ${confirm.name}?` : ''}
        description="Their account, uploads and analyses are removed permanently. This cannot be undone."
      />
    </AdminSection>
  )
}
