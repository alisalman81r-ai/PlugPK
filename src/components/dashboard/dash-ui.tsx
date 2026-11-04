// src/components/dashboard/dash-ui.tsx
//
// The account pages' surfaces (plugpk-account-pages/css/page-account.css),
// shared by every dashboard page. No 'use client': server pages use these too.
//
//   PANEL / PANEL_H2 / PANEL_SUB   .apanel, .apanel h2, .apanel__sub
//   abtn(kind, size)               .btn + --ink | --line | --plain | --danger, sm
//   AIN / ALABEL / ALINK           .ain, .afld > label, .alink
//   SecHead                        .asec > header
//   EmptyPanel                     .aempty — a page with nothing on it yet
//   DashEmpty                      .adash  — a section with nothing in it yet
//   ROW / ROW_LINK                 a paper row inside a panel (.aclubs li)

import Link from 'next/link'
import * as React from 'react'

import { cn } from '@/lib/utils'

import motion from './acct-motion.module.css'

/**
 * .apanel — a white card, 24px corners, a soft drop. It rises in with the
 * page (16px over 0.8s; the first section of its kind waits .1s).
 */
export const PANEL = `rounded-3xl border border-ink/10 bg-white p-[clamp(20px,3vw,32px)] shadow-[0_1px_2px_rgba(11,12,14,.04),0_18px_40px_-30px_rgba(11,12,14,.3)] ${motion.panel}`

/** The rest of the account entrance: the side panel, the header (.05s), and the settings page's later panels. */
export const ACCT_RISE = motion.rise
export const ACCT_DELAY = { head: motion.d05, password: motion.d16, devices: motion.d22 }

/** .apanel h2 — Power Grotesk Regular, 26px. */
export const PANEL_H2 = 'm-0 font-display text-[26px] leading-[1.1] tracking-[-0.008em] text-ink'

/** .apanel__sub */
export const PANEL_SUB = 'mt-2 max-w-[720px] text-[15px] leading-[1.55] text-muted'

/* ── Buttons (.btn of the account pages) ───────────────────────────── */

export type ABtnKind = 'ink' | 'line' | 'plain' | 'danger' | 'volt' | 'lineDark' | 'plainDark'

const ABTN_BASE =
  'relative inline-flex shrink-0 items-center justify-center gap-2.5 whitespace-nowrap rounded-full font-semibold leading-none tracking-[-0.005em] no-underline transition-[background-color,color,box-shadow,border-color] duration-300 focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-default disabled:opacity-45 aria-disabled:cursor-default aria-disabled:opacity-45'

const ABTN_KIND: Record<ABtnKind, string> = {
  ink: 'bg-ink text-white hover:bg-volt hover:text-ink',
  line: 'border border-ink/10 bg-white text-ink hover:border-ink',
  plain: 'bg-transparent text-ink enabled:hover:bg-ember/[0.08] enabled:hover:text-[#b23b0d]',
  danger: 'bg-[#c2410c] text-white hover:bg-ember',
  /* Inside the ink car card (.acar .btn--ink / --line / --plain). */
  volt: 'bg-volt text-ink',
  lineDark: 'border border-white/25 bg-transparent text-white hover:border-volt hover:text-volt',
  plainDark: 'bg-transparent text-fog enabled:hover:bg-ember/[0.08] enabled:hover:text-[#b23b0d]',
}

const ABTN_SIZE = {
  md: 'h-12 px-[22px] text-[15px] [&_svg]:h-[18px] [&_svg]:w-[18px]',
  sm: 'h-[42px] px-[18px] text-sm [&_svg]:h-4 [&_svg]:w-4',
}

export function abtn(kind: ABtnKind = 'ink', size: 'md' | 'sm' = 'md', className?: string) {
  return cn(ABTN_BASE, ABTN_KIND[kind], ABTN_SIZE[size], className)
}

/* ── Fields ────────────────────────────────────────────────────────── */

/** .ain — the 54px account field. */
export const AIN =
  'h-[54px] w-full appearance-none rounded-[14px] border-[1.5px] border-ink/10 bg-white px-4 text-base text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-fog focus:border-ink focus:shadow-[0_0_0_4px_rgba(212,255,58,.45)]'

/** .asel::after — the chevron drawn over a select. */
export function SelChevron() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute right-[18px] top-[22px] h-2 w-2 rotate-45 border-b-2 border-r-2 border-fog"
    />
  )
}

/** .afld > label, .flab */
export const ALABEL = 'block text-sm font-medium text-ink'

/** .alink — a volt underline that draws in on hover. */
export const ALINK =
  'py-1.5 font-semibold text-ink no-underline bg-[linear-gradient(#D4FF3A,#D4FF3A)] bg-[length:0_2px] bg-[position:0_100%] bg-no-repeat transition-[background-size] duration-300 ease-out hover:bg-[length:100%_2px] focus-visible:bg-[length:100%_2px] focus-visible:outline-none'

/** .fhint / .ferr */
export const FHINT = 'm-0 text-[13px] text-muted'
export const FERR = 'm-0 text-[13px] text-[#c2410c]'

/** A server's refusal, said in the panel it belongs to. */
export function ErrorNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p role="alert" className={cn('rounded-[14px] border border-[#FFCDBC] bg-[#FFECE6] px-4 py-3 text-sm text-[#B42E05]', className)}>
      {children}
    </p>
  )
}

/** .asaved — a green dot and a line, after a save. */
export function SavedNote({ children, note = false }: { children?: React.ReactNode; note?: boolean }) {
  return (
    <span role="status" aria-live="polite" className={cn('inline-flex items-center gap-2 text-sm empty:hidden', note ? 'text-muted' : 'text-[#12804a]')}>
      {children ? <span aria-hidden="true" className={cn('h-2 w-2 shrink-0 rounded-full', note ? 'bg-fog' : 'bg-[#35D07F]')} /> : null}
      {children}
    </span>
  )
}

/* ── Sections ──────────────────────────────────────────────────────── */

/** .asec > header — the section title with a link on the right. */
export function SecHead({ title, aside, id }: { title: React.ReactNode; aside?: React.ReactNode; id?: string }) {
  return (
    <header className="mb-4 flex items-center justify-between gap-3">
      <h2 id={id} className={PANEL_H2}>
        {title}
      </h2>
      {aside}
    </header>
  )
}

/** A panel heading with an optional sub line and a control on the right. */
export function PanelHead({ title, sub, aside, className }: { title: React.ReactNode; sub?: React.ReactNode; aside?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-x-4 gap-y-2', className)}>
      <div className="min-w-0">
        <h2 className={PANEL_H2}>{title}</h2>
        {sub ? <p className={PANEL_SUB}>{sub}</p> : null}
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </div>
  )
}

/**
 * .aempty — the page-sized empty state: an icon on a chalk disc inside a
 * dashed ring, a display line, a sentence and one way forward.
 */
export function EmptyPanel({
  icon,
  title,
  body,
  href,
  cta,
}: {
  icon?: React.ReactNode
  title?: React.ReactNode
  body: React.ReactNode
  href: string
  cta: string
}) {
  return (
    <section className="grid justify-items-center gap-2.5 rounded-3xl border-[1.5px] border-dashed border-ink/[0.16] bg-white px-6 py-[clamp(40px,6vw,72px)] text-center">
      {icon ? (
        <span className="relative mb-2 grid h-[72px] w-[72px] place-items-center rounded-full bg-chalk text-ink after:absolute after:-inset-[9px] after:rounded-full after:border after:border-dashed after:border-ink/15 after:content-[''] [&_svg]:h-[30px] [&_svg]:w-[30px]">
          {icon}
        </span>
      ) : null}
      {title ? <b className="font-display text-[26px] font-normal leading-[1.15] text-ink">{title}</b> : null}
      <p className="mb-3 max-w-[460px] text-[15px] leading-[1.55] text-muted">{body}</p>
      <Link href={href} className={abtn('ink')}>
        <span>{cta}</span>
      </Link>
    </section>
  )
}

/** .adash — a section's empty state: dashed paper, a sentence, a line button. */
export function DashEmpty({ children, href, cta }: { children: React.ReactNode; href: string; cta: string }) {
  return (
    <div className="grid justify-items-center gap-3.5 rounded-[18px] border-[1.5px] border-dashed border-ink/[0.14] bg-paper px-5 py-[30px] text-center">
      <p className="m-0 max-w-[520px] text-[15px] text-muted">{children}</p>
      <Link href={href} className={abtn('line', 'sm')}>
        {cta}
      </Link>
    </div>
  )
}

/** A paper row inside a panel (.aclubs li), and the same as a link that lifts on hover. */
export const ROW = 'rounded-[18px] border border-ink/10 bg-paper p-4'
export const ROW_LINK =
  'block rounded-[18px] border border-ink/10 bg-paper p-4 transition-[border-color,box-shadow,translate] duration-[400ms] ease-out hover:[translate:0_-2px] hover:border-ink/20 hover:shadow-[0_24px_40px_-26px_rgba(11,12,14,.35)] focus-visible:outline-none focus-visible:shadow-focus'

/** .adlg — the confirmation dialog: 460px, 28px in, a blurred ink backdrop. */
export const ADLG =
  'm-auto w-[min(460px,calc(100vw-32px))] rounded-3xl border-0 bg-white p-7 text-ink shadow-[0_40px_100px_-30px_rgba(0,0,0,.6)] backdrop:bg-ink/55 backdrop:backdrop-blur-[4px]'
export const ADLG_H2 = 'm-0 font-display text-[26px] font-normal leading-[1.1]'
export const ADLG_P = 'mt-3 leading-[1.55] text-muted'
export const ADLG_BTNS = 'mt-6 flex flex-wrap justify-end gap-2.5'

/** The mono uppercase label over a group (.aside__label). */
export const GROUP_LABEL = 'mx-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted'
