// src/components/admin/ActivityFeed.tsx
'use client'

import Link from 'next/link'
import * as React from 'react'

import { cn } from '@/lib/utils'

import { AdmIcon, type AdmIconName } from './admin-icons'
import { EVENT_TYPE_LABEL, eventHref, eventKind, formatEventDate, type MemberEventRow } from './member-events'

/**
 * Members' actions as the design's activity feed (activity.html): a sticky
 * day heading with its count, then a card of rows joined by a thin timeline —
 * an icon chip coloured by kind, what happened, then who, where (Website /
 * App) and when, with Open on the right.
 *
 * As in the design, the same person signing in again and again on one day is
 * folded under the first sign-in, behind a "×N" button that opens the rest.
 *
 * Same rows and links as member-events' MemberEventFeed (which the member
 * page still uses); this is the Activity and Mobile app pages' view of them.
 */

const KARACHI_DAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit' })
const KARACHI_TIME = new Intl.DateTimeFormat('en-PK', { timeZone: 'Asia/Karachi', hour: 'numeric', minute: '2-digit' })
const dayKey = (iso: string) => KARACHI_DAY.format(new Date(iso))

function dayHeading(key: string): string {
  if (key === dayKey(new Date().toISOString())) return 'Today'
  if (key === dayKey(new Date(Date.now() - 86_400_000).toISOString())) return 'Yesterday'
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(`${key}T00:00:00Z`),
  )
}

/** The design's row look and icon for a kind of action. */
function look(type: string): { cls: string; icon: AdmIconName; plain: boolean } {
  if (type === 'account.signin') return { cls: 'ev--signin', icon: 'user', plain: true }
  if (type === 'account.signout') return { cls: 'ev--signout', icon: 'out', plain: true }
  if (type.startsWith('business.charger')) return { cls: 'ev--charger', icon: 'pulse', plain: false }
  switch (eventKind(type)) {
    case 'partners':
      return { cls: 'ev--listing', icon: 'building', plain: false }
    case 'saved':
      return { cls: 'ev--garage', icon: 'bookmark', plain: false }
    case 'community':
      return { cls: 'ev--community', icon: 'chat', plain: false }
    case 'reviews':
      return { cls: 'ev--review', icon: 'star', plain: false }
    case 'accounts':
      return { cls: 'ev--account', icon: 'user', plain: true }
    default:
      return { cls: '', icon: 'pulse', plain: false }
  }
}

interface Item {
  row: MemberEventRow
  /** A sign-in folded under the one above it. */
  child?: number
  /** The first of a fold, with how many it holds. */
  fold?: { id: number; size: number }
}

function group(rows: MemberEventRow[]) {
  const days: { key: string; items: Item[] }[] = []
  let foldId = 0
  for (let k = 0; k < rows.length; k++) {
    const row = rows[k]!
    const key = dayKey(row.createdAt)
    let day = days[days.length - 1]
    if (!day || day.key !== key) {
      day = { key, items: [] }
      days.push(day)
    }
    let run = 1
    const same = (next: MemberEventRow | undefined) =>
      next &&
      row.type === 'account.signin' &&
      next.type === 'account.signin' &&
      dayKey(next.createdAt) === key &&
      (next.userId ?? next.userEmail) === (row.userId ?? row.userEmail)
    while (same(rows[k + run])) run++
    if (run > 1) {
      foldId++
      day.items.push({ row, fold: { id: foldId, size: run } })
      for (let r = 1; r < run; r++) day.items.push({ row: rows[k + r]!, child: foldId })
      k += run - 1
    } else day.items.push({ row })
  }
  return days
}

export function ActivityFeed({ rows, showPerson = true }: { rows: MemberEventRow[]; showPerson?: boolean }) {
  const days = React.useMemo(() => group(rows), [rows])
  const [open, setOpen] = React.useState<Set<number>>(() => new Set())

  const toggle = (id: number) =>
    setOpen((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className="actfeed">
      {days.map((day) => (
        <section key={day.key} aria-label={dayHeading(day.key)}>
          <p className="day">
            {dayHeading(day.key)}{' '}
            <span>
              {day.items.length} action{day.items.length === 1 ? '' : 's'}
            </span>
          </p>
          <div className="card">
            <ul className="feed">
              {day.items.map(({ row, child, fold }) => {
                const href = eventHref(row)
                const { cls, icon, plain } = look(row.type)
                const label = EVENT_TYPE_LABEL[row.type] ?? row.type
                const hidden = child !== undefined && !open.has(child)
                return (
                  <li
                    key={row.id}
                    className={cn('ev', cls, child !== undefined && 'is-folded-child', child !== undefined && !hidden && 'show')}
                  >
                    <span className="ev__ico">
                      <AdmIcon name={icon} />
                    </span>
                    <div className="min-w-0">
                      <div className="ev__t">
                        {row.summary ?? label}
                        {fold ? (
                          <button
                            className="ev__x"
                            type="button"
                            aria-expanded={open.has(fold.id)}
                            aria-label={`${fold.size} sign-ins, ${open.has(fold.id) ? 'hide' : 'show'} the rest`}
                            onClick={() => toggle(fold.id)}
                          >
                            ×{fold.size}
                          </button>
                        ) : null}
                      </div>
                      <div className="ev__m">
                        <span className={plain ? undefined : 'ktag'}>{label}</span>
                        <span className="src">
                          <AdmIcon name={row.source === 'web' ? 'globe' : 'phone'} />
                          {row.source === 'web' ? 'Website' : 'App'}
                        </span>
                        {showPerson ? (
                          <>
                            <span className="sep">·</span>
                            {row.userId ? (
                              <Link className="ev__who" href={`/admin/members/${row.userId}`}>
                                {row.userName ?? row.userEmail ?? 'Member'}
                              </Link>
                            ) : (
                              <span>{row.userEmail ?? 'Not signed in'}</span>
                            )}
                            {row.userId && row.userName && row.userEmail ? <span className="em">{row.userEmail}</span> : null}
                          </>
                        ) : null}
                        <span className="sep">·</span>
                        <time className="mono" dateTime={row.createdAt} title={formatEventDate(row.createdAt)}>
                          {KARACHI_TIME.format(new Date(row.createdAt))}
                        </time>
                      </div>
                    </div>
                    {href ? (
                      <Link className="btn btn--line btn--sm" href={href}>
                        Open
                        <AdmIcon name="ext" />
                      </Link>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      ))}
    </div>
  )
}
