import { useMemo, useRef, useState } from 'react'
import type { DayForecast, ForecastResult } from '../lib/types'
import { useElementWidth } from '../hooks/useElementWidth'
import { locale, t } from '../lib/i18n'

interface Props {
  result: ForecastResult
}

const HEADER_H = 50
const TEMP_H = 300
const GAP = 10
const PRECIP_H = 78
const PAD_X = 14
const MIN_WIDTH = 660

type Num = number | null

/** Build an SVG path over contiguous non-null runs (breaks the line on gaps). */
function linePath(days: DayForecast[], get: (d: DayForecast) => Num, x: (i: number) => number, y: (v: number) => number): string {
  let d = ''
  let pen = false
  days.forEach((day, i) => {
    const v = get(day)
    if (v == null) {
      pen = false
      return
    }
    d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)} `
    pen = true
  })
  return d.trim()
}

/** Build a filled band between an upper and lower accessor over contiguous runs. */
function bandPath(days: DayForecast[], up: (d: DayForecast) => Num, lo: (d: DayForecast) => Num, x: (i: number) => number, y: (v: number) => number): string {
  const segments: number[][] = []
  let cur: number[] = []
  days.forEach((day, i) => {
    if (up(day) == null || lo(day) == null) {
      if (cur.length) segments.push(cur)
      cur = []
    } else cur.push(i)
  })
  if (cur.length) segments.push(cur)

  return segments
    .map((seg) => {
      const top = seg.map((i) => `${x(i).toFixed(1)},${y(up(days[i])!).toFixed(1)}`)
      const bot = seg
        .slice()
        .reverse()
        .map((i) => `${x(i).toFixed(1)},${y(lo(days[i])!).toFixed(1)}`)
      return `M${top.join(' L')} L${bot.join(' L')} Z`
    })
    .join(' ')
}

export function Meteogram({ result }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const measured = useElementWidth(wrapRef)
  const [hover, setHover] = useState<number | null>(null)

  const { days, units } = result
  const n = days.length
  const width = Math.max(measured, MIN_WIDTH)
  const totalH = HEADER_H + TEMP_H + GAP + PRECIP_H + 12

  const layout = useMemo(() => {
    const colW = (width - PAD_X * 2) / n
    const x = (i: number) => PAD_X + colW * (i + 0.5)

    // Temperature domain across every band edge.
    let lo = Infinity
    let hi = -Infinity
    for (const d of days) {
      for (const v of [d.tMax.p10, d.tMax.p90, d.tMin.p10, d.tMin.p90]) {
        if (v != null) {
          lo = Math.min(lo, v)
          hi = Math.max(hi, v)
        }
      }
    }
    if (!Number.isFinite(lo)) {
      lo = 0
      hi = 30
    }
    const padT = Math.max(2, (hi - lo) * 0.14)
    lo -= padT
    hi += padT + 1
    const tempTop = HEADER_H + 22
    const tempBot = HEADER_H + TEMP_H - 22
    const y = (v: number) => tempTop + ((hi - v) / (hi - lo)) * (tempBot - tempTop)

    // Precipitation scale.
    let pMax = 0
    for (const d of days) if (d.precip.p90 != null) pMax = Math.max(pMax, d.precip.p90)
    pMax = Math.max(pMax, 4)
    const precipBase = HEADER_H + TEMP_H + GAP + PRECIP_H - 20
    const precipTop = HEADER_H + TEMP_H + GAP + 6
    const ph = (v: number) => ((precipBase - precipTop) * v) / pMax

    return { colW, x, y, tempTop, tempBot, lo, hi, precipBase, ph }
  }, [days, width, n])

  const { colW, x, y, lo, hi, precipBase, ph } = layout

  // Horizontal gridlines at "nice" temperature steps.
  const gridLines = useMemo(() => {
    const range = hi - lo
    const step = range > 40 ? 10 : range > 20 ? 5 : range > 8 ? 2 : 1
    const lines: number[] = []
    const start = Math.ceil(lo / step) * step
    for (let v = start; v <= hi; v += step) lines.push(v)
    return lines
  }, [lo, hi])

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * width
    const i = Math.floor((px - PAD_X) / colW)
    setHover(i >= 0 && i < n ? i : null)
  }

  const fmt = (v: Num, d = 0) => (v == null ? '–' : v.toFixed(d))
  const dow = (iso: string) =>
    new Date(iso + 'T00:00').toLocaleDateString(locale, { weekday: 'short' })
  const dm = (iso: string) => {
    const dt = new Date(iso + 'T00:00')
    return `${dt.getDate()}.${dt.getMonth() + 1}`
  }
  const todayIso = new Date().toISOString().slice(0, 10)

  const hoverDay = hover != null ? days[hover] : null

  return (
    <div className="meteogram" ref={wrapRef}>
      <div className="meteogram__scroll">
        <svg
          className="meteogram__svg"
          viewBox={`0 0 ${width} ${totalH}`}
          width={width}
          height={totalH}
          onPointerMove={handleMove}
          onPointerLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="gMax" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff8a3d" stopOpacity="0.42" />
              <stop offset="100%" stopColor="#ff5470" stopOpacity="0.06" />
            </linearGradient>
            <linearGradient id="gMin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4dd7ff" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#5b7cff" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="gPrecip" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#63b3ff" />
              <stop offset="100%" stopColor="#3f6bff" />
            </linearGradient>
          </defs>

          {/* Alternating day column shading + weekend highlight + hover */}
          {days.map((d, i) => {
            const isWeekend = [0, 6].includes(new Date(d.date + 'T00:00').getDay())
            const cls = hover === i ? 'col col--hover' : isWeekend ? 'col col--weekend' : i % 2 ? 'col col--odd' : 'col'
            return (
              <rect
                key={d.date}
                className={cls}
                x={PAD_X + colW * i}
                y={HEADER_H}
                width={colW}
                height={TEMP_H + GAP + PRECIP_H}
              />
            )
          })}

          {/* Gridlines */}
          {gridLines.map((v) => (
            <g key={v}>
              <line className="grid" x1={PAD_X} x2={width - PAD_X} y1={y(v)} y2={y(v)} />
              <text className="grid__label" x={PAD_X + 2} y={y(v) - 3}>
                {v}°
              </text>
            </g>
          ))}

          {/* Day headers */}
          {days.map((d, i) => (
            <g key={d.date}>
              <text className={`hdr__dow${d.date === todayIso ? ' is-today' : ''}`} x={x(i)} y={20} textAnchor="middle">
                {d.date === todayIso ? t.today : dow(d.date)}
              </text>
              <text className="hdr__date" x={x(i)} y={37} textAnchor="middle">
                {dm(d.date)}
              </text>
            </g>
          ))}

          {/* Error bands */}
          <path className="band" fill="url(#gMax)" d={bandPath(days, (d) => d.tMax.p90, (d) => d.tMax.p10, x, y)} />
          <path className="band" fill="url(#gMin)" d={bandPath(days, (d) => d.tMin.p90, (d) => d.tMin.p10, x, y)} />

          {/* Median lines */}
          <path className="line line--max" d={linePath(days, (d) => d.tMax.median, x, y)} />
          <path className="line line--min" d={linePath(days, (d) => d.tMin.median, x, y)} />

          {/* Points + labels */}
          {days.map((d, i) =>
            d.tMax.median != null ? (
              <g key={'mx' + i}>
                <circle className="dot dot--max" cx={x(i)} cy={y(d.tMax.median)} r={hover === i ? 4.5 : 3} />
                <text className="val val--max" x={x(i)} y={y(d.tMax.median) - 9} textAnchor="middle">
                  {Math.round(d.tMax.median)}°
                </text>
              </g>
            ) : null
          )}
          {days.map((d, i) =>
            d.tMin.median != null ? (
              <g key={'mn' + i}>
                <circle className="dot dot--min" cx={x(i)} cy={y(d.tMin.median)} r={hover === i ? 4.5 : 3} />
                <text className="val val--min" x={x(i)} y={y(d.tMin.median) + 17} textAnchor="middle">
                  {Math.round(d.tMin.median)}°
                </text>
              </g>
            ) : null
          )}

          {/* Precipitation bars (median) with P90 whisker */}
          {days.map((d, i) => {
            const m = d.precip.median ?? 0
            const p90 = d.precip.p90 ?? m
            const bw = Math.min(colW * 0.5, 22)
            const bx = x(i) - bw / 2
            const barH = ph(m)
            return (
              <g key={'pr' + i}>
                {p90 > m && (
                  <line className="precip__whisker" x1={x(i)} x2={x(i)} y1={precipBase - ph(p90)} y2={precipBase - barH} />
                )}
                {m > 0 && (
                  <rect className="precip__bar" x={bx} y={precipBase - barH} width={bw} height={Math.max(barH, 1.5)} rx={3} />
                )}
                {m >= 0.1 && (
                  <text className="precip__val" x={x(i)} y={precipBase + 15} textAnchor="middle">
                    {m < 10 ? m.toFixed(1) : Math.round(m)}
                  </text>
                )}
              </g>
            )
          })}
          <line className="precip__base" x1={PAD_X} x2={width - PAD_X} y1={precipBase} y2={precipBase} />
          <text className="axis__unit" x={PAD_X + 2} y={precipBase - ph(0) - 0} />
          <text className="precip__title" x={PAD_X} y={HEADER_H + TEMP_H + GAP + 2}>
            {t.precipTitle} ({units.precip})
          </text>
        </svg>
      </div>

      {hoverDay && (
        <Tooltip day={hoverDay} tempUnit={units.temp} precipUnit={units.precip} fmt={fmt} pos={x(hover!) / width} />
      )}
    </div>
  )
}

interface TipProps {
  day: DayForecast
  tempUnit: string
  precipUnit: string
  fmt: (v: Num, d?: number) => string
  pos: number
}

function Tooltip({ day, tempUnit, precipUnit, fmt, pos }: TipProps) {
  const dt = new Date(day.date + 'T00:00')
  const nice = dt.toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric' })
  const side = pos > 0.6 ? 'right' : 'left'
  return (
    <div className={`tip tip--${side}`} style={{ left: `${pos * 100}%` }}>
      <div className="tip__date">{nice}</div>
      <div className="tip__row">
        <span className="tip__dot tip__dot--max" />
        <span className="tip__k">{t.tipHigh}</span>
        <span className="tip__v">{fmt(day.tMax.median)}{tempUnit}</span>
        <span className="tip__range">{fmt(day.tMax.p10)}…{fmt(day.tMax.p90)}</span>
      </div>
      <div className="tip__row">
        <span className="tip__dot tip__dot--min" />
        <span className="tip__k">{t.tipLow}</span>
        <span className="tip__v">{fmt(day.tMin.median)}{tempUnit}</span>
        <span className="tip__range">{fmt(day.tMin.p10)}…{fmt(day.tMin.p90)}</span>
      </div>
      <div className="tip__row">
        <span className="tip__dot tip__dot--precip" />
        <span className="tip__k">{t.tipPrecip}</span>
        <span className="tip__v">{fmt(day.precip.median, 1)}{precipUnit}</span>
        <span className="tip__range">↑{fmt(day.precip.p90, 1)}</span>
      </div>
      <div className="tip__sources">{t.sourcesAgree(day.sourceCount)}</div>
    </div>
  )
}
