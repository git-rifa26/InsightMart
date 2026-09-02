import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  IndianRupee,
  ShoppingCart,
  Users,
  Percent,
  TrendingUp,
  PieChart as PieIcon,
  MapPin,
  FileSpreadsheet,
  Upload,
  ArrowRight,
  UploadCloud,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

import KpiCard from '@/components/KpiCard'
import ChartCard from '@/components/ChartCard'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { SegmentedTabs } from '@/components/ui/Tabs'
import { Table, THead, TRow, TCell, CellBar } from '@/components/ui/Table'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageTransition } from '@/components/motion'
import { RevenueLineChart, SalesBarChart, CategoryDonut } from '@/components/charts'
import { dashboardApi, errorMessage } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { useDataset } from '@/context/DataContext'
import { useToast } from '@/context/ToastContext'
import { DATE_RANGES } from '@/lib/constants'
import { currency, currencyCompact, number, percent, relativeTime, fileSize } from '@/lib/formatters'
import { EASE } from '@/lib/motion'

export default function Dashboard() {
  const { plan } = useAuth()
  const { hasData, dataset } = useDataset()
  const toast = useToast()
  const [range, setRange] = useState('12m')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hasData) {
      setLoading(false)
      return undefined
    }
    let cancelled = false
    setLoading(true)

    dashboardApi
      .get({ range })
      .then((payload) => {
        if (!cancelled) setData(payload)
      })
      .catch((error) => {
        if (!cancelled) toast.error(errorMessage(error, 'Could not load your dashboard.'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, hasData])

  const k = data?.kpis
  const trend = data?.revenueTrend ?? []
  const maxProduct = Math.max(...(data?.topProducts ?? []).map((p) => p.revenue), 1)

  // Upload-first: without an analysed file there is nothing to summarise.
  if (!hasData) {
    return (
      <PageTransition>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="glass rim relative overflow-hidden rounded-2xl px-6 py-16"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(60% 90% at 50% 0%, rgb(var(--c-brand) / 0.12), transparent 65%)',
            }}
          />
          <div className="relative mx-auto max-w-md text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[rgb(var(--c-brand)/0.13)] text-brand">
              <UploadCloud className="h-6 w-6" strokeWidth={1.8} />
            </span>
            <h1 className="mt-5 font-display text-[22px] font-semibold tracking-[-0.02em] text-ink">
              Upload a CSV to build your dashboard
            </h1>
            <p className="mt-2.5 text-[14px] leading-relaxed text-muted">
              Your KPIs, revenue trend, category share and regional performance are all computed
              from the sales file you upload. Start there and this page fills itself in.
            </p>
            <Button as={Link} to="/analysis" size="lg" className="mt-7" icon={UploadCloud}>
              Go to CSV Analysis
            </Button>
          </div>
        </motion.div>
      </PageTransition>
    )
  }

  return (
    <PageTransition className="space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-[24px] font-semibold tracking-[-0.025em] text-ink">
            Sales overview
          </h1>
          <p className="mt-1 text-[13.5px] text-muted">
            Built from{' '}
            <span className="font-medium text-ink">{dataset?.filename}</span> on your {plan.name}{' '}
            account.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <SegmentedTabs
            items={DATE_RANGES}
            value={range}
            onChange={setRange}
            size="sm"
            layoutId="dash-range"
          />
          <Button as={Link} to="/analysis" size="sm" icon={Upload}>
            Upload CSV
          </Button>
        </div>
      </motion.div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          index={0}
          loading={loading}
          label="Total revenue"
          value={k?.revenue ?? 0}
          format={(v) => currencyCompact(v)}
          delta={k?.deltas.revenue}
          icon={IndianRupee}
          trend={trend}
        />
        <KpiCard
          index={1}
          loading={loading}
          label="Orders"
          value={k?.orders ?? 0}
          format={(v) => number(Math.round(v))}
          delta={k?.deltas.orders}
          icon={ShoppingCart}
          trend={trend}
        />
        <KpiCard
          index={2}
          loading={loading}
          label="Average order value"
          value={k?.aov ?? 0}
          format={(v) => currency(v)}
          delta={k?.deltas.aov}
          icon={Percent}
          trend={trend}
        />
        <KpiCard
          index={3}
          loading={loading}
          label="Customers"
          value={k?.customers ?? 0}
          format={(v) => number(Math.round(v))}
          delta={k?.deltas.customers}
          icon={Users}
          trend={trend}
        />
      </div>

      {/* Revenue trend + category share */}
      <div className="grid gap-4 xl:grid-cols-[1.65fr_1fr]">
        <ChartCard
          index={0}
          loading={loading}
          title="Revenue and orders over time"
          description="Monthly revenue with the order count overlaid."
          icon={TrendingUp}
          action={
            k && (
              <div className="text-right">
                <p className="numeric font-display text-[19px] font-semibold leading-none text-ink">
                  {currencyCompact(k.revenue)}
                </p>
                <p className="mt-1 text-[11.5px] text-faint">across {number(k.orders)} orders</p>
              </div>
            )
          }
        >
          <RevenueLineChart data={trend} showOrders height={300} />
        </ChartCard>

        <ChartCard
          index={1}
          loading={loading}
          title="Share by category"
          description="Where the revenue actually comes from."
          icon={PieIcon}
        >
          <CategoryDonut data={data?.categoryShare ?? []} height={300} />
        </ChartCard>
      </div>

      {/* Regions + top products */}
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          index={0}
          loading={loading}
          title="Revenue by region"
          description="Regional performance against profit."
          icon={MapPin}
        >
          <SalesBarChart data={data?.regionShare ?? []} secondKey="profit" height={280} />
        </ChartCard>

        <ChartCard
          index={1}
          loading={loading}
          title="Top performing products"
          description="Ranked by revenue contribution."
          icon={TrendingUp}
        >
          <Table>
            <THead
              columns={[
                { label: 'Product' },
                { label: 'Share' },
                { label: 'Orders', align: 'right' },
                { label: 'Revenue', align: 'right' },
              ]}
            />
            <tbody>
              {(data?.topProducts ?? []).map((product, i) => (
                <TRow key={product.name} index={i}>
                  <TCell className="font-medium">{product.name}</TCell>
                  <TCell className="w-28">
                    <CellBar value={product.revenue} max={maxProduct} />
                  </TCell>
                  <TCell align="right" numeric muted>
                    {number(product.orders)}
                  </TCell>
                  <TCell align="right" numeric>
                    {currencyCompact(product.revenue)}
                  </TCell>
                </TRow>
              ))}
            </tbody>
          </Table>
        </ChartCard>
      </div>

      {/* Recent uploads */}
      <ChartCard
        index={0}
        loading={loading}
        title="Recent uploads"
        description="The files behind these numbers."
        icon={FileSpreadsheet}
        action={
          <Button as={Link} to="/analysis" size="sm" variant="ghost" iconRight={ArrowRight}>
            Open analysis
          </Button>
        }
      >
        {(data?.recentUploads ?? []).length === 0 ? (
          <EmptyState
            icon={Upload}
            title="No uploads yet"
            description="Upload a sales CSV to populate your dashboard."
            action={
              <Button as={Link} to="/analysis" size="sm" icon={Upload}>
                Upload a CSV
              </Button>
            }
          />
        ) : (
          <Table>
            <THead
              columns={[
                { label: 'File' },
                { label: 'Status' },
                { label: 'Uploaded by' },
                { label: 'Rows', align: 'right' },
                { label: 'Size', align: 'right' },
                { label: 'When', align: 'right' },
              ]}
            />
            <tbody>
              {(data?.recentUploads ?? []).map((upload, i) => (
                <TRow key={upload.id} index={i}>
                  <TCell className="font-medium">
                    <span className="flex items-center gap-2.5">
                      <FileSpreadsheet className="h-4 w-4 shrink-0 text-faint" strokeWidth={1.8} />
                      {upload.filename}
                    </span>
                  </TCell>
                  <TCell>
                    <Badge
                      tone={upload.status === 'processed' ? 'success' : 'danger'}
                      icon={upload.status === 'processed' ? CheckCircle2 : XCircle}
                    >
                      {upload.status === 'processed' ? 'Processed' : 'Failed'}
                    </Badge>
                  </TCell>
                  <TCell muted>{upload.uploadedBy}</TCell>
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
        )}
      </ChartCard>

      {/* Margin / retention summary strip */}
      {k && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE }}
          className="grid gap-4 sm:grid-cols-3"
        >
          {[
            { label: 'Gross profit', value: currencyCompact(k.profit), hint: 'Revenue less cost' },
            { label: 'Profit margin', value: percent(k.margin), hint: 'Across all branches' },
            { label: 'Repeat purchase rate', value: percent(k.repeatRate), hint: 'Customers with 2+ orders' },
          ].map((item) => (
            <div key={item.label} className="glass rim rounded-2xl p-5">
              <p className="text-[12px] font-medium uppercase tracking-[0.07em] text-faint">
                {item.label}
              </p>
              <p className="numeric mt-2 font-display text-[24px] font-semibold leading-none text-ink">
                {item.value}
              </p>
              <p className="mt-1.5 text-[12px] text-faint">{item.hint}</p>
            </div>
          ))}
        </motion.div>
      )}
    </PageTransition>
  )
}
