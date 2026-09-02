import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Users,
  Building2,
  UploadCloud,
  CreditCard,
  Search,
  ShieldCheck,
  Ban,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  PieChart as PieIcon,
  Pencil,
  Trash2,
  User,
  Mail,
  Database,
} from 'lucide-react'

import ChartCard from '@/components/ChartCard'
import ConfirmDialog from '@/components/ConfirmDialog'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input, { Select } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { SegmentedTabs, UnderlineTabs } from '@/components/ui/Tabs'
import { Table, THead, TRow, TCell } from '@/components/ui/Table'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageTransition, CountUp } from '@/components/motion'
import { CategoryDonut } from '@/components/charts'
import { adminApi, errorMessage } from '@/services/api'
import { useToast } from '@/context/ToastContext'
import { ROLE_LABEL } from '@/lib/constants'
import { initials, number, shortDate, relativeTime, fileSize } from '@/lib/formatters'
import { EASE } from '@/lib/motion'

const SECTIONS = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'organisations', label: 'Organisations', icon: Building2 },
  { id: 'uploads', label: 'Uploads & data', icon: Database },
]

const ROLE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'individual', label: 'Individual' },
  { id: 'enterprise', label: 'Lead' },
  { id: 'member', label: 'Team' },
  { id: 'admin', label: 'Admin' },
]

const PLAN_TONE = { free: 'neutral', pro: 'brand', enterprise: 'violet' }

export default function Admin() {
  const toast = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [section, setSection] = useState('users')
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

  useEffect(() => {
    let cancelled = false
    adminApi
      .overview()
      .then((payload) => !cancelled && setData(payload))
      .catch(
        (error) => !cancelled && toast.error(errorMessage(error, 'Could not load the admin overview.')),
      )
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  /* ------------------------------------------------------------ update */

  const openEditor = (user) => {
    reset({ name: user.name, email: user.email, role: user.role, plan: user.plan, status: user.status })
    setEditing(user)
  }

  const saveUser = async (values) => {
    setSaving(true)
    try {
      const { user } = await adminApi.updateUser({ userId: editing.id, patch: values })
      setData((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u.id === user.id ? user : u)),
      }))
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

  /* ------------------------------------------------------------ delete */

  const runDelete = async () => {
    if (!confirm) return
    setDeleting(true)
    try {
      if (confirm.kind === 'user') {
        await adminApi.deleteUser({ userId: confirm.item.id })
        setData((prev) => ({
          ...prev,
          users: prev.users.filter((u) => u.id !== confirm.item.id),
          stats: { ...prev.stats, users: prev.stats.users - 1 },
        }))
      } else if (confirm.kind === 'organisation') {
        await adminApi.deleteOrganisation({ orgId: confirm.item.id })
        setData((prev) => ({
          ...prev,
          organisations: prev.organisations.filter((o) => o.id !== confirm.item.id),
          stats: { ...prev.stats, organisations: prev.stats.organisations - 1 },
        }))
      } else {
        await adminApi.deleteUpload({ uploadId: confirm.item.id })
        setData((prev) => ({
          ...prev,
          uploads: prev.uploads.filter((u) => u.id !== confirm.item.id),
        }))
      }
      toast.success(`${confirm.label} deleted.`)
      setConfirm(null)
    } catch (error) {
      toast.error(errorMessage(error, 'That could not be deleted.'))
    } finally {
      setDeleting(false)
    }
  }

  const stats = data?.stats
  const iconBtn =
    'rounded-lg p-1.5 text-faint opacity-0 transition-all duration-200 focus:opacity-100 group-hover:opacity-100 disabled:opacity-50'

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <div className="flex items-center gap-2.5">
          <h1 className="font-display text-[24px] font-semibold tracking-[-0.025em] text-ink">
            Platform administration
          </h1>
          <Badge tone="danger" icon={ShieldCheck}>
            Admin only
          </Badge>
        </div>
        <p className="mt-1 text-[13.5px] text-muted">
          Full read and write access to every user, organisation and upload on InsightMart.
        </p>
      </motion.div>

      {/* Platform stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total users', value: stats?.users ?? 0, icon: Users },
          { label: 'Organisations', value: stats?.organisations ?? 0, icon: Building2 },
          { label: 'Total uploads', value: stats?.uploads ?? 0, icon: UploadCloud },
          { label: 'Paid subscriptions', value: stats?.activeSubscriptions ?? 0, icon: CreditCard },
        ].map((tile, i) => (
          <motion.div
            key={tile.label}
            initial={{ opacity: 0, y: 16 }}
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

      {/* Section switcher - admin manages one collection at a time */}
      <UnderlineTabs items={SECTIONS} value={section} onChange={setSection} layoutId="admin-section" />

      <AnimatePresence mode="wait">
        <motion.div
          key={section}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: EASE }}
          className="space-y-6"
        >
          {/* ------------------------------------------------ users */}
          {section === 'users' && (
            <ChartCard
              loading={loading}
              title="All users"
              description="Search, filter, edit any account, suspend it, or delete it permanently."
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
                                onClick={() =>
                                  setConfirm({
                                    kind: 'user',
                                    item: user,
                                    label: user.name,
                                    title: `Delete ${user.name}?`,
                                    description:
                                      'Their account, uploads and analyses are removed permanently. This cannot be undone.',
                                  })
                                }
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
          )}

          {/* ---------------------------------------- organisations */}
          {section === 'organisations' && (
            <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
              <ChartCard
                loading={loading}
                title="Organisations"
                description="Every Enterprise workspace, and the ability to remove one."
                icon={Building2}
              >
                <Table>
                  <THead
                    columns={[
                      { label: 'Organisation' },
                      { label: 'Team lead' },
                      { label: 'Members', align: 'right' },
                      { label: 'Uploads', align: 'right' },
                      { label: 'Created', align: 'right' },
                      { label: 'Actions', align: 'right' },
                    ]}
                  />
                  <tbody>
                    <AnimatePresence initial={false}>
                      {(data?.organisations ?? []).map((org, i) => (
                        <TRow key={org.id} index={i}>
                          <TCell className="font-medium">
                            <span className="flex items-center gap-2.5">
                              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[rgb(var(--c-violet)/0.15)] text-[rgb(var(--c-violet))]">
                                <Building2 className="h-3.5 w-3.5" strokeWidth={2} />
                              </span>
                              {org.name}
                            </span>
                          </TCell>
                          <TCell muted>{org.owner}</TCell>
                          <TCell align="right" numeric muted>
                            {number(org.members)}
                          </TCell>
                          <TCell align="right" numeric>
                            {number(org.uploads)}
                          </TCell>
                          <TCell align="right" muted>
                            {shortDate(org.createdAt)}
                          </TCell>
                          <TCell align="right">
                            <button
                              type="button"
                              onClick={() =>
                                setConfirm({
                                  kind: 'organisation',
                                  item: org,
                                  label: org.name,
                                  title: `Delete ${org.name}?`,
                                  description:
                                    'The organisation, its team assignments and shared uploads are removed permanently.',
                                })
                              }
                              aria-label={`Delete ${org.name}`}
                              className={`${iconBtn} hover:bg-[rgb(var(--c-danger)/0.12)] hover:text-danger`}
                            >
                              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                            </button>
                          </TCell>
                        </TRow>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </Table>
              </ChartCard>

              <ChartCard
                loading={loading}
                title="Subscription distribution"
                description="How accounts are spread across the three tiers."
                icon={PieIcon}
              >
                <CategoryDonut data={data?.planDistribution ?? []} height={280} />
              </ChartCard>
            </div>
          )}

          {/* ------------------------------------------------ uploads */}
          {section === 'uploads' && (
            <ChartCard
              loading={loading}
              title="All uploaded data"
              description="Every file processed platform-wide, including failures. Delete removes the file and the records derived from it."
              icon={Database}
            >
              {(data?.uploads ?? []).length === 0 ? (
                <EmptyState
                  icon={Database}
                  title="No uploads on the platform"
                  description="Nothing has been uploaded yet, or everything has been deleted."
                />
              ) : (
                <Table>
                  <THead
                    columns={[
                      { label: 'File' },
                      { label: 'Uploaded by' },
                      { label: 'Status' },
                      { label: 'Rows', align: 'right' },
                      { label: 'Size', align: 'right' },
                      { label: 'When', align: 'right' },
                      { label: 'Actions', align: 'right' },
                    ]}
                  />
                  <tbody>
                    <AnimatePresence initial={false}>
                      {(data?.uploads ?? []).map((upload, i) => (
                        <TRow key={upload.id} index={i}>
                          <TCell className="font-medium">
                            <span className="flex items-center gap-2.5">
                              <FileSpreadsheet
                                className="h-4 w-4 shrink-0 text-faint"
                                strokeWidth={1.8}
                              />
                              <span>
                                {upload.filename}
                                {upload.error && (
                                  <span className="mt-0.5 block text-[11.5px] font-normal text-danger">
                                    {upload.error}
                                  </span>
                                )}
                              </span>
                            </span>
                          </TCell>
                          <TCell muted>{upload.uploadedBy}</TCell>
                          <TCell>
                            <Badge
                              tone={upload.status === 'processed' ? 'success' : 'danger'}
                              icon={upload.status === 'processed' ? CheckCircle2 : XCircle}
                            >
                              {upload.status === 'processed' ? 'Processed' : 'Failed'}
                            </Badge>
                          </TCell>
                          <TCell align="right" numeric muted>
                            {number(upload.rows)}
                          </TCell>
                          <TCell align="right" numeric muted>
                            {fileSize(upload.size)}
                          </TCell>
                          <TCell align="right" muted>
                            {relativeTime(upload.uploadedAt)}
                          </TCell>
                          <TCell align="right">
                            <button
                              type="button"
                              onClick={() =>
                                setConfirm({
                                  kind: 'upload',
                                  item: upload,
                                  label: upload.filename,
                                  title: `Delete ${upload.filename}?`,
                                  description:
                                    'The file and every sales record parsed from it are removed permanently.',
                                })
                              }
                              aria-label={`Delete ${upload.filename}`}
                              className={`${iconBtn} hover:bg-[rgb(var(--c-danger)/0.12)] hover:text-danger`}
                            >
                              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                            </button>
                          </TCell>
                        </TRow>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </Table>
              )}
            </ChartCard>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Edit user */}
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

      {/* Delete confirmation, shared by all three collections */}
      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={runDelete}
        loading={deleting}
        title={confirm?.title ?? ''}
        description={confirm?.description}
      />
    </PageTransition>
  )
}
