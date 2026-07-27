import { useEffect, useRef, useState } from 'react'
import type { City } from '../lib/types'
import { searchCities } from '../api/geocoding'
import { useDebounce } from '../hooks/useDebounce'
import { t } from '../lib/i18n'

interface Props {
  onSelect: (city: City) => void
  selected: City | null
}

function label(c: City): string {
  return [c.name, c.admin1, c.country].filter(Boolean).join(', ')
}

export function CitySearch({ onSelect, selected }: Props) {
  // Seed the input with a restored (persisted) city so the box isn't empty on load.
  const [query, setQuery] = useState(() => (selected ? label(selected) : ''))
  const [results, setResults] = useState<City[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [loading, setLoading] = useState(false)
  const debounced = useDebounce(query, 250)
  const boxRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // Set right after a selection so the search effect skips the re-run that
  // `selected` changing triggers while `debounced` still holds the old text.
  const suppressSearchRef = useRef(false)

  // Clear the field and refocus so the user can type a new city right away.
  // Focusing inside the click gesture also raises the on-screen keyboard on mobile.
  function reset() {
    setQuery('')
    setResults([])
    setActive(0)
    setOpen(false)
    inputRef.current?.focus()
  }

  // Reflect a city set from outside (e.g. resolved from the URL after mount).
  useEffect(() => {
    if (selected) setQuery(label(selected))
  }, [selected])

  useEffect(() => {
    // A just-committed selection must not reopen the dropdown.
    if (suppressSearchRef.current) {
      suppressSearchRef.current = false
      return
    }
    const q = debounced.trim()
    if (q.length < 2) {
      setResults([])
      return
    }
    // Don't re-search the value we just committed.
    if (selected && q === label(selected)) return
    const ctrl = new AbortController()
    setLoading(true)
    searchCities(q, ctrl.signal)
      .then((r) => {
        setResults(r)
        setActive(0)
        setOpen(true)
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setResults([])
      })
      .finally(() => setLoading(false))
    return () => ctrl.abort()
  }, [debounced, selected])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function choose(c: City) {
    suppressSearchRef.current = true
    onSelect(c)
    setQuery(label(c))
    setOpen(false)
    setResults([])
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      choose(results[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="citysearch" ref={boxRef}>
      <div className="citysearch__field">
        <svg viewBox="0 0 24 24" className="citysearch__icon" aria-hidden>
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm10 17-5-5"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={t.searchPlaceholder}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => results.length && setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {loading && <span className="citysearch__spinner" aria-label="loading" />}
        {!loading && query && (
          <button
            type="button"
            className="citysearch__clear"
            aria-label={t.clear}
            title={t.clear}
            onMouseDown={(e) => e.preventDefault()}
            onClick={reset}
          >
            <svg viewBox="0 0 24 24" aria-hidden>
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                d="M6 6l12 12M18 6L6 18"
              />
            </svg>
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <ul className="citysearch__list" role="listbox">
          {results.map((c, i) => (
            <li
              key={c.id}
              role="option"
              aria-selected={i === active}
              className={i === active ? 'is-active' : ''}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault()
                choose(c)
              }}
            >
              <span className="citysearch__name">{c.name}</span>
              <span className="citysearch__meta">
                {[c.admin1, c.country].filter(Boolean).join(', ')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
