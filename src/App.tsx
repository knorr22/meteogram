import { useEffect, useState } from 'react'
import type { City, ForecastResult } from './lib/types'
import { fetchForecast } from './api/forecast'
import { searchCities } from './api/geocoding'
import { CitySearch } from './components/CitySearch'
import { Meteogram } from './components/Meteogram'
import { SourceLegend } from './components/SourceLegend'
import { loadLastCity, saveLastCity } from './lib/storage'
import { getUrlCity } from './lib/url'
import { DEFAULT_CITY } from './lib/defaults'
import { t } from './lib/i18n'

export default function App() {
  // Priority: `?city=` URL param → cached city → default city. When a URL param
  // is present we start empty and resolve it async (below); otherwise restore
  // from cache, falling back to the default on first visit.
  const [city, setCity] = useState<City | null>(() =>
    getUrlCity() ? null : loadLastCity() ?? DEFAULT_CITY
  )
  const [data, setData] = useState<ForecastResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Explicit user selection: this is what persists to the browser cache.
  function selectCity(next: City) {
    saveLastCity(next)
    setCity(next)
  }

  // Resolve a city handed over via the URL. It wins over the cache and is
  // deliberately NOT written back to it (setCity, not selectCity).
  useEffect(() => {
    const u = getUrlCity()
    if (!u) return
    let cancelled = false
    searchCities(u.name)
      .then((results) => {
        if (cancelled) return
        const wanted = u.country?.toLowerCase()
        const pick =
          (wanted &&
            results.find(
              (r) => r.countryCode.toLowerCase() === wanted || r.country.toLowerCase() === wanted
            )) ||
          results[0]
        // Fall back to the cache, then the default, if the URL city can't resolve.
        setCity(pick ?? loadLastCity() ?? DEFAULT_CITY)
      })
      .catch(() => {
        if (!cancelled) setCity(loadLastCity() ?? DEFAULT_CITY)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!city) return
    const ctrl = new AbortController()
    setLoading(true)
    setError(null)
    fetchForecast(city, ctrl.signal)
      .then(setData)
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message ?? t.errorPrefix)
      })
      .finally(() => setLoading(false))
    return () => ctrl.abort()
  }, [city])

  return (
    <div className="app">
      <div className="aurora" aria-hidden />
      <header className="hero">
        <div className="hero__badge">{t.badge}</div>
        <h1 className="hero__title">
          {t.titleLine1}<span>{t.titleLine2}</span>
        </h1>
        <p className="hero__sub">{t.heroSub}</p>
        <div className="hero__search">
          <CitySearch onSelect={selectCity} selected={city} />
        </div>
      </header>

      <main className="stage">
        {loading && (
          <div className="panel panel--state">
            <span className="loader" />
            <p>{t.loading}</p>
          </div>
        )}

        {error && !loading && (
          <div className="panel panel--state panel--error">
            <p>⚠ {error}</p>
          </div>
        )}

        {!loading && !error && data && city && (
          <>
            <div className="panel">
              <div className="panel__head">
                <div>
                  <h2 className="panel__city">
                    {city.name}
                    <span className="panel__country">
                      {city.admin1 ? `${city.admin1}, ` : ''}
                      {city.country}
                    </span>
                  </h2>
                  <p className="panel__coords">
                    {city.latitude.toFixed(2)}°, {city.longitude.toFixed(2)}°
                  </p>
                </div>
                <div className="legend">
                  <span className="legend__item">
                    <span className="legend__swatch legend__swatch--max" /> {t.legendHigh}
                  </span>
                  <span className="legend__item">
                    <span className="legend__swatch legend__swatch--min" /> {t.legendLow}
                  </span>
                  <span className="legend__item">
                    <span className="legend__swatch legend__swatch--band" /> {t.legendBand}
                  </span>
                </div>
              </div>
              <Meteogram result={data} />
              <p className="panel__hint">{t.hint}</p>
            </div>
            <SourceLegend sources={data.activeSources} />
          </>
        )}

        {!loading && !error && !data && (
          <div className="panel panel--empty">
            <div className="empty__glyph">🌡️</div>
            <p>{t.empty}</p>
          </div>
        )}
      </main>

      <footer className="foot">
        {t.footerPre}{' '}
        <a href="https://open-meteo.com" target="_blank" rel="noreferrer">Open-Meteo</a>{' '}
        {t.footerPost}
      </footer>
    </div>
  )
}
