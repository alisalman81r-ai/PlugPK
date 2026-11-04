// src/components/admin/people/kit.tsx
//
// The landing-v2 admin building blocks for Cars, Members, Reviews, Bookings,
// Community and Meetings: the page frame and head, the design's own icon set,
// KPI tiles and empty states. Server-safe; nothing here holds state.

import type * as React from 'react'

import { AdminHeader } from '@/components/admin/AdminHeader'

import s from './people.module.css'

export { s }

/** Class names from the kit's stylesheet, by their design names. Falsy entries are skipped. */
export function k(...names: (string | false | null | undefined)[]): string {
  return names
    .filter((name): name is string => Boolean(name))
    .map((name) => s[name] ?? name)
    .join(' ')
}

/** The entrance (the design's [data-in]): rise and fade, staggered by `i`. */
export function rise(i = 0): { className: string; style: React.CSSProperties } {
  return { className: s.rise ?? '', style: { '--i': i } as React.CSSProperties }
}

/* ── Icons: admin.js's set, 24px grid, 1.6 stroke ──────────────────── */

const P = {
  bolt: '<path d="M13.2 2.5 5.4 13.1a.6.6 0 0 0 .5 1h5.3l-1 7.1c-.1.6.7.9 1 .4l7.4-10.3a.6.6 0 0 0-.5-1h-5.2l1.3-7.4c.1-.6-.6-.9-1-.4z"/>',
  users: '<circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 19.5c.9-3 3.4-4.8 6.5-4.8s5.6 1.8 6.5 4.8M15.5 5.3a3.5 3.5 0 0 1 0 6.4M18 14.9c1.7.7 2.9 2.3 3.5 4.6"/>',
  building: '<path d="M4.5 20.5V6a1.5 1.5 0 0 1 1.1-1.4l6.4-1.8a1 1 0 0 1 1.3 1v16.7M13.3 9.5l5.1 1.5a1.5 1.5 0 0 1 1.1 1.4v8.1M2.5 20.5h19M8 8.5h1.8M8 12h1.8M8 15.5h1.8M16.2 14.5h.6M16.2 17.5h.6"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01"/>',
  calok: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4M9 15l2 2 4-4"/>',
  car: '<path d="M3 16.5V13l2.4-5.2a2 2 0 0 1 1.8-1.2h9.6a2 2 0 0 1 1.8 1.2L21 13v3.5M3 13h18M9 16.5h6"/><circle cx="6.5" cy="16.5" r="2"/><circle cx="17.5" cy="16.5" r="2"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
  chat: '<path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3.5 20.5l1.4-4.8A8.5 8.5 0 1 1 21 11.5z"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/>',
  out: '<path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15M10 16l4-4-4-4M14 12H4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  okc: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.2 2.4 2.4 4.6-4.9"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  back: '<path d="M19 12H5m6 6-6-6 6-6"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  alert: '<path d="M10.3 4.2 2.8 17.5A2 2 0 0 0 4.5 20.5h15a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0zM12 9.5v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8h.01"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  tel: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  pen: '<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 12a1.5 1.5 0 0 0 1.5 1.4h8a1.5 1.5 0 0 0 1.5-1.4l1-12M9 7V4.5h6V7"/>',
  user: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c1-3.6 3.8-5.5 7-5.5s6 1.9 7 5.5"/>',
  bookmark: '<path d="M6.5 3.5h11v17L12 16.5l-5.5 4z"/>',
  shield: '<path d="M12 21.2s7.3-3.1 7.3-9.4V5.6L12 2.8 4.7 5.6v6.2c0 6.3 7.3 9.4 7.3 9.4z"/><path d="m8.9 11.9 2.2 2.2 4.1-4.3"/>',
  shieldOff: '<path d="M12 21.2s7.3-3.1 7.3-9.4V5.6L12 2.8 4.7 5.6v6.2c0 6.3 7.3 9.4 7.3 9.4z"/>',
  img: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="m4 18 5-5 4 4 2.5-2.5L20 19"/>',
  upload: '<path d="M12 15.5V4M7 9l5-5 5 5M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15"/>',
  undo: '<path d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
  pinl: '<path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  pulse: '<path d="M3 12h4l2.5-6 5 12 2.5-6h4"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/>',
  route: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H16a3 3 0 0 0 0-6H8a3 3 0 0 1 0-6h7.5"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  copy: '<rect x="8.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M15.5 8.5V5A1.5 1.5 0 0 0 14 3.5H5A1.5 1.5 0 0 0 3.5 5v9A1.5 1.5 0 0 0 5 15.5h3.5"/>',
  eyeOff: '<path d="M3 3l18 18M10.6 6.1A9.6 9.6 0 0 1 12 6c5.5 0 9 6 9 6a15.6 15.6 0 0 1-2.9 3.5M6.6 6.6A15.4 15.4 0 0 0 3 12s3.5 6 9 6a9 9 0 0 0 4.4-1.1M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  save: '<path d="M5 3.5h11l3.5 3.5v12a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V5A1.5 1.5 0 0 1 5 3.5z"/><path d="M7.5 3.5v5h8v-5M7.5 20.5v-6h9v6"/>',
  loader: '<path d="M12 3a9 9 0 1 0 9 9"/>',
  handshake: '<path d="m11 17 2 2a1.4 1.4 0 0 0 2-2M14 14l2.5 2.5a1.4 1.4 0 0 0 2-2L15 11M2.5 12.5 6 9l3.5 1 2-2h3l5 4.5M2.5 12.5 9 19a1.4 1.4 0 0 0 2-2"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
} as const

export type IcoName = keyof typeof P

export function Ico({ n, className }: { n: IcoName; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: P[n] }}
    />
  )
}

/** The design's spinner: a three-quarter ring that turns. */
export function Spinner() {
  return <Ico n="loader" className={s.spin} />
}

/* ── Page frame ────────────────────────────────────────────────────── */

/**
 * The page's content. The shell's `<main class="page">` already carries the
 * design's padding and measure, so this only sets the kit's tokens.
 */
export function Page({ children }: { children: React.ReactNode }) {
  return <div className={s.v}>{children}</div>
}

/**
 * The page head (.phead), through the shared AdminHeader: Power Grotesk title,
 * the ? that explains the page, the one-line summary, and the page's actions.
 * Detail pages get the design's back button beside the title.
 */
export function PageHead({
  title,
  help,
  description,
  actions,
  backHref,
  badges,
}: {
  title: string
  help?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  backHref?: string
  /** @deprecated kept for call sites; the back button names itself. */
  backLabel?: string
  /** Shown after the title, inside the h1 (role and state badges). */
  badges?: React.ReactNode
}) {
  return (
    <AdminHeader
      title={
        badges ? (
          <>
            {title} <span className={s.hbadges}>{badges}</span>
          </>
        ) : (
          title
        )
      }
      helpLabel={title}
      help={help}
      description={description}
      action={actions}
      backHref={backHref}
    />
  )
}

/* ── Pieces ────────────────────────────────────────────────────────── */

export function Kpi({
  icon,
  label,
  value,
  unit,
  note,
  tone = 'plain',
  i = 0,
}: {
  icon: IcoName
  label: string
  /** A number counts up (MotionProvider's data-count); a string is shown as is. */
  value: number | string
  unit?: string
  note: React.ReactNode
  tone?: 'plain' | 'lit' | 'warn'
  i?: number
}) {
  const r = rise(i)
  return (
    <article className={k('card', 'kpi', tone === 'lit' && 'is-lit', tone === 'warn' && 'kpi--warn', r.className)} style={r.style}>
      <div className={s.kpi__top}>
        <Ico n={icon} className={s.kpi__ico} />
      </div>
      <p className={s.kpi__lab}>{label}</p>
      <p className={s.kpi__val}>
        {typeof value === 'number' ? <span data-count={value}>{value}</span> : value}
        {unit ? <small>{unit}</small> : null}
      </p>
      <p className={s.kpi__note}>{note}</p>
    </article>
  )
}

/** A whole-card empty state (.card.dash > .empty). */
export function EmptyCard({
  icon,
  title,
  text,
  children,
  dashed = true,
}: {
  icon: IcoName
  title: string
  text?: React.ReactNode
  children?: React.ReactNode
  dashed?: boolean
}) {
  const r = rise()
  return (
    <div className={k('card', dashed && 'dash', r.className)} style={r.style}>
      <Empty icon={icon} title={title} text={text} big>
        {children}
      </Empty>
    </div>
  )
}

export function Empty({
  icon,
  title,
  text,
  children,
  big = false,
}: {
  icon: IcoName
  title: string
  text?: React.ReactNode
  children?: React.ReactNode
  big?: boolean
}) {
  return (
    <div className={k('empty', big && 'empty--big')}>
      <span className={s.empty__ico}>
        <Ico n={icon} />
      </span>
      <b>{title}</b>
      {text ? <p>{text}</p> : null}
      {children ? <div className={s.empty__acts}>{children}</div> : null}
    </div>
  )
}

/** A titled card (.card > .chead) with an optional count and link on the right. */
export function Panel({
  icon,
  title,
  count,
  sub,
  aside,
  children,
  id,
  className,
}: {
  icon?: IcoName
  title: React.ReactNode
  count?: number
  sub?: React.ReactNode
  aside?: React.ReactNode
  children: React.ReactNode
  id?: string
  className?: string
}) {
  const r = rise()
  return (
    <section id={id} className={k('card', r.className, className)} style={r.style}>
      <div className={s.chead}>
        <div style={{ minWidth: 0 }}>
          <h2>
            {icon ? <Ico n={icon} /> : null}
            {title}
            {count !== undefined ? <span className={s.cnt}>{count}</span> : null}
          </h2>
          {sub ? <p>{sub}</p> : null}
        </div>
        {aside}
      </div>
      <div className={s.hr} />
      {children}
    </section>
  )
}

export function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  )
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString('en-PK')} ${n === 1 ? one : many}`
