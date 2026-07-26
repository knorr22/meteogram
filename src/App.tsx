import { useEffect, useState } from 'react'
import type { City, ForecastResult } from './lib/types'
import { fetchForecast } from './api/forecast'
import { searchCities } from './api/geocoding'
import { CitySearch } from './components/CitySearch'
import { Meteogram } from './components/Meteogram'
import { SourceLegend } from './components/SourceLegend'
import { loadLastCity, saveLastCity } from './lib/storage'
import { getUrlCity, getUrlFullscreen, setUrlFullscreen } from './lib/url'
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
  // Fullscreen state is initialised from — and kept in sync with — the URL.
  const [fullscreen, setFullscreen] = useState(() => getUrlFullscreen())

  // Explicit user selection: this is what persists to the browser cache.
  function selectCity(next: City) {
    saveLastCity(next)
    setCity(next)
  }

  function toggleFullscreen(on = !fullscreen) {
    setUrlFullscreen(on)
    setFullscreen(on)
  }

  // Lock background scroll and allow Escape to leave fullscreen.
  useEffect(() => {
    document.body.classList.toggle('no-scroll', fullscreen)
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') toggleFullscreen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreen])

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
    <div className={`app${fullscreen ? ' is-fullscreen' : ''}`}>
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
            <div className={`panel${fullscreen ? ' panel--fullscreen' : ''}`}>
              <button
                type="button"
                className="fs-btn"
                aria-label={fullscreen ? t.exitFullscreen : t.fullscreen}
                title={fullscreen ? t.exitFullscreen : t.fullscreen}
                onClick={() => toggleFullscreen()}
              >
                <svg viewBox="0 0 24 24" aria-hidden>
                  {fullscreen ? (
                    <path
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 4v3a2 2 0 0 1-2 2H4m16 0h-3a2 2 0 0 1-2-2V4M4 15h3a2 2 0 0 1 2 2v3m6 0v-3a2 2 0 0 1 2-2h3"
                    />
                  ) : (
                    <path
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 9V6a2 2 0 0 1 2-2h3m6 0h3a2 2 0 0 1 2 2v3m0 6v3a2 2 0 0 1-2 2h-3m-6 0H6a2 2 0 0 1-2-2v-3"
                    />
                  )}
                </svg>
              </button>
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
