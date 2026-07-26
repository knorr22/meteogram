import type { City } from '../lib/types'
import { lang } from '../lib/i18n'

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search'

interface GeoApiResult {
  id: number
  name: string
  admin1?: string
  country: string
  country_code: string
  latitude: number
  longitude: number
  timezone?: string
}

/** Search cities by (partial) name. Returns matches with country for disambiguation. */
export async function searchCities(query: string, signal?: AbortSignal): Promise<City[]> {
  const q = query.trim()
  if (q.length < 2) return []
  const url = `${GEO_URL}?name=${encodeURIComponent(q)}&count=8&language=${lang}&format=json`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`)
  const data = (await res.json()) as { results?: GeoApiResult[] }
  if (!data.results) return []
  return data.results.map((r) => ({
    id: r.id,
    name: r.name,
    admin1: r.admin1,
    country: r.country,
    countryCode: r.country_code,
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone,
  }))
}
