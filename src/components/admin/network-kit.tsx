// src/components/admin/network-kit.tsx
//
// The admin design's (landing-v2/admin/admin.css) building blocks for the
// network and listing screens — stations, connectors, businesses, services —
// as Tailwind. Server-safe: nothing here holds state. The few keyframes
// Tailwind cannot express live in network-kit.css.
//
//   Ico / ConIco      the design's own stroke icons (admin.js P and CON)
//   btnClass          .btn --ink | --line | --danger, sm
//   Card, CARD        .card
//   Strip, StripCell  the KPI strip over the stations and connectors tables
//   SegLinks          .seg   — a segmented filter whose options are links
//   ChipLinks         .chips — a chip filter whose options are links
//   StatusPill, Pill  .pill --ok | --warn | --bad | --unk
//   Empty             .empty with the slowly turning ring
//   T                 table.t classes, with the ≤760px card layout
//   FormCard, Fld, IN, TEXTAREA, Select, FormActions, FormError
//                     .formc, .fld, .in — the design's form language

import Link from 'next/link'
import * as React from 'react'

import { cn } from '@/lib/utils'

import './network-kit.css'

/* ── Icons ───────────────────────────────────────────────────────────── */

const P = {
  bolt: '<path d="M13.2 2.5 5.4 13.1a.6.6 0 0 0 .5 1h5.3l-1 7.1c-.1.6.7.9 1 .4l7.4-10.3a.6.6 0 0 0-.5-1h-5.2l1.3-7.4c.1-.6-.6-.9-1-.4z"/>',
  plug: '<path d="M9 2.5v5M15 2.5v5M6 7.5h12v3.5a6 6 0 0 1-12 0zM12 17v4.5"/>',
  building:
    '<path d="M4.5 20.5V6a1.5 1.5 0 0 1 1.1-1.4l6.4-1.8a1 1 0 0 1 1.3 1v16.7M13.3 9.5l5.1 1.5a1.5 1.5 0 0 1 1.1 1.4v8.1M2.5 20.5h19M8 8.5h1.8M8 12h1.8M8 15.5h1.8M16.2 14.5h.6M16.2 17.5h.6"/>',
  wrench:
    '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  okc: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.2 2.4 2.4 4.6-4.9"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  inbox: '<path d="M3.5 13.5 6 5.5h12l2.5 8v5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5zM3.5 13.5H8l1.5 2.5h5l1.5-2.5h4.5"/>',
  alert: '<path d="M10.3 4.2 2.8 17.5A2 2 0 0 0 4.5 20.5h15a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0zM12 9.5v4M12 17h.01"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  pen: '<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 12a1.5 1.5 0 0 0 1.5 1.4h8a1.5 1.5 0 0 0 1.5-1.4l1-12M9 7V4.5h6V7"/>',
  q: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.6c-.6.3-1 .8-1 1.5v.4M12 17h.01"/>',
  back: '<path d="M19 12H5m6 6-6-6 6-6"/>',
  shield: '<path d="M12 21.2s7.3-3.1 7.3-9.4V5.6L12 2.8 4.7 5.6v6.2c0 6.3 7.3 9.4 7.3 9.4z"/><path d="m8.9 11.9 2.2 2.2 4.1-4.3"/>',
  img: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="m4 18 5-5 4 4 2.5-2.5L20 19"/>',
  undo: '<path d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
  pinl: '<path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  filter: '<path d="M4 5h16l-6 7.5V19l-4 1.5v-8z"/>',
  cash: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v.01M18 14.5v.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/>',
} as const

export type IcoName = keyof typeof P

/** One of the design's icons: 24-unit grid, 1.6 stroke, round caps. */
export function Ico({ name, className, label }: { name: IcoName; className?: string; label?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      dangerouslySetInnerHTML={{ __html: P[name] }}
    />
  )
}

const CON: Record<string, string> = {
  CCS2: '<path d="M8.5 3h7a3 3 0 0 1 2.8 4A8 8 0 1 1 5.7 7 3 3 0 0 1 8.5 3z"/><circle cx="10" cy="8" r="1"/><circle cx="14" cy="8" r="1"/><circle cx="12" cy="11.5" r="1"/><rect x="7" y="17" width="10" height="5" rx="2.5"/>',
  'Type 2':
    '<path d="M6.5 4h11a3 3 0 0 1 2.6 4.4A9 9 0 1 1 3.9 8.4 3 3 0 0 1 6.5 4z"/><circle cx="9.5" cy="8.5" r="1"/><circle cx="14.5" cy="8.5" r="1"/><circle cx="7.5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="16.5" cy="12" r="1"/><circle cx="10" cy="15.5" r="1"/><circle cx="14" cy="15.5" r="1"/>',
  'Type 1': '<circle cx="12" cy="12" r="8.5"/><circle cx="9" cy="10" r="1.4"/><circle cx="15" cy="10" r="1.4"/><circle cx="12" cy="15" r="1.6"/>',
  CHAdeMO: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5.5"/><circle cx="9.5" cy="12" r="1.5"/><circle cx="14.5" cy="12" r="1.5"/>',
}

/** The face of a connector type; anything unknown is drawn as a Type 2. */
export function ConIco({ type, className }: { type: string; className?: string }) {
  const key = Object.keys(CON).find((name) => name.replace(/\s/g, '').toLowerCase() === type.replace(/\s/g, '').toLowerCase())
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn('h-4 w-4 shrink-0', className)}
      dangerouslySetInnerHTML={{ __html: CON[key ?? 'Type 2'] ?? '' }}
    />
  )
}

/* ── Motion ──────────────────────────────────────────────────────────── */

/** [data-in]: rises 16px into place, staggered by --i (see network-kit.css). */
export function rise(i = 0): { 'data-adm-in': ''; style?: React.CSSProperties } {
  return i ? { 'data-adm-in': '', style: { '--i': i } as React.CSSProperties } : { 'data-adm-in': '' }
}

/* ── Buttons ─────────────────────────────────────────────────────────── */

export type BtnTone = 'ink' | 'line' | 'danger'

const BTN =
  'inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-full border border-transparent font-sans font-semibold no-underline transition-[background-color,color,transform,border-color] duration-200 active:scale-[.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:h-[18px] [&_svg]:w-[18px]'

const BTN_TONE: Record<BtnTone, string> = {
  ink: 'bg-ink text-white hover:bg-volt hover:text-ink [&_svg]:text-volt [&_svg]:transition-colors hover:[&_svg]:text-ink',
  line: 'border-ink/[.09] bg-white text-ink hover:border-ink',
  danger: 'bg-[#c2410c] text-white hover:bg-ember',
}

/** .btn: 46px (md) or 36px (sm) pill. */
export function btnClass(tone: BtnTone = 'ink', size: 'md' | 'sm' = 'md', className?: string) {
  return cn(BTN, BTN_TONE[tone], size === 'sm' ? 'h-9 px-3.5 text-[13px]' : 'h-[46px] px-5 text-sm', className)
}

/** The page's primary "Add …" action. */
export function AddLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={btnClass('ink')}>
      <Ico name="plus" />
      {children}
    </Link>
  )
}

/* ── Cards ───────────────────────────────────────────────────────────── */

/** .card: white, hairline, 20px corners, the soft e1 shadow. */
export const CARD =
  'relative rounded-[20px] border border-ink/[.09] bg-white shadow-[0_1px_2px_rgba(11,12,14,.05),0_8px_24px_-14px_rgba(11,12,14,.16)]'

export function Card({
  as: Tag = 'div',
  className,
  i,
  children,
  ...rest
}: { as?: 'div' | 'section' | 'article' | 'li'; className?: string; i?: number; children: React.ReactNode } & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag {...rise(i)} {...rest} className={cn(CARD, className)}>
      {children}
    </Tag>
  )
}

/* ── KPI strip ───────────────────────────────────────────────────────── */

export type Dot = 'ok' | 'blue' | 'bad' | 'warn' | 'none'

const DOT: Record<Dot, string> = {
  ok: 'bg-[#35D07F]',
  blue: 'bg-[#4C8DFF]',
  bad: 'bg-ember',
  warn: 'bg-[#FFB020]',
  none: 'bg-fog',
}

export function StatusDot({ tone }: { tone: Dot }) {
  return <i aria-hidden="true" className={cn('inline-block h-2 w-2 shrink-0 rounded-full', DOT[tone])} />
}

export function Strip({ label, cells, children }: { label: string; cells: number; children: React.ReactNode }) {
  return (
    <section
      {...rise()}
      aria-label={label}
      className={cn(
        CARD,
        'mb-[18px] grid overflow-hidden',
        cells === 5 ? 'grid-cols-5 max-[1360px]:grid-cols-3' : 'grid-cols-6 max-[1360px]:grid-cols-3',
        'max-[640px]:grid-cols-2',
        // the hairlines between cells, at every column count
        '[&>div]:border-ink/[.09] [&>div]:shadow-[inset_1px_0_0_rgba(11,12,14,.09),inset_0_1px_0_rgba(11,12,14,.09)]',
      )}
    >
      {children}
    </section>
  )
}

/** One figure: a label (with a status dot), a big mono number, a note. `lit` is the ink cell. */
export function StripCell({
  label,
  dot,
  value,
  count,
  sub,
  lit,
}: {
  label: string
  dot?: Dot
  value: React.ReactNode
  /** An integer to count up from 0 as it scrolls in. */
  count?: number
  sub?: React.ReactNode
  lit?: boolean
}) {
  return (
    <div className={cn('-ml-px -mt-px px-[22px] py-[18px]', lit && 'bg-ink text-white')}>
      <span className={cn('flex items-center gap-2 text-[13px]', lit ? 'text-fog' : 'text-muted')}>
        {dot ? <StatusDot tone={dot} /> : null}
        {label}
      </span>
      <b
        className={cn(
          'mt-2 block font-mono text-[30px] font-semibold leading-none tracking-[-0.02em] tabular-nums',
          lit ? 'text-volt' : 'text-ink',
        )}
        {...(count !== undefined ? { 'data-count': String(count) } : {})}
      >
        {value}
      </b>
      {sub ? <small className={cn('mt-2 block text-xs', lit ? 'text-fog' : 'text-fog')}>{sub}</small> : null}
    </div>
  )
}

/* ── Filters ─────────────────────────────────────────────────────────── */

/** .tools: the card the search and filters sit in. */
export const TOOLS = cn(CARD, 'mb-[18px] grid gap-3.5 p-4')
export const TOOLS_ROW = 'flex flex-wrap items-center gap-3 max-[640px]:[&>*]:max-w-full'

/** The tally inside a seg button or chip (.c). */
function Tally({ n, on }: { n: number; on: boolean }) {
  return (
    <span
      className={cn(
        'min-w-[22px] rounded-md px-1.5 py-0.5 text-center font-mono text-[11px] font-semibold leading-[1.3] tabular-nums',
        on ? 'bg-volt text-ink' : 'bg-ink/[.07]',
      )}
    >
      {n}
    </span>
  )
}

export interface FilterOption {
  value: string
  label: string
  count?: number
  href: string
}

/** .seg: a segmented control. The pressed option is ink with a volt tally. */
export function SegLinks({ label, current, options }: { label: string; current: string; options: FilterOption[] }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex gap-0.5 rounded-[14px] border border-ink/[.09] bg-chalk p-1 max-[640px]:max-w-full max-[640px]:flex-wrap"
    >
      {options.map((option) => {
        const on = option.value === current
        return (
          <Link
            key={option.value}
            href={option.href}
            scroll={false}
            aria-current={on ? 'true' : undefined}
            className={cn(
              'inline-flex h-[38px] items-center gap-2 whitespace-nowrap rounded-[10px] px-3.5 text-sm font-medium no-underline transition-[background-color,color] duration-200',
              on ? 'bg-ink text-white shadow-[0_6px_16px_-8px_rgba(11,12,14,.5)]' : 'text-muted hover:text-ink',
            )}
          >
            {option.label}
            {option.count !== undefined ? <Tally n={option.count} on={on} /> : null}
          </Link>
        )
      })}
    </div>
  )
}

/** .chips: rounded chips under a mono label; an empty option is disabled. */
export function ChipLinks({
  label,
  lab,
  current,
  options,
  children,
}: {
  label: string
  /** The small mono heading before the chips (.chips__lab). */
  lab?: string
  current: string
  options: FilterOption[]
  children?: React.ReactNode
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
      {lab ? (
        <span className="mr-1 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{lab}</span>
      ) : null}
      {options.map((option) => {
        const on = option.value === current
        const cls = cn(
          'inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full border px-3 text-[13px] font-medium no-underline transition-[border-color,background-color] duration-200',
          on ? 'border-ink bg-ink text-white' : 'border-ink/[.09] bg-white text-ink hover:border-ink/30',
        )
        if (!on && option.count === 0) {
          return (
            <span key={option.value} aria-disabled="true" className={cn(cls, 'cursor-default opacity-[.42] hover:border-ink/[.09]')}>
              {option.label}
              <Tally n={0} on={false} />
            </span>
          )
        }
        return (
          <Link key={option.value} href={option.href} scroll={false} aria-current={on ? 'true' : undefined} className={cls}>
            {option.label}
            {option.count !== undefined ? <Tally n={option.count} on={on} /> : null}
          </Link>
        )
      })}
      {children}
    </div>
  )
}

/** .selw: the filter-bar select, drawn in the site's colours (select-kit). */
export { Select } from './select-kit'

/* ── Pills ───────────────────────────────────────────────────────────── */

export type PillTone = 'ok' | 'warn' | 'bad' | 'unk'

const PILL: Record<PillTone, string> = {
  ok: 'bg-[rgba(53,208,127,.12)] text-[#12804a]',
  warn: 'bg-[rgba(255,176,32,.16)] text-[#8a5a00]',
  bad: 'bg-[rgba(255,90,31,.12)] text-[#b23b0d]',
  unk: 'bg-chalk text-muted',
}

export function Pill({ tone, icon, className, children }: { tone: PillTone; icon?: IcoName; className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex h-[30px] items-center gap-[7px] whitespace-nowrap rounded-full px-3 font-sans text-[13px] font-medium leading-none tracking-normal',
        PILL[tone],
        className,
      )}
    >
      {icon ? <Ico name={icon} className="h-3.5 w-3.5" /> : null}
      {children}
    </span>
  )
}

/** A station or connector status, word and shape as well as colour. */
export function StatusPill({ status }: { status: string }) {
  switch (status) {
    case 'available':
      return <Pill tone="ok" icon="bolt">Available</Pill>
    case 'limited':
      return <Pill tone="warn" icon="alert">Limited</Pill>
    case 'in-use':
      return <Pill tone="warn" icon="plug">In use</Pill>
    case 'offline':
      return <Pill tone="bad" icon="x">Offline</Pill>
    default:
      return <Pill tone="unk" icon="q">Unknown</Pill>
  }
}

/** A review state: pending, approved or rejected. */
export function ReviewPill({ status }: { status: string }) {
  if (status === 'approved') return <Pill tone="ok" icon="okc">Approved</Pill>
  if (status === 'rejected') return <Pill tone="bad" icon="x">Rejected</Pill>
  if (status === 'pending') return <Pill tone="warn" icon="clock">Pending</Pill>
  return <Pill tone="unk">{status}</Pill>
}

/* ── Empty ───────────────────────────────────────────────────────────── */

export function Empty({
  icon = 'search',
  title,
  text,
  children,
  className,
}: {
  icon?: IcoName
  title: string
  text?: React.ReactNode
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('grid place-items-center px-6 pb-[34px] pt-[30px] text-center', className)}>
      <span className="adm-empty-ico relative mb-3.5 grid h-16 w-16 place-items-center rounded-full bg-[rgba(53,208,127,.1)] text-[#12804a]">
        <Ico name={icon} className="h-[30px] w-[30px]" />
      </span>
      <b className="font-display text-xl font-normal leading-[1.2] text-ink">{title}</b>
      {text ? <p className="mb-0 mt-1.5 max-w-[320px] text-sm text-muted">{text}</p> : null}
      {children}
    </div>
  )
}

/** An empty state in its own dashed card (.card.dash). */
export function EmptyCard(props: React.ComponentProps<typeof Empty>) {
  return (
    <div {...rise()} className="relative rounded-[20px] border border-dashed border-ink/[.09] bg-white/70">
      <Empty {...props} className={cn('py-14', props.className)} />
    </div>
  )
}

/* ── Tables ──────────────────────────────────────────────────────────── */

/**
 * table.t. Below 760px each row becomes a two-column card: the head row hides,
 * every cell is labelled from its data-label, the first (Station) cell spans
 * the card and the actions sit in its top-right corner.
 */
export const T = {
  wrap: cn(CARD, 'overflow-x-auto max-[760px]:overflow-visible'),
  table: 'w-full border-collapse max-[760px]:block',
  thead: 'max-[760px]:hidden',
  th: 'whitespace-nowrap border-b border-ink/[.09] bg-paper px-[11px] py-3.5 text-left font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted first:rounded-tl-[20px] first:pl-6 last:rounded-tr-[20px]',
  tbody: 'max-[760px]:block',
  tr: 'transition-colors duration-200 hover:bg-paper max-[760px]:relative max-[760px]:grid max-[760px]:grid-cols-2 max-[760px]:gap-x-4 max-[760px]:gap-y-3.5 max-[760px]:border-b max-[760px]:border-ink/[.09] max-[760px]:px-4 max-[760px]:py-[18px] max-[760px]:last:border-b-0 [&:last-child>td]:border-b-0',
  td: 'border-b border-ink/[.09] px-[11px] py-4 align-middle first:pl-6 max-[760px]:min-w-0 max-[760px]:border-0 max-[760px]:p-0 max-[760px]:first:pl-0 max-[760px]:before:mb-1.5 max-[760px]:before:block max-[760px]:before:font-mono max-[760px]:before:text-[10px] max-[760px]:before:font-semibold max-[760px]:before:uppercase max-[760px]:before:tracking-[0.14em] max-[760px]:before:text-fog max-[760px]:before:content-[attr(data-label)]',
  /** The lead cell: spans the card on mobile, leaves room for the actions. */
  lead: 'max-[760px]:col-span-2 max-[760px]:pr-[84px] max-[760px]:before:hidden',
  full: 'max-[760px]:col-span-2',
  acts: 'max-[760px]:absolute max-[760px]:right-2 max-[760px]:top-3 max-[760px]:before:hidden',
}

/** .sname: a row's name in display type. */
export const SNAME =
  'inline-flex items-center gap-2 whitespace-nowrap font-display text-lg font-normal leading-[1.2] tracking-[-0.005em] text-ink no-underline max-[760px]:whitespace-normal'
/** .ssub: the mono line under it. */
export const SSUB = 'mt-[3px] whitespace-nowrap font-mono text-xs font-medium text-fog max-[760px]:whitespace-normal'

/** .acts: the icon buttons at the end of a row. */
export const ACT =
  'grid h-9 w-9 place-items-center rounded-[10px] border-0 bg-transparent text-muted transition-colors duration-200 hover:bg-chalk hover:text-ink [&_svg]:h-[18px] [&_svg]:w-[18px]'

/** .vtag / .con: the small labels in a row. */
export const VTAG = 'inline-block whitespace-nowrap rounded-lg bg-chalk px-2.5 py-[5px] text-[13px] text-ink'
export const CON_TAG =
  'inline-flex h-[30px] items-center gap-1.5 whitespace-nowrap rounded-lg border border-ink/[.09] px-[7px] font-mono text-xs font-semibold text-ink'

/** .kw + .kwbar: a power figure with its bar, scaled to 150 kW. */
export function Kw({ kw }: { kw: number }) {
  if (!(kw > 0)) return <span className="font-mono text-[15px] text-fog">—</span>
  return (
    <>
      <div className="whitespace-nowrap font-mono text-[15px] font-semibold tabular-nums">
        {kw} <small className="text-xs font-medium text-muted">kW</small>
      </div>
      <div className="mt-1.5 h-1 w-[70px] overflow-hidden rounded-sm bg-chalk">
        <i className="block h-full rounded-sm bg-[linear-gradient(90deg,#0B0C0E,#3a3d43)]" style={{ width: `${Math.min(100, (kw / 150) * 100)}%` }} />
      </div>
    </>
  )
}

/**
 * .pbar: one segment per port, ink when free. A station with more than twelve
 * ports draws twelve segments in proportion, so a row never grows wider than
 * the column; the figure beside it is exact.
 */
export function PortBar({ free, total }: { free: number; total: number }) {
  const segs = Math.min(total, 12)
  const on = total > 12 ? Math.round((free / total) * segs) : free
  return (
    <div className="flex items-center gap-2.5">
      {segs > 0 ? (
        <span aria-hidden="true" className="flex gap-[3px]">
          {Array.from({ length: segs }, (_, i) => (
            <i key={i} className={cn('h-[18px] w-[9px] rounded-[3px]', i < on ? 'bg-ink' : 'bg-stone')} />
          ))}
        </span>
      ) : null}
      <b className="font-mono text-sm font-semibold tabular-nums">
        {free}/{total}
      </b>
    </div>
  )
}

/** .tfoot / .count lines. */
export const COUNT = 'mb-3 ml-1 text-sm text-muted'

/* ── Forms ───────────────────────────────────────────────────────────── */

/** .in: 52px, 14px corners, 1.5px hairline, the volt focus ring. */
export const IN =
  'h-[52px] w-full rounded-[14px] border-[1.5px] border-ink/[.09] bg-white px-4 font-sans text-base text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-fog focus:border-ink focus:shadow-focus disabled:cursor-not-allowed disabled:bg-paper aria-[invalid=true]:border-ember'
export const TEXTAREA = cn(IN, 'h-auto min-h-[140px] resize-y py-3.5 leading-[1.6]')
/** A form select in the shape of .in, drawn in the site's colours (select-kit). */
export { FieldSelect } from './select-kit'

/** .fld: label over control, with an optional hint (and an "optional" note). */
export function Fld({
  label,
  htmlFor,
  hint,
  required,
  optional,
  full,
  className,
  children,
}: {
  label: React.ReactNode
  htmlFor?: string
  hint?: React.ReactNode
  required?: boolean
  /** Say so beside the label (.fnote). */
  optional?: boolean
  /** Spans both columns (.fld--full). */
  full?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('grid min-w-0 content-start gap-2', full && 'col-span-full', className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
        {required ? (
          <span className="ml-1 text-[#c2410c]" aria-hidden="true">
            *
          </span>
        ) : optional ? (
          <span className="ml-1.5 font-normal text-muted">(optional)</span>
        ) : null}
      </label>
      {children}
      {hint ? <p className="m-0 text-[13px] leading-snug text-muted">{hint}</p> : null}
    </div>
  )
}

/** .fgrid for these forms: two even columns, one below 760px. */
export const FGRID = 'mt-[22px] grid grid-cols-2 gap-x-5 gap-y-[18px] max-[760px]:grid-cols-1'

/** The column every edit form sits in. */
export const FORM_COL = 'grid max-w-[1040px] gap-3.5'

/** .formc: a form section card with its display heading and sub. */
export function FormCard({
  title,
  sub,
  action,
  i,
  className,
  children,
  ...rest
}: {
  title: React.ReactNode
  sub?: React.ReactNode
  /** Right of the heading (an "Add charger" button). */
  action?: React.ReactNode
  i?: number
  className?: string
  children: React.ReactNode
} & Omit<React.HTMLAttributes<HTMLElement>, 'title'>) {
  return (
    <section {...rise(i)} {...rest} className={cn(CARD, 'p-[clamp(20px,3vw,32px)]', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="m-0 font-display text-[26px] font-normal leading-[1.1] text-ink">{title}</h2>
          {sub ? <p className="mb-0 mt-2 text-[15px] text-muted">{sub}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

/** .ferr, as a block above the form's buttons. */
export function FormError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="m-0 flex items-start gap-2.5 rounded-[14px] border border-[rgba(255,90,31,.25)] bg-[rgba(255,90,31,.06)] px-4 py-3 text-sm text-[#b23b0d]">
      <Ico name="alert" className="mt-px h-[18px] w-[18px]" />
      <span>{children}</span>
    </p>
  )
}

/** The small inline form a refusal opens (a reason to send with it). */
export const NOTE_BOX = 'mt-1 max-w-full rounded-2xl border border-ink/[.09] bg-white p-3.5 text-left shadow-[0_30px_60px_-24px_rgba(11,12,14,.35)]'
export const NOTE_TEXTAREA =
  'mt-2 w-full resize-y rounded-xl border-[1.5px] border-ink/[.09] bg-white px-3 py-2.5 text-sm leading-[1.5] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-fog focus:border-ink focus:shadow-focus'

/** .formc__acts */
export const FORM_ACTS = 'flex flex-wrap gap-2.5'

/** A sub-panel inside a card (.chg): paper, hairline, 18px corners. */
export const PANEL = 'rounded-[18px] border border-ink/[.09] bg-paper p-[18px]'

/** .meta: a row of icon + text facts. */
export const META = 'mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-muted [&_svg]:h-[15px] [&_svg]:w-[15px] [&_svg]:text-fog'

/** .ctag / the inline note-to-self style for review notes. */
export function Note({ tone = 'bad', children }: { tone?: 'bad' | 'warn'; children: React.ReactNode }) {
  return (
    <p
      className={cn(
        'mb-0 mt-3 max-w-[48rem] rounded-xl border px-3.5 py-2.5 text-sm',
        tone === 'bad'
          ? 'border-[rgba(255,90,31,.2)] bg-[rgba(255,90,31,.06)] text-[#8f2f0a]'
          : 'border-[rgba(255,176,32,.3)] bg-[rgba(255,176,32,.1)] text-[#6b4600]',
      )}
    >
      {children}
    </p>
  )
}
