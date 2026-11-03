// src/components/dashboard/dash-ui.tsx
//
// The account page's surfaces (page-account.css of landing-v2), shared by
// every dashboard page. No 'use client': server pages use these too.

import Link from 'next/link'
import * as React from 'react'

import { btnClass } from '@/components/v2/ui'
import { cn } from '@/lib/utils'

import motion from './acct-motion.module.css'

/**
 * .apanel — a white card, 24px corners, a soft drop. It rises in with the
 * page (page-account.css: 16px over 0.8s, the first of its kind at .1s).
 */
export const PANEL = `rounded-3xl border border-ink/10 bg-white p-[clamp(20px,3vw,32px)] shadow-[0_1px_2px_rgba(11,12,14,.04),0_18px_40px_-30px_rgba(11,12,14,.3)] ${motion.panel}`

/** The rest of the account entrance: the side panel, the header (.05s), and the settings page's later panels. */
export const ACCT_RISE = motion.rise
export const ACCT_DELAY = { head: motion.d05, password: motion.d16, devices: motion.d22 }

/** .apanel h2 — Power Grotesk Regular, 26px. */
export const PANEL_H2 = 'm-0 font-display text-[26px] leading-[1.1] text-ink'

/** .apanel__sub */
export const PANEL_SUB = 'mt-2 max-w-[720px] text-[15px] leading-[1.55] text-muted'

/** A row inside a panel: a list item that lifts a little on hover when it links. */
export const ROW = 'rounded-[18px] border border-ink/10 bg-white p-4'
export const ROW_LINK =
  'block rounded-[18px] border border-ink/10 bg-white p-4 transition-[border-color,box-shadow,translate] duration-300 ease-out hover:[translate:0_-2px] hover:border-ink/20 hover:shadow-e2 focus-visible:outline-none focus-visible:shadow-focus'

/** .ain — the 54px account field. */
export const AIN =
  'h-[54px] w-full appearance-none rounded-[14px] border-[1.5px] border-ink/10 bg-white px-4 text-base text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-fog focus:border-ink focus:shadow-focus'

/** .afld > label */
export const ALABEL = 'mb-2 block text-sm font-medium text-ink'

/** The small "see all" link in a panel's head. */
export const HEAD_LINK =
  'inline-flex min-h-11 items-center text-sm font-semibold text-ink bg-[linear-gradient(#D4FF3A,#D4FF3A)] bg-[length:0_2px] bg-[position:0_calc(100%-10px)] bg-no-repeat transition-[background-size] duration-300 ease-out hover:bg-[length:100%_2px]'

/** A panel heading with an optional link or control on the right. */
export function PanelHead({ title, sub, aside, className }: { title: React.ReactNode; sub?: React.ReactNode; aside?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mb-5 flex flex-wrap items-start justify-between gap-x-4 gap-y-2', className)}>
      <div className="min-w-0">
        <h2 className={PANEL_H2}>{title}</h2>
        {sub ? <p className={PANEL_SUB}>{sub}</p> : null}
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </div>
  )
}

/** The empty state: a dashed panel with an icon, a line and one way forward. */
export function EmptyPanel({
  icon,
  title,
  body,
  href,
  cta,
  compact = false,
}: {
  icon?: React.ReactNode
  title?: React.ReactNode
  body: React.ReactNode
  href: string
  cta: string
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-3xl border-[1.5px] border-dashed border-ink/15 bg-white/60 text-center',
        compact ? 'px-5 py-8' : 'px-6 py-14',
      )}
    >
      {icon ? (
        <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-chalk text-ink [&_svg]:h-6 [&_svg]:w-6">
          {icon}
        </span>
      ) : null}
      {title ? <p className="font-display text-[22px] leading-[1.15] text-ink">{title}</p> : null}
      <p className={cn('mx-auto max-w-sm text-[15px] leading-[1.55] text-muted', title && 'mt-2')}>{body}</p>
      <Link href={href} className={btnClass(compact ? 'light' : 'ink', 'sm', cn('mt-5', compact && 'border border-ink/10'))}>
        {cta}
      </Link>
    </div>
  )
}
