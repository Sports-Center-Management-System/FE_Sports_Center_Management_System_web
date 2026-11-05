import { useEffect, useRef, useState } from 'react'
import { money } from '@/lib/api'
import { formatDay } from '../lib/format'

export interface DayRevenue {
  /** YYYY-MM-DD in Vietnam time. */
  day: string
  base: number
  pt: number
  invoices: number
  /** False for days older than the oldest invoice the API returned. */
  complete: boolean
}

// Validated pair (dataviz validator, light surface): brand teal + orange, CVD ΔE 8.1.
const SERIES = [
  { key: 'base', label: 'Gói cơ bản', color: '#008b74' },
  { key: 'pt', label: 'PT', color: '#eb6834' },
] as const

const HEIGHT = 240
const MARGIN = { top: 12, right: 8, bottom: 26, left: 52 }
const GAP = 2
const RADIUS = 4
const MAX_BAR = 24

/** Compact Vietnamese money ticks: 500k, 1,5 tr, 12 tr. */
function compact(value: number) {
  if (value >= 1e6) return `${Number((value / 1e6).toFixed(1)).toLocaleString('vi-VN')} tr`
  if (value >= 1e3) return `${Math.round(value / 1e3)}k`
  return String(value)
}

/** Clean tick step (1, 2, 2.5 or 5 × 10ⁿ) giving about four intervals up to `max`. */
function niceTicks(max: number) {
  if (max <= 0) return [0, 250_000, 500_000, 750_000, 1_000_000]
  const raw = max / 4
  const power = 10 ** Math.floor(Math.log10(raw))
  const step = ([1, 2, 2.5, 5, 10].find((m) => m * power >= raw) ?? 10) * power
  const count = Math.max(1, Math.ceil(max / step))
  return Array.from({ length: count + 1 }, (_, k) => k * step)
}

/** Column whose top corners are rounded and bottom is square. */
function topRounded(x: number, y: number, w: number, h: number) {
  const r = Math.min(RADIUS, h, w / 2)
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`
}

export function RevenueChart({ data }: { data: DayRevenue[] }) {
  const box = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(640)
  const [active, setActive] = useState<number | null>(null)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(280, entry.contentRect.width)),
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const innerW = width - MARGIN.left - MARGIN.right
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom
  const ticks = niceTicks(Math.max(...data.map((d) => d.base + d.pt), 0))
  const top = ticks[ticks.length - 1]
  const y = (value: number) => MARGIN.top + innerH - (value / top) * innerH
  const band = innerW / Math.max(data.length, 1)
  const barW = Math.min(MAX_BAR, band * 0.6)
  // Show at most ~8 date labels so they never collide.
  const labelEvery = Math.max(1, Math.ceil(data.length / 8))
  const hovered = active !== null ? data[active] : null

  return (
    <div ref={box} className="relative">
      <div className="mb-2 flex gap-4 text-xs text-slate-600" aria-hidden="true">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={`Biểu đồ cột doanh thu ${data.length} ngày, chia gói cơ bản và PT`}
        onMouseLeave={() => setActive(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={MARGIN.left}
              x2={width - MARGIN.right}
              y1={y(t)}
              y2={y(t)}
              stroke={t === 0 ? '#cbd5e1' : '#eef2f6'}
            />
            <text
              x={MARGIN.left - 8}
              y={y(t)}
              dy="0.32em"
              textAnchor="end"
              className="fill-slate-400 text-[11px]"
            >
              {compact(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = MARGIN.left + band * i + band / 2
          const x = cx - barW / 2
          const baseH = (d.base / top) * innerH
          const ptH = (d.pt / top) * innerH
          const dim = active !== null && active !== i
          const ptGap = d.base > 0 && d.pt > 0 ? GAP : 0
          return (
            <g key={d.day} opacity={dim ? 0.45 : 1}>
              {d.base > 0 ? (
                d.pt > 0 ? (
                  <rect
                    x={x}
                    y={y(d.base)}
                    width={barW}
                    height={Math.max(baseH, 1)}
                    fill={SERIES[0].color}
                  />
                ) : (
                  <path
                    d={topRounded(x, y(d.base), barW, Math.max(baseH, 1))}
                    fill={SERIES[0].color}
                  />
                )
              ) : null}
              {d.pt > 0 ? (
                <path
                  d={topRounded(x, y(d.base) - ptH, barW, Math.max(ptH - ptGap, 1))}
                  fill={SERIES[1].color}
                />
              ) : null}
              {i % labelEvery === 0 || i === data.length - 1 ? (
                <text
                  x={cx}
                  y={HEIGHT - 8}
                  textAnchor="middle"
                  className="fill-slate-400 text-[11px]"
                >
                  {formatDay(d.day).slice(0, 5)}
                </text>
              ) : null}
              {/* Hit target: the whole day band, wider and taller than the mark. */}
              <rect
                x={MARGIN.left + band * i}
                y={MARGIN.top}
                width={band}
                height={innerH}
                fill="transparent"
                tabIndex={0}
                aria-label={`${formatDay(d.day)}: ${money(d.base + d.pt)}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="outline-none focus-visible:fill-slate-900/5"
              />
            </g>
          )
        })}
      </svg>
      {hovered && active !== null ? (
        <div
          role="status"
          className="pointer-events-none absolute top-2 z-10 w-52 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg"
          style={{
            left: Math.min(Math.max(MARGIN.left + band * active + band / 2 - 104, 0), width - 208),
          }}
        >
          <p className="mb-1 font-medium text-slate-900">{formatDay(hovered.day)}</p>
          {SERIES.map((s) => (
            <p key={s.key} className="flex items-center justify-between gap-3 text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />
                {s.label}
              </span>
              <span className="tabular-nums">{money(hovered[s.key])}</span>
            </p>
          ))}
          <p className="mt-1 flex justify-between border-t border-slate-100 pt-1 font-medium text-slate-900">
            <span>Tổng, {hovered.invoices} hóa đơn</span>
            <span className="tabular-nums">{money(hovered.base + hovered.pt)}</span>
          </p>
          {!hovered.complete ? (
            <p className="mt-1 text-amber-700">Ngày này có thể thiếu hóa đơn cũ.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
