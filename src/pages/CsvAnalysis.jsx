import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Papa from 'papaparse'
import {
  IndianRupee,
  ShoppingCart,
  Receipt,
  Repeat,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Activity,
  Users,
  Building,
  FileDown,
  Lock,
  Sparkles,
  CheckCircle2,
  Loader2,
  LayoutDashboard,
} from 'lucide-react'

import KpiCard from '@/components/KpiCard'
import ChartCard from '@/components/ChartCard'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { SegmentedTabs } from '@/components/ui/Tabs'
import { Table, THead, TRow, TCell, CellBar } from '@/components/ui/Table'
import FileDropzone from '@/components/ui/FileDropzone'
import { PageTransition, Reveal } from '@/components/motion'
import {
  RevenueLineChart,
  SalesBarChart,
  CategoryDonut,
  OrderHistogram,
  RetentionChart,
} from '@/components/charts'
import { analysisApi, errorMessage } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { useDataset } from '@/context/DataContext'
import { useToast } from '@/context/ToastContext'
import { currency, currencyCompact, number, percent } from '@/lib/formatters'
import { EASE } from '@/lib/motion'
import { cn } from '@/lib/cn'

const PERIODS = [
  { id: 'month', label: 'Monthly' },
  { id: 'quarter', label: 'Quarterly' },
  { id: 'year', label: 'Yearly' },
]

/** The staged messages shown while the backend works through the file. */
const STAGES = [
  'Validating file type and schema',
  'Parsing rows with Pandas',
  'Cleaning and normalising records',
  'Computing KPIs and analytics',
]

/** Blurs a premium block and explains what unlocks it. */
function PremiumLock({ children, locked, feature }) {
  if (!locked) return children

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-[6px]" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 grid place-items-center rounded-2xl bg-[rgb(var(--c-canvas)/0.55)]">
        <div className="glass rim max-w-xs rounded-2xl p-5 text-center">
          <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-[rgb(var(--c-brand)/0.13)] text-brand">
            <Lock className="h-[18px] w-[18px]" strokeWidth={1.9} />
          </span>
          <p className="mt-3 text-[14px] font-semibold text-ink">{feature} is a Pro feature</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
            Free accounts see core metrics only. Upgrade for the full analysis suite.
          </p>
          <Button as={Link} to="/plans" size="sm" className="mt-4" icon={Sparkles}>
            View plans
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function CsvAnalysis() {
  const { plan, canExport } = useAuth()
  const { analysis: data, dataset, hasData, setAnalysis } = useDataset()
  const toast = useToast()
  const navigate = useNavigate()

  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [progress, setProgress] = useState(null)
  const [stage, setStage] = useState(-1)
  const [dropError, setDropError] = useState(null)
  const [period, setPeriod] = useState('month')
  const [exporting, setExporting] = useState(false)
  const resultsRef = useRef(null)

  const isFree = plan.id === 'free'
  const busy = progress != null || stage >= 0

  /** Parse a small slice locally so the user sees their columns before upload. */
  const handleSelect = (nextFile) => {
    setDropError(null)

    if (!nextFile.name.toLowerCase().endsWith('.csv')) {
      setDropError('That file is not a CSV. Export your sheet as .csv and try again.')
      return
    }
    if (nextFile.size > 10 * 1024 * 1024) {
      setDropError('That file is larger than the 10 MB limit.')
      return
    }

    setFile(nextFile)
    Papa.parse(nextFile, {
      header: true,
      skipEmptyLines: true,
      preview: 6,
      complete: (result) => {
        setPreview({ fields: result.meta.fields ?? [], rows: result.data ?? [] })
      },
      error: () => setDropError('That file could not be read.'),
    })
  }

  const clearFile = () => {
    setFile(null)
    setPreview(null)
    setDropError(null)
  }

  const runAnalysis = async () => {
    if (!file) return
    setProgress(0)
    setStage(-1)

    try {
      const { upload } = await analysisApi.upload(file, setProgress)
      setProgress(null)

      // Walk the staged messages so the wait reads as real work.
      for (let i = 0; i < STAGES.length; i += 1) {
        setStage(i)
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => setTimeout(resolve, 520))
      }

      // Analyse the row the backend just created, by its id. Sending the
      // filename here made Flask look up an upload that does not exist.
      const payload = await analysisApi.get({ uploadId: upload?.id })
      setAnalysis(payload, {
        filename: file.name,
        rows: upload?.rows ?? payload.rowsAnalysed,
        uploadedAt: upload?.uploadedAt,
      })
      setStage(-1)
      setFile(null)
      setPreview(null)

      toast.success(`${file.name} analysed. Opening your dashboard.`)
      // Upload-first flow: once the file is analysed the user goes to the
      // dashboard. The full breakdown stays here whenever they come back.
      navigate('/dashboard')
    } catch (error) {
      toast.error(errorMessage(error, 'That upload could not be processed.'))
      setProgress(null)
      setStage(-1)
    }
  }

  const handleExport = async () => {
    if (!canExport) {
      toast.warn('PDF export is available on Pro and Enterprise.')
      return
    }
    setExporting(true)
    try {
      const result = await analysisApi.exportReport(data?.uploadId)
      toast.success(`${result.filename} is ready.`)
    } catch (error) {
      toast.error(errorMessage(error, 'The report could not be generated.'))
    } finally {
      setExporting(false)
    }
  }

  const k = data?.kpis
  const periodData = data?.salesByPeriod?.[period] ?? []
  const branches = data?.branchProfitability ?? []
  const maxBranchRevenue = useMemo(
    () => Math.max(...branches.map((b) => b.revenue), 1),
    [branches],
  )
  const bestBranch = branches[0]
  const mostProfitable = useMemo(
    () => [...branches].sort((a, b) => b.margin - a.margin)[0],
    [branches],
  )

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
          <h1 className="font-display text-[24px] font-semibold tracking-[-0.025em] text-ink">
            CSV Analysis
          </h1>
          <p className="mt-1 text-[13.5px] text-muted">
            {hasData
              ? 'The full breakdown of your uploaded file: trends, performers, profitability and retention.'
              : 'Everything starts here. Upload a sales file and the dashboard and reports build from it.'}
          </p>
        </div>

        {hasData && (
          <div className="flex items-center gap-2.5">
            <Button as={Link} to="/dashboard" size="sm" variant="secondary" icon={LayoutDashboard}>
              View dashboard
            </Button>
            <Button
              onClick={handleExport}
              loading={exporting}
              icon={canExport ? FileDown : Lock}
              variant={canExport ? 'primary' : 'secondary'}
              size="sm"
            >
              Export PDF report
            </Button>
          </div>
        )}
      </motion.div>

      {/* Upload */}
      <section className="glass rim rounded-2xl p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">
              {hasData ? 'Upload another sales CSV' : 'Start by uploading your sales CSV'}
            </h2>
            <p className="mt-1 text-[12.5px] text-muted">
              {hasData
                ? 'A new file replaces the current analysis everywhere, including the dashboard.'
                : 'Files are validated, cleaned and stored, then your dashboard is built from them.'}
            </p>
          </div>
          <Badge tone={isFree ? 'neutral' : 'brand'}>
            {isFree ? '1 upload / day' : 'Increased limit'}
          </Badge>
        </div>

        <FileDropzone
          file={file}
          onSelect={handleSelect}
          onClear={clearFile}
          progress={progress}
          error={dropError}
          disabled={busy}
        />

        {/* Column preview from the local parse */}
        <AnimatePresence>
          {preview && progress == null && stage < 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="overflow-hidden"
            >
              <div className="pt-5">
                <p className="mb-2.5 text-[12.5px] font-medium text-muted">
                  Detected {preview.fields.length} columns - first {preview.rows.length} rows
                </p>
                <div className="overflow-x-auto rounded-xl border border-[rgb(var(--c-hairline)/0.1)]">
                  <table className="w-full min-w-[36rem] text-left">
                    <thead className="bg-[rgb(var(--c-hairline)/0.04)]">
                      <tr>
                        {preview.fields.map((field) => (
                          <th
                            key={field}
                            className="whitespace-nowrap px-3 py-2 font-mono text-[11.5px] font-medium text-faint"
                          >
                            {field}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((row, i) => (
                        <tr key={i} className="border-t border-[rgb(var(--c-hairline)/0.06)]">
                          {preview.fields.map((field) => (
                            <td
                              key={field}
                              className="whitespace-nowrap px-3 py-2 text-[12.5px] text-muted"
                            >
                              {String(row[field] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Button onClick={runAnalysis} className="mt-4" icon={Sparkles}>
                  Run analysis
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Staged processing feedback */}
        <AnimatePresence>
          {stage >= 0 && (
            <motion.ul
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-5 space-y-2.5 overflow-hidden"
            >
              {STAGES.map((label, i) => {
                const done = i < stage
                const active = i === stage
                return (
                  <li
                    key={label}
                    className={cn(
                      'flex items-center gap-2.5 text-[13px] transition-colors',
                      done ? 'text-muted' : active ? 'text-ink' : 'text-faint',
                    )}
                  >
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-success" strokeWidth={2.1} />
                    ) : active ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand" strokeWidth={2.1} />
                    ) : (
                      <span className="h-4 w-4 shrink-0 rounded-full border border-[rgb(var(--c-hairline)/0.2)]" />
                    )}
                    {label}
                  </li>
                )
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </section>

      {hasData && (
      <div ref={resultsRef} className="scroll-mt-6 space-y-6">
        {/* Result summary bar */}
        {(
          <Reveal>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[rgb(var(--c-hairline)/0.1)] bg-[rgb(var(--c-hairline)/0.03)] px-5 py-3.5">
              <p className="text-[13px] text-muted">
                Analysing{' '}
                <span className="font-medium text-ink">{number(data.rowsAnalysed)} records</span> from{' '}
                <span className="font-mono text-[12.5px] text-ink">
                  {dataset?.filename ?? `upload #${data.uploadId}`}
                </span>
              </p>
              <Badge tone={data.hasCostData ? 'success' : 'warn'}>
                {data.hasCostData ? 'Cost data present' : 'No cost data'}
              </Badge>
            </div>
          </Reveal>
        )}

        {/* KPI row */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <KpiCard
            index={0}
            label="Revenue"
            value={k?.revenue ?? 0}
            format={(v) => currencyCompact(v)}
            delta={k?.deltas?.revenue}
            icon={IndianRupee}
          />
          <KpiCard
            index={1}
            label="Orders"
            value={k?.orders ?? 0}
            format={(v) => number(Math.round(v))}
            delta={k?.deltas?.orders}
            icon={ShoppingCart}
          />
          <KpiCard
            index={2}
            label="Avg order value"
            value={k?.aov ?? 0}
            format={(v) => currency(v)}
            delta={k?.deltas?.aov}
            icon={Receipt}
          />
          <KpiCard
            index={3}
            label="Repeat rate"
            value={k?.repeatRate ?? 0}
            decimals={1}
            format={(v) => percent(v)}
            delta={k?.deltas?.repeatRate}
            icon={Repeat}
          />
          <KpiCard
            index={4}
            label="Profit margin"
            value={k?.margin ?? 0}
            decimals={1}
            format={(v) => percent(v)}
            delta={k?.deltas?.margin}
            icon={TrendingUp}
          />
        </div>

        {/* Sales by period */}
        <ChartCard
          index={0}
          title="Sales by period"
          description="The same dataset grouped by month, quarter or year."
          icon={BarChart3}
          action={
            <SegmentedTabs
              items={PERIODS}
              value={period}
              onChange={setPeriod}
              size="sm"
              layoutId="analysis-period"
            />
          }
        >
          <SalesBarChart
            key={period}
            data={periodData}
            secondKey="profit"
            height={300}
          />
        </ChartCard>

        {/* Trend + category */}
        <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <ChartCard
            index={0}
            title="Revenue and order trend"
            description="Revenue over time with order volume overlaid."
            icon={TrendingUp}
          >
            <RevenueLineChart data={data?.revenueTrend ?? []} showOrders height={290} />
          </ChartCard>

          <ChartCard
            index={1}
            title="Share by category"
            description="Proportion of revenue per category."
            icon={PieIcon}
          >
            <CategoryDonut data={data?.categoryShare ?? []} height={290} />
          </ChartCard>
        </div>

        {/* Histogram + retention - premium on Free */}
        <div className="grid gap-4 xl:grid-cols-2">
          <PremiumLock locked={isFree} feature="Order value distribution">
            <ChartCard
              index={0}
                title="Order value distribution"
              description="How many orders fall into each value band."
              icon={Activity}
            >
              <OrderHistogram data={data?.orderValueHistogram ?? []} height={270} />
            </ChartCard>
          </PremiumLock>

          <PremiumLock locked={isFree} feature="Customer retention">
            <ChartCard
              index={1}
                title="Retention and repeat purchase"
              description="New against returning customers, month over month."
              icon={Users}
            >
              <RetentionChart data={data?.retention ?? []} height={270} />
            </ChartCard>
          </PremiumLock>
        </div>

        {/* Top products */}
        <ChartCard
          index={0}
          title="Top performing products"
          description="Ranked by revenue, with units sold and profit contribution."
          icon={TrendingUp}
        >
          <SalesBarChart
            data={data?.topProducts ?? []}
            layout="horizontal"
            height={300}
          />
        </ChartCard>

        {/* Branch profitability */}
        <PremiumLock locked={isFree} feature="Branch profitability">
          <ChartCard
            index={0}
            title="Branch and regional profitability"
            description="Revenue set against cost per branch, so you can see where sales are most profitable - not just highest."
            icon={Building}
            footer={
              bestBranch &&
              mostProfitable && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[11.5px] font-medium uppercase tracking-[0.07em] text-faint">
                      Highest revenue
                    </p>
                    <p className="mt-1.5 text-[15px] font-semibold text-ink">{bestBranch.name}</p>
                    <p className="numeric mt-0.5 text-[12.5px] text-muted">
                      {currency(bestBranch.revenue)} across {number(bestBranch.orders)} orders
                    </p>
                  </div>
                  <div>
                    <p className="text-[11.5px] font-medium uppercase tracking-[0.07em] text-faint">
                      Most profitable
                    </p>
                    <p className="mt-1.5 text-[15px] font-semibold text-ink">
                      {mostProfitable.name}
                    </p>
                    <p className="numeric mt-0.5 text-[12.5px] text-success">
                      {percent(mostProfitable.margin)} margin on {currency(mostProfitable.revenue)}
                    </p>
                  </div>
                </div>
              )
            }
          >
            <Table>
              <THead
                columns={[
                  { label: 'Branch' },
                  { label: 'Region' },
                  { label: 'Revenue share' },
                  { label: 'Revenue', align: 'right' },
                  { label: 'Cost', align: 'right' },
                  { label: 'Profit', align: 'right' },
                  { label: 'Margin', align: 'right' },
                ]}
              />
              <tbody>
                {branches.map((branch, i) => (
                  <TRow key={branch.name} index={i}>
                    <TCell className="font-medium">{branch.name}</TCell>
                    <TCell muted>{branch.region}</TCell>
                    <TCell className="w-32">
                      <CellBar value={branch.revenue} max={maxBranchRevenue} />
                    </TCell>
                    <TCell align="right" numeric>
                      {currencyCompact(branch.revenue)}
                    </TCell>
                    <TCell align="right" numeric muted>
                      {currencyCompact(branch.cost)}
                    </TCell>
                    <TCell align="right" numeric>
                      {currencyCompact(branch.profit)}
                    </TCell>
                    <TCell align="right">
                      <Badge tone={branch.margin >= 30 ? 'success' : branch.margin >= 20 ? 'warn' : 'danger'}>
                        {percent(branch.margin)}
                      </Badge>
                    </TCell>
                  </TRow>
                ))}
              </tbody>
            </Table>
          </ChartCard>
        </PremiumLock>
      </div>
      )}
    </PageTransition>
  )
}
