import type { Agg } from './types'

/** Linear-interpolated percentile of an unsorted numeric array. p in [0,100]. */
export function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null
  if (values.length === 1) return values[0]
  const sorted = [...values].sort((a, b) => a - b)
  const rank = (p / 100) * (sorted.length - 1)
  const lo = Math.floor(rank)
  const hi = Math.ceil(rank)
  if (lo === hi) return sorted[lo]
  const frac = rank - lo
  return sorted[lo] * (1 - frac) + sorted[hi] * frac
}

export function median(values: number[]): number | null {
  return percentile(values, 50)
}

/** Build the aggregate for one metric from the raw per-source values (nulls already removed). */
export function aggregate(raw: (number | null | undefined)[]): Agg {
  const values = raw.filter((v): v is number => v != null && Number.isFinite(v))
  if (values.length === 0) {
    return { median: null, p10: null, p90: null, min: null, max: null, count: 0, values: [] }
  }
  return {
    median: median(values),
    p10: percentile(values, 10),
    p90: percentile(values, 90),
    min: Math.min(...values),
    max: Math.max(...values),
    count: values.length,
    values,
  }
}
