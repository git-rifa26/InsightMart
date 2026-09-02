import { Link, useOutletContext } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users,
  Building2,
  UploadCloud,
  CreditCard,
  ArrowUpRight,
  PieChart as PieIcon,
  Database,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

import AdminSection from './AdminSection'
import ChartCard from '@/components/ChartCard'
import Badge from '@/components/ui/Badge'
import { Spotlight, CountUp } from '@/components/motion'
import { CategoryDonut } from '@/components/charts'
import { number, relativeTime } from '@/lib/formatters'
import { EASE } from '@/lib/motion'

const TILES = [
  { key: 'users', label: 'Total users', icon: Users, to: '/admin/users' },
  { key: 'organisations', label: 'Organisations', icon: Building2, to: '/admin/organisations' },
  { key: 'uploads', label: 'Total uploads', icon: UploadCloud, to: '/admin/uploads' },
  { key: 'activeSubscriptions', label: 'Paid subscriptions', icon: CreditCard, to: '/admin/users' },
]

export default function AdminOverview() {
  const { data, loading } = useOutletContext()
  const stats = data?.stats
  const recent = (data?.uploads ?? []).slice(0, 5)

  return (
    <AdminSection
      title="Platform overview"
      description="Everything happening across InsightMart, in one place."
    >
      {/* Stat tiles double as navigation into each section */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {TILES.map((tile, i) => (
          <motion.div
            key={tile.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE, delay: i * 0.07 }}
          >
            <Link to={tile.to} className="block">
              <Spotlight className="glass rim h-full rounded-2xl p-5 transition-transform duration-500 ease-expo hover:-translate-y-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11.5px] font-medium uppercase tracking-[0.07em] text-faint">
                      {tile.label}
                    </p>
                    <p className="mt-2 font-display text-[30px] font-semibold leading-none text-ink">
                      <CountUp
                        value={stats?.[tile.key] ?? 0}
                        format={(v) => number(Math.round(v))}
                        delay={i * 0.07}
                      />
                    </p>
                  </div>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[rgb(var(--c-brand)/0.12)] text-brand">
                    <tile.icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                  </span>
                </div>
                <p className="mt-4 flex items-center gap-1 text-[12px] font-medium text-brand">
                  Manage
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.2} />
                </p>
              </Spotlight>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.3fr]">
        <ChartCard
          loading={loading}
          title="Subscription distribution"
          description="How accounts spread across the three tiers."
          icon={PieIcon}
        >
          <CategoryDonut data={data?.planDistribution ?? []} height={280} />
        </ChartCard>

        <ChartCard
          loading={loading}
          title="Latest uploads"
          description="The five most recent files processed platform-wide."
          icon={Database}
        >
          <ul className="space-y-2.5">
            {recent.map((upload, i) => (
              <motion.li
                key={upload.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                className="flex items-center justify-between gap-4 rounded-xl border border-[rgb(var(--c-hairline)/0.1)] px-4 py-3 transition-colors hover:bg-[rgb(var(--c-hairline)/0.03)]"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-medium text-ink">{upload.filename}</p>
                  <p className="truncate text-[12px] text-faint">
                    {upload.uploadedBy} &middot; {number(upload.rows)} rows
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge
                    tone={upload.status === 'processed' ? 'success' : 'danger'}
                    icon={upload.status === 'processed' ? CheckCircle2 : XCircle}
                  >
                    {upload.status === 'processed' ? 'Processed' : 'Failed'}
                  </Badge>
                  <span className="hidden text-[12px] text-faint sm:block">
                    {relativeTime(upload.uploadedAt)}
                  </span>
                </div>
              </motion.li>
            ))}
          </ul>
        </ChartCard>
      </div>
    </AdminSection>
  )
}
