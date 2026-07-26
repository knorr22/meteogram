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
