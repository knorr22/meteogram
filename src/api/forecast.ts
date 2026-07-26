import type { City, DayForecast, ForecastResult, Source } from '../lib/types'
import { aggregate } from '../lib/stats'
import { SOURCES } from './sources'

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
export const FORECAST_DAYS = 14

const METRICS = ['temperature_2m_max', 'temperature_2m_min', 'precipitation_sum'] as const

interface DailyBlock {
  time: string[]
  [key: string]: (number | null)[] | string[]
}

/**
 * Fetch a 14-day forecast for every source in one Open-Meteo request, then
 * aggregate across sources into median + P10/P90 error band per day.
 */
export async function fetchForecast(city: City, signal?: AbortSignal): Promise<ForecastResult> {
  const models = SOURCES.map((s) => s.id).join(',')
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    daily: METRICS.join(','),
    models,
    forecast_days: String(FORECAST_DAYS),
    timezone: 'auto',
  })
  const res = await fetch(`${FORECAST_URL}?${params}`, { signal })
  if (!res.ok) throw new Error(`Forecast request failed (${res.status})`)
  const data = await res.json()
  const daily = data.daily as DailyBlock
  const dates = daily.time
  const tempUnit: string = data.daily_units?.temperature_2m_max ?? '°C'
  const precipUnit: string = data.daily_units?.precipitation_sum ?? 'mm'

  const activeSet = new Set<string>()

  const days: DayForecast[] = dates.map((date, i) => {
    const perSource = (metric: string) =>
      SOURCES.map((s) => {
        const arr = daily[`${metric}_${s.id}`] as (number | null)[] | undefined
        return arr ? arr[i] : null
      })

    const maxVals = perSource('temperature_2m_max')
    const minVals = perSource('temperature_2m_min')
    const precipVals = perSource('precipitation_sum')

    // Track which sources are contributing (based on temperature availability).
    SOURCES.forEach((s, si) => {
      if (maxVals[si] != null || minVals[si] != null) activeSet.add(s.id)
    })

    const tMax = aggregate(maxVals)
    const tMin = aggregate(minVals)
    const precip = aggregate(precipVals)

    return {
      date,
      tMax,
      tMin,
      precip,
      sourceCount: Math.max(tMax.count, tMin.count),
    }
  })

  const activeSources: Source[] = SOURCES.filter((s) => activeSet.has(s.id))

  return {
    days,
    activeSources,
    units: { temp: tempUnit, precip: precipUnit },
  }
}
