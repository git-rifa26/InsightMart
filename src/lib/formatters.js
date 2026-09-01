const LOCALE = 'en-IN'

/** Full currency, e.g. Rs 12,45,300 */
export function currency(value, { decimals = 0, symbol = '₹' } = {}) {
  if (value == null || Number.isNaN(value)) return '—'
  return (
    symbol +
    Number(value).toLocaleString(LOCALE, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  )
}

/** Shortened currency for chart axes and tight cards, e.g. Rs 12.4L */
export function currencyCompact(value, symbol = '₹') {
  if (value == null || Number.isNaN(value)) return '—'
  const n = Number(value)
  const abs = Math.abs(n)
  if (abs >= 1e7) return `${symbol}${(n / 1e7).toFixed(2)}Cr`
  if (abs >= 1e5) return `${symbol}${(n / 1e5).toFixed(2)}L`
  if (abs >= 1e3) return `${symbol}${(n / 1e3).toFixed(1)}K`
  return symbol + n.toFixed(0)
}

export function compactNumber(value) {
  if (value == null || Number.isNaN(value)) return '—'
  return Number(value).toLocaleString(LOCALE, { notation: 'compact', maximumFractionDigits: 1 })
}

export function number(value, decimals = 0) {
  if (value == null || Number.isNaN(value)) return '—'
  return Number(value).toLocaleString(LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function percent(value, decimals = 1) {
  if (value == null || Number.isNaN(value)) return '—'
  return `${Number(value).toFixed(decimals)}%`
}

/** Signed percentage used on KPI deltas. */
export function delta(value, decimals = 1) {
  if (value == null || Number.isNaN(value)) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${Number(value).toFixed(decimals)}%`
}

export function shortDate(input) {
  const d = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function relativeTime(input) {
  const d = input instanceof Date ? input : new Date(input)
  const diff = Date.now() - d.getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return shortDate(d)
}

export function fileSize(bytes) {
  if (!bytes) return '0 KB'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

export function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
