import { useEffect, useMemo, useState } from 'react'
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
} from 'lucide-react'

import ChartCard from '@/components/ChartCard'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import { SegmentedTabs } from '@/components/ui/Tabs'
import { Table, THead, TRow, TCell } from '@/components/ui/Table'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageTransition, CountUp, Reveal } from '@/components/motion'
import { CategoryDonut } from '@/components/charts'
import { adminApi, errorMessage } from '@/services/api'
import { useToast } from '@/context/ToastContext'
import { ROLE_LABEL } from '@/lib/constants'
import { initials, number, shortDate, relativeTime, fileSize } from '@/lib/formatters'
import { EASE } from '@/lib/motion'

const ROLE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'individual', label: 'Individual' },
  { id: 'enterprise', label: 'Enterprise' },
  { id: 'member', label: 'Team' },
  { id: 'admin', label: 'Admin' },
]

const PLAN_TONE = { free: 'neutral', pro: 'brand', enterprise: 'violet' }

export default function Admin() {
  const toast = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [busy, setBusy] = useState(null)

  useEffect(() => {
    let cancelled = false
    adminApi
      .overview()
      .then((payload) => !cancelled && setData(payload))
      .catch((error) => !cancelled && toast.error(errorMessage(error, 'Could not load the admin overview.')))
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

  const stats = data?.stats

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-[24px] font-semibold tracking-[-0.025em] text-ink">
              Platform administration
            </h1>
            <Badge tone="danger" icon={ShieldCheck}>
              Admin only
            </Badge>
          </div>
          <p className="mt-1 text-[13.5px] text-muted">
            Oversight of every user, organisation, upload and subscription on InsightMart.
          </p>
        </div>
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

      {/* Users */}
      <ChartCard
        loading={loading}
        title="All users"
        description="Search, filter by role, and suspend or reinstate any account."
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
                { label: '', align: 'right' },
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
                          <span className="block truncate text-[11.5px] text-faint">{user.email}</span>
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
                      <button
                        type="button"
                        onClick={() => toggleStatus(user)}
                        disabled={busy === user.id}
                        aria-label={
                          user.status === 'active' ? `Suspend ${user.name}` : `Reinstate ${user.name}`
                        }
                        className="rounded-lg p-1.5 text-faint opacity-0 transition-all duration-200 hover:bg-[rgb(var(--c-hairline)/0.08)] hover:text-ink focus:opacity-100 group-hover:opacity-100 disabled:opacity-50"
                      >
                        {user.status === 'active' ? (
                          <Ban className="h-3.5 w-3.5" strokeWidth={2} />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                        )}
                      </button>
                    </TCell>
                  </TRow>
                ))}
              </AnimatePresence>
            </tbody>
          </Table>
        )}
      </ChartCard>

      {/* Organisations + plan split */}
      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <ChartCard
          loading={loading}
          title="Organisations"
          description="Every Enterprise workspace on the platform."
          icon={Building2}
        >
          <Table>
            <THead
              columns={[
                { label: 'Organisation' },
                { label: 'Owner' },
                { label: 'Members', align: 'right' },
                { label: 'Uploads', align: 'right' },
                { label: 'Created', align: 'right' },
              ]}
            />
            <tbody>
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
                </TRow>
              ))}
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

      {/* Upload feed */}
      <ChartCard
        loading={loading}
        title="Recent uploads across the platform"
        description="Every file processed, including failures and why they failed."
        icon={FileSpreadsheet}
      >
        <Table>
          <THead
            columns={[
              { label: 'File' },
              { label: 'Uploaded by' },
              { label: 'Status' },
              { label: 'Rows', align: 'right' },
              { label: 'Size', align: 'right' },
              { label: 'When', align: 'right' },
            ]}
          />
          <tbody>
            {(data?.uploads ?? []).map((upload, i) => (
              <TRow key={upload.id} index={i}>
                <TCell className="font-medium">
                  <span className="flex items-center gap-2.5">
                    <FileSpreadsheet className="h-4 w-4 shrink-0 text-faint" strokeWidth={1.8} />
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
              </TRow>
            ))}
          </tbody>
        </Table>
      </ChartCard>
    </PageTransition>
  )
}
