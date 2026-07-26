import type { City } from './types'

/** Shown on first visit when no `?city=` param and no cached city exist. */
export const DEFAULT_CITY: City = {
  id: 2955272,
  name: 'Aschaffenburg',
  admin1: 'Bavaria',
  country: 'Germany',
  countryCode: 'DE',
  latitude: 49.97704,
  longitude: 9.15214,
  timezone: 'Europe/Berlin',
}
