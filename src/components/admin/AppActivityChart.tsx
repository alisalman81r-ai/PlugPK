// src/components/admin/AppActivityChart.tsx
'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

import { InfoHint } from './InfoHint'

/**
 * Members active in the app per day — the design's "Daily active members"
 * card (app-activity.html): a caption naming the busiest day, an SVG column
 * chart on dashed gridlines with mono axis labels, a stone stub for a quiet
 * day, and "Show as table" in the card's header.
 *
 * One series, one axis. Actions per day are a different measure, so they are
 * not a second series: each column's tooltip and the table carry them. Each
 * column is focusable and shows the same tooltip on focus as on hover.
 */
export interface DayPoint {
  day: string
  users: number
  actions: number
}

const dayLabel = (key: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...opts }).format(new Date(`${key}T00:00:00Z`))

/** A clean top for the axis: 1, 2, 5 × 10^n, and never under 4 (as the design). */
function niceMax(value: number): number {
  if (value <= 4) return 4
  if (value <= 10) return value % 2 === 0 ? value : value + 1
  const power = 10 ** Math.floor(Math.log10(value))
  for (const step of [1, 2, 5, 10]) if (step * power >= value) return step * power
  return 10 * power
}

const W = 900
const H = 230

export function AppActivityChart({
  points,
  title = 'Daily active members',
  description,
  help,
  className,
  index = 0,
}: {
  points: DayPoint[]
  title?: string
  description?: React.ReactNode
  help?: React.ReactNode
  className?: string
  index?: number
}) {
  const [active, setActive] = React.useState<number | null>(null)
  const [table, setTable] = React.useState(false)
  const n = points.length
  const max = niceMax(Math.max(0, ...points.map((p) => p.users)))
  const peak = points.reduce((best, p, i) => (p.users > (points[best]?.users ?? -1) ? i : best), 0)
  const empty = points.every((p) => p.users === 0)
  const bw = n > 0 ? W / n : W
  const ticks = n > 0 ? Array.from(new Set([0, Math.round(n / 4), Math.round(n / 2), Math.round((3 * n) / 4), n - 1])) : []
  const y = (v: number) => H - (v / max) * H

  let body: React.ReactNode
  if (empty) {
    const actions = points.reduce((sum, p) => sum + p.actions, 0)
    body = (
      <p className="chart__cap" style={{ padding: '24px 0' }}>
        No signed-in member did anything in the app in this period.
        {actions > 0
          ? ` (${actions} action${actions === 1 ? '' : 's'} came from visitors who were not signed in, or from accounts since deleted — see Activity.)`
          : ''}
      </p>
    )
  } else if (table) {
    body = (
      <div className="tablewrap chart__table" data-lenis-prevent>
        <table className="t t--small">
          <thead>
            <tr>
              <th>Day</th>
              <th>Active members</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...points].reverse().map((p) => (
              <tr key={p.day}>
                <td data-label="Day">{dayLabel(p.day, { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                <td data-label="Active members" className="mono">
                  {p.users}
                </td>
                <td data-label="Actions" className="mono">
                  {p.actions}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  } else {
    const shown = active !== null ? points[active] : null
    body = (
      <>
        <p className="chart__cap">
          Busiest day:{' '}
          <b>
            {points[peak]?.users ?? 0} member{points[peak]?.users === 1 ? '' : 's'}
          </b>{' '}
          on {points[peak] ? dayLabel(points[peak].day, { day: 'numeric', month: 'short' }) : '—'}
        </p>
        <div className="chart__wrap" onPointerLeave={() => setActive(null)}>
          <svg className="chart" viewBox={`0 0 ${W} ${H + 30}`} role="list" aria-label={`Members active in the app each day, last ${n} days`}>
            {[0, max / 2, max].map((g) => (
              <g key={g} aria-hidden="true">
                <line x1="0" x2={W} y1={y(g)} y2={y(g)} className="grid" />
                <text x="0" y={y(g) - 6} className="axis">
                  {g}
                </text>
              </g>
            ))}
            {points.map((p, i) => {
              const label = `${dayLabel(p.day, { weekday: 'long', day: 'numeric', month: 'long' })}: ${p.users} active member${p.users === 1 ? '' : 's'}, ${p.actions} action${p.actions === 1 ? '' : 's'}`
              return (
                <g
                  key={p.day}
                  role="listitem"
                  tabIndex={0}
                  aria-label={label}
                  className={cn('chart__col', active !== null && active !== i && 'is-dim')}
                  onPointerEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                >
                  {/* The whole column is the hover target, not only the bar. */}
                  <rect x={i * bw} y="0" width={bw} height={H} fill="transparent" />
                  {p.users ? (
                    <rect
                      x={i * bw + bw * 0.18}
                      y={y(p.users)}
                      width={bw * 0.64}
                      height={(p.users / max) * H}
                      rx={Math.min(6, bw * 0.2)}
                      className="bar"
                    />
                  ) : (
                    <rect x={i * bw + bw * 0.18} y={H - 3} width={bw * 0.64} height="3" rx="1.5" className="bar0" />
                  )}
                </g>
              )
            })}
            {ticks.map((i) => (
              <text key={i} x={i * bw + bw / 2} y={H + 22} textAnchor="middle" className="axis" aria-hidden="true">
                {i === n - 1 ? 'Today' : dayLabel(points[i]!.day, { day: 'numeric', month: 'short' })}
              </text>
            ))}
          </svg>
          {shown && active !== null ? (
            <div
              className="chart__tip"
              role="status"
              style={{
                left: `${((active + 0.5) / n) * 100}%`,
                translate: active / n < 0.2 ? '0 0' : active / n > 0.8 ? '-100% 0' : '-50% 0',
              }}
            >
              <b>{dayLabel(shown.day, { weekday: 'short', day: 'numeric', month: 'short' })}</b>
              <span>
                <b className="mono">{shown.users}</b> active member{shown.users === 1 ? '' : 's'}
              </span>
              <span>
                <b className="mono">{shown.actions}</b> action{shown.actions === 1 ? '' : 's'}
              </span>
            </div>
          ) : null}
        </div>
      </>
    )
  }

  return (
    <section
      className={cn('card', className)}
      data-in
      style={{ '--i': index } as React.CSSProperties}
      aria-labelledby="chart-h"
    >
      <div className="chead">
        <div>
          <h2 id="chart-h">
            {title}
            {help ? <InfoHint label={title}>{help}</InfoHint> : null}
          </h2>
          {description ? <p>{description}</p> : null}
        </div>
        {empty ? null : (
          <button className="link linkbtn" type="button" aria-pressed={table} onClick={() => setTable((t) => !t)}>
            {table ? 'Show as chart' : 'Show as table'}
          </button>
        )}
      </div>
      <div className="hr" />
      <div className="cbody" style={{ paddingTop: 18 }}>
        {body}
      </div>
    </section>
  )
}
