/**
 * One source of truth for chart colour and geometry.
 *
 * Recharts cannot read CSS custom properties for canvas-drawn fills, so the
 * palette is resolved from the document at call time. Charts re-read it when
 * the theme changes via the `key` prop on the chart container.
 */

/** Reads a token off :root and returns it as a usable rgb() string. */
export function token(name, alpha) {
  if (typeof window === 'undefined') return '#6366F1'
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  if (!raw) return '#6366F1'
  return alpha == null ? `rgb(${raw})` : `rgba(${raw.split(' ').join(', ')}, ${alpha})`
}

/**
 * Categorical series colours, ordered so neighbouring slices stay
 * distinguishable in both themes and for common colour-vision deficiencies.
 */
export function seriesPalette() {
  return [
    token('--c-brand'),
    token('--c-cyan'),
    token('--c-violet'),
    token('--c-warn'),
    token('--c-success'),
    token('--c-danger'),
  ]
}

export function chartColors() {
  return {
    brand: token('--c-brand'),
    violet: token('--c-violet'),
    cyan: token('--c-cyan'),
    success: token('--c-success'),
    warn: token('--c-warn'),
    danger: token('--c-danger'),
    grid: token('--c-hairline', 0.09),
    axis: token('--c-faint'),
    series: seriesPalette(),
  }
}

/** Shared axis props so every chart lines up visually. */
export const axisProps = {
  tickLine: false,
  axisLine: false,
  tick: { fontSize: 11.5, fontFamily: 'Inter, sans-serif' },
}

export const CHART_MARGIN = { top: 8, right: 8, bottom: 0, left: -12 }
