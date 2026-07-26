export interface City {
  id: number
  name: string
  admin1?: string
  country: string
  countryCode: string
  latitude: number
  longitude: number
  timezone?: string
}

/** A weather model exposed by Open-Meteo, treated as one independent official source. */
export interface Source {
  /** Open-Meteo model id (used in the `models=` query param). */
  id: string
  /** Short human label, e.g. "ICON". */
  label: string
  /** Operating meteorological service, e.g. "DWD · Germany". */
  org: string
  flag: string
}

/** Aggregated statistics across all sources for one metric on one day. */
export interface Agg {
  /** Median value across sources (null when no source has data). */
  median: number | null
  /** 10th percentile (lower error bound). */
  p10: number | null
  /** 90th percentile (upper error bound). */
  p90: number | null
  min: number | null
  max: number | null
  /** Number of sources contributing a value. */
  count: number
  /** Raw per-source values that were available. */
  values: number[]
}

export interface DayForecast {
  /** ISO date (YYYY-MM-DD). */
  date: string
  tMax: Agg
  tMin: Agg
  precip: Agg
  /** Max number of sources that contributed any temperature value this day. */
  sourceCount: number
}

export interface ForecastResult {
  days: DayForecast[]
  /** Sources that returned at least one usable value. */
  activeSources: Source[]
  /** Units reported by the API. */
  units: { temp: string; precip: string }
  /** Latest observed/nowcast conditions for the location. */
  current: { temp: number | null; time: string | null }
}
