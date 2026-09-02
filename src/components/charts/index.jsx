import { useMemo } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  ComposedChart,
} from 'recharts'

import { ChartTooltip, ChartLegend } from './ChartTooltip'
import { chartColors, axisProps, CHART_MARGIN } from './chartTheme'
import { useTheme } from '@/context/ThemeContext'
import { currencyCompact, currency, number } from '@/lib/formatters'

/** Re-resolves palette tokens whenever the theme flips. */
function usePalette() {
  const { resolved } = useTheme()
  return useMemo(() => chartColors(), [resolved])
}

/* ------------------------------------------------------------------ *
 * Line / area - revenue and order trends over time
 * ------------------------------------------------------------------ */

export function RevenueLineChart({ data, height = 280, showOrders = false, animationBegin = 0 }) {
  const c = usePalette()

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={CHART_MARGIN}>
        <defs>
          <linearGradient id="rev-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.brand} stopOpacity={0.32} />
            <stop offset="100%" stopColor={c.brand} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="rev-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={c.brand} />
            <stop offset="100%" stopColor={c.cyan} />
          </linearGradient>
        </defs>

        <CartesianGrid stroke={c.grid} vertical={false} />
        <XAxis dataKey="name" {...axisProps} tick={{ ...axisProps.tick, fill: c.axis }} />
        <YAxis
          {...axisProps}
          tick={{ ...axisProps.tick, fill: c.axis }}
          tickFormatter={(v) => currencyCompact(v)}
          width={64}
        />
        <Tooltip
          cursor={{ stroke: c.grid, strokeWidth: 1 }}
          content={<ChartTooltip format={(v, e) => (e.dataKey === 'orders' ? number(v) : currency(v))} />}
        />

        <Area
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="url(#rev-stroke)"
          strokeWidth={2.5}
          fill="url(#rev-area)"
          animationBegin={animationBegin}
          animationDuration={1400}
        />
        {showOrders && (
          <Line
            type="monotone"
            dataKey="orders"
            name="Orders"
            stroke={c.violet}
            strokeWidth={2}
            dot={false}
            animationBegin={animationBegin + 260}
            animationDuration={1400}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  )
}

/* ------------------------------------------------------------------ *
 * Bar - sales by period, top products, categories, regions
 * ------------------------------------------------------------------ */

export function SalesBarChart({
  data,
  dataKey = 'revenue',
  height = 280,
  layout = 'vertical',
  animationBegin = 0,
  valueFormat = currency,
  secondKey,
}) {
  const c = usePalette()
  const horizontal = layout === 'horizontal'

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={horizontal ? { top: 4, right: 16, bottom: 4, left: 4 } : CHART_MARGIN}
      >
        <defs>
          <linearGradient id="bar-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.brand} />
            <stop offset="100%" stopColor={c.violet} stopOpacity={0.75} />
          </linearGradient>
          <linearGradient id="bar-fill-h" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={c.brand} />
            <stop offset="100%" stopColor={c.cyan} />
          </linearGradient>
        </defs>

        <CartesianGrid stroke={c.grid} vertical={horizontal} horizontal={!horizontal} />

        {horizontal ? (
          <>
            <XAxis type="number" {...axisProps} tick={{ ...axisProps.tick, fill: c.axis }} tickFormatter={(v) => currencyCompact(v)} />
            <YAxis
              type="category"
              dataKey="name"
              {...axisProps}
              tick={{ ...axisProps.tick, fill: c.axis }}
              width={132}
            />
          </>
        ) : (
          <>
            <XAxis dataKey="name" {...axisProps} tick={{ ...axisProps.tick, fill: c.axis }} />
            <YAxis
              {...axisProps}
              tick={{ ...axisProps.tick, fill: c.axis }}
              tickFormatter={(v) => currencyCompact(v)}
              width={64}
            />
          </>
        )}

        <Tooltip
          cursor={{ fill: c.grid }}
          content={<ChartTooltip format={(v) => valueFormat(v)} />}
        />

        <Bar
          dataKey={dataKey}
          name="Revenue"
          fill={horizontal ? 'url(#bar-fill-h)' : 'url(#bar-fill)'}
          radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]}
          maxBarSize={horizontal ? 22 : 46}
          animationBegin={animationBegin}
          animationDuration={1100}
        />
        {secondKey && (
          <Bar
            dataKey={secondKey}
            name="Profit"
            fill={c.success}
            fillOpacity={0.55}
            radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]}
            maxBarSize={horizontal ? 22 : 46}
            animationBegin={animationBegin + 200}
            animationDuration={1100}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  )
}

/* ------------------------------------------------------------------ *
 * Donut - share of sales by category or region
 * ------------------------------------------------------------------ */

export function CategoryDonut({ data, height = 280, dataKey = 'revenue', animationBegin = 0 }) {
  const c = usePalette()
  const total = data.reduce((sum, row) => sum + row[dataKey], 0)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Tooltip
          content={
            <ChartTooltip
              format={(v) => `${currency(v)}  (${((v / total) * 100).toFixed(1)}%)`}
            />
          }
        />
        <Pie
          data={data}
          dataKey={dataKey}
          nameKey="name"
          innerRadius="58%"
          outerRadius="86%"
          paddingAngle={2.5}
          stroke="none"
          animationBegin={animationBegin}
          animationDuration={1000}
        >
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={c.series[i % c.series.length]} />
          ))}
        </Pie>
        <Legend content={<ChartLegend />} verticalAlign="bottom" />
      </PieChart>
    </ResponsiveContainer>
  )
}

/* ------------------------------------------------------------------ *
 * Histogram - distribution of order values
 * ------------------------------------------------------------------ */

export function OrderHistogram({ data, height = 260, animationBegin = 0 }) {
  const c = usePalette()

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={CHART_MARGIN} barCategoryGap="12%">
        <defs>
          <linearGradient id="hist-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.cyan} />
            <stop offset="100%" stopColor={c.brand} stopOpacity={0.7} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={c.grid} vertical={false} />
        <XAxis dataKey="name" {...axisProps} tick={{ ...axisProps.tick, fill: c.axis }} />
        <YAxis {...axisProps} tick={{ ...axisProps.tick, fill: c.axis }} width={40} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: c.grid }}
          content={<ChartTooltip format={(v) => `${number(v)} orders`} labelSuffix="range" />}
        />
        <Bar
          dataKey="count"
          name="Orders"
          fill="url(#hist-fill)"
          radius={[5, 5, 0, 0]}
          animationBegin={animationBegin}
          animationDuration={1100}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

/* ------------------------------------------------------------------ *
 * Retention - new vs returning customers
 * ------------------------------------------------------------------ */

export function RetentionChart({ data, height = 260, animationBegin = 0 }) {
  const c = usePalette()

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={CHART_MARGIN}>
        <defs>
          <linearGradient id="ret-new" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.brand} stopOpacity={0.4} />
            <stop offset="100%" stopColor={c.brand} stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="ret-ret" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.cyan} stopOpacity={0.4} />
            <stop offset="100%" stopColor={c.cyan} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={c.grid} vertical={false} />
        <XAxis dataKey="name" {...axisProps} tick={{ ...axisProps.tick, fill: c.axis }} />
        <YAxis {...axisProps} tick={{ ...axisProps.tick, fill: c.axis }} width={40} allowDecimals={false} />
        <Tooltip content={<ChartTooltip format={(v) => `${number(v)} customers`} />} />
        <Area
          type="monotone"
          dataKey="newCustomers"
          name="New"
          stackId="1"
          stroke={c.brand}
          strokeWidth={2}
          fill="url(#ret-new)"
          animationBegin={animationBegin}
          animationDuration={1200}
        />
        <Area
          type="monotone"
          dataKey="returning"
          name="Returning"
          stackId="1"
          stroke={c.cyan}
          strokeWidth={2}
          fill="url(#ret-ret)"
          animationBegin={animationBegin + 200}
          animationDuration={1200}
        />
        <Legend content={<ChartLegend />} verticalAlign="bottom" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/** Tiny inline trend used inside KPI cards. */
export function Sparkline({ data, color, height = 40 }) {
  const c = usePalette()
  const stroke = color ?? c.brand

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`spark-${stroke}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="revenue"
          stroke={stroke}
          strokeWidth={1.8}
          fill={`url(#spark-${stroke})`}
          dot={false}
          animationDuration={1200}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export { ChartTooltip, ChartLegend }
