import type { City } from './types'

const KEY = 'meteogram.lastCity'

/** Read the last selected city from localStorage (null if none / unavailable). */
export function loadLastCity(): City | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const c = JSON.parse(raw) as City
    // Minimal shape check so a stale/corrupt entry can't crash the app.
    if (typeof c?.latitude === 'number' && typeof c?.longitude === 'number' && c?.name) {
      return c
    }
    return null
  } catch {
    return null
  }
}

/** Persist (or clear) the last selected city. */
export function saveLastCity(city: City | null): void {
  try {
    if (city) localStorage.setItem(KEY, JSON.stringify(city))
    else localStorage.removeItem(KEY)
  } catch {
    /* storage disabled / full — ignore, persistence is best-effort */
  }
}
