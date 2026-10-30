// src/components/admin/AppActivityChart.tsx
'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Members active in the app per day — one series, one axis.
 *
 * Actions per day are a different measure on a different scale, so they are
 * not drawn as a second series or a second axis: each column's tooltip and the
 * table view carry them instead.
 *
 * Columns are plain elements in the brand class, coloured through the same
 * tokens as the rest of the portal (plug-cyan-600 clears 3:1 against the
 * card). Each column is focusable and shows the
 * same tooltip on focus as on hover.
 */
export interface DayPoint {
  day: string
  users: number
  actions: number
}

const dayLabel = (key: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...opts }).format(new Date(`${key}T00:00:00Z`))

/** A clean top for the axis: 1, 2, 5 × 10^n. */
function niceMax(value: number): number {
  if (value <= 4) return 4
  // Even, so the middle tick is a whole number of members.
  if (value <= 10) return value % 2 === 0 ? value : value + 1
  const power = 10 ** Math.floor(Math.log10(value))
  for (const step of [1, 2, 5, 10]) if (step * power >= value) return step * power
  return 10 * power
}

export function AppActivityChart({ points }: { points: DayPoint[] }) {
  const [active, setActive] = React.useState<number | null>(null)
  const [table, setTable] = React.useState(false)
  const max = niceMax(Math.max(0, ...points.map((p) => p.users)))
  const ticks = [max, max / 2, 0]
  const peak = points.reduce((best, p, i) => (p.users > (points[best]?.users ?? -1) ? i : best), 0)
  const shown = active ?? null
  const labelEvery = points.length > 31 ? 14 : points.length > 7 ? 7 : 1

  if (points.every((p) => p.users === 0)) {
    const actions = points.reduce((sum, p) => sum + p.actions, 0)
    return (
      <p className="px-5 py-12 text-center text-ui-sm text-slate-500">
        No signed-in member did anything in the app in this period.
        {actions > 0 ? ` (${actions} action${actions === 1 ? '' : 's'} came from visitors who were not signed in, or from accounts since deleted — see Activity.)` : ''}
      </p>
    )
  }

  return (
    <div className="px-5 pb-5 pt-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-ui-xs text-slate-500">
          Busiest day:{' '}
          <b className="font-semibold text-slate-900">
            {points[peak]?.users ?? 0} {points[peak]?.users === 1 ? 'member' : 'members'}
          </b>{' '}
          on {points[peak] ? dayLabel(points[peak].day, { day: 'numeric', month: 'short' }) : '—'}
        </p>
        <button
          type="button"
          onClick={() => setTable((t) => !t)}
          className="text-ui-xs font-semibold text-plug-blue-600 hover:underline"
          aria-pressed={table}
        >
          {table ? 'Show as chart' : 'Show as table'}
        </button>
      </div>

      {table ? (
        <div className="max-h-72 overflow-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-ui-sm">
            <thead className="sticky top-0 bg-slate-50 text-ui-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Day</th>
                <th className="px-3 py-2 text-right">Active members</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 tabular-nums">
              {[...points].reverse().map((p) => (
                <tr key={p.day}>
                  <td className="px-3 py-1.5 text-slate-700">{dayLabel(p.day, { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                  <td className="px-3 py-1.5 text-right text-slate-900">{p.users}</td>
                  <td className="px-3 py-1.5 text-right text-slate-600">{p.actions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex gap-2">
          {/* Y axis */}
          <div className="flex h-48 flex-col justify-between pb-0 text-right text-[11px] tabular-nums text-slate-400" aria-hidden="true">
            {ticks.map((t) => (
              <span key={t} className="-translate-y-1/2 leading-none first:translate-y-0 last:translate-y-0">
                {t}
              </span>
            ))}
          </div>

          <div className="relative min-w-0 flex-1">
            {/* Gridlines: hairline, recessive */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-48" aria-hidden="true">
              {ticks.map((t, i) => (
                <div
                  key={t}
                  className="absolute inset-x-0 border-t border-slate-100"
                  style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}
                />
              ))}
            </div>

            <div
              className="relative flex h-48 items-end gap-[2px]"
              role="list"
              aria-label="Members active in the app per day"
              onPointerLeave={() => setActive(null)}
            >
              {points.map((p, i) => (
                <div
                  key={p.day}
                  role="listitem"
                  tabIndex={0}
                  aria-label={`${dayLabel(p.day, { weekday: 'long', day: 'numeric', month: 'long' })}: ${p.users} active members, ${p.actions} actions`}
                  onPointerEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  className="group flex h-full min-w-0 flex-1 cursor-default items-end justify-center outline-none"
                >
                  <div
                    className={cn(
                      'w-full max-w-6 rounded-t bg-plug-cyan-600 transition-opacity',
                      shown !== null && shown !== i ? 'opacity-40' : 'opacity-100',
                      'group-focus-visible:ring-2 group-focus-visible:ring-plug-cyan-400 group-focus-visible:ring-offset-2',
                    )}
                    style={{ height: p.users === 0 ? 0 : `max(2px, ${(p.users / max) * 100}%)` }}
                  />
                </div>
              ))}

              {shown !== null && points[shown] ? (
                <div
                  // Inside the plot, at its top: never over the panel header,
                  // and pinned to the near edge for the first and last days.
                  className={cn(
                    'pointer-events-none absolute top-0 z-10 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-ui-xs shadow-lg',
                    shown / points.length < 0.2 ? 'translate-x-0' : shown / points.length > 0.8 ? '-translate-x-full' : '-translate-x-1/2',
                  )}
                  style={{ left: `${((shown + 0.5) / points.length) * 100}%` }}
                  role="status"
                >
                  <p className="font-semibold text-slate-900">
                    {dayLabel(points[shown].day, { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-slate-600">
                    <span className="h-0.5 w-3 rounded bg-plug-cyan-600" aria-hidden="true" />
                    <b className="tabular-nums text-slate-900">{points[shown].users}</b> active{' '}
                    {points[shown].users === 1 ? 'member' : 'members'}
                  </p>
                  <p className="mt-0.5 pl-5 text-slate-500">
                    <b className="tabular-nums text-slate-700">{points[shown].actions}</b> actions
                  </p>
                </div>
              ) : null}
            </div>

            {/* X axis: a few dates, never every one */}
            <div className="mt-2 flex text-[11px] text-slate-400" aria-hidden="true">
              {points.map((p, i) => (
                <span key={p.day} className={cn('min-w-0 flex-1 whitespace-nowrap', i === points.length - 1 ? 'text-right' : 'text-center')}>
                  {i === points.length - 1 || (points.length - 1 - i) % labelEvery === 0
                    ? i === points.length - 1
                      ? 'Today'
                      : dayLabel(p.day, { day: 'numeric', month: 'short' })
                    : ''}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
