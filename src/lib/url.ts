/** A city requested via URL, e.g. `?city=Munich` or `?city=Munich&country=DE`. */
export interface UrlCity {
  name: string
  /** Optional ISO country code or name to disambiguate (e.g. "DE", "Germany"). */
  country?: string
}

/** Read a city passed as a GET parameter, or null if none is present. */
export function getUrlCity(): UrlCity | null {
  const p = new URLSearchParams(location.search)
  const name = p.get('city')?.trim()
  if (!name) return null
  const country = p.get('country')?.trim() || undefined
  return { name, country }
}

/** Whether `?fullscreen=1` (or `true`) is set in the URL. */
export function getUrlFullscreen(): boolean {
  const v = new URLSearchParams(location.search).get('fullscreen')?.toLowerCase()
  return v === '1' || v === 'true'
}

/** Reflect fullscreen state in the URL without adding a history entry. */
export function setUrlFullscreen(on: boolean): void {
  const url = new URL(location.href)
  if (on) url.searchParams.set('fullscreen', '1')
  else url.searchParams.delete('fullscreen')
  history.replaceState(null, '', url)
}
