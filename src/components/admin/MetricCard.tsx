// src/components/admin/MetricCard.tsx
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'

import { InfoHint } from '@/components/admin/InfoHint'
import { cn } from '@/lib/utils'

/**
 * One figure on the operations dashboard.
 *
 * ── Why a metric can have no value ────────────────────────────────────
 *
 * `value` is nullable, and that is the point of this component rather than an
 * oversight in it. Three of the six figures an operator asked for — sessions,
 * revenue, uptime — have no source in this product: there is no session table,
 * no pricing on a connector and no heartbeat history. A card that filled those
 * with a plausible number would be indistinguishable from one reading a real
 * meter, which is the one failure mode a control room cannot tolerate.
 *
 * So a null value renders as an explicit "Not tracked yet" with the reason
 * underneath. The card keeps its place in the grid, so the layout is finished
 * and the gap is visible — and when a source lands, only the query changes.
 */

export type MetricTone = 'neutral' | 'good' | 'warn' | 'critical'

const TONE_DOT: Record<MetricTone, string> = {
  neutral: 'bg-slate-300',
  good: 'bg-green-500',
  warn: 'bg-amber-500',
  critical: 'bg-red-500',
}

const TONE_TEXT: Record<MetricTone, string> = {
  neutral: 'text-slate-500',
  good: 'text-green-700',
  warn: 'text-amber-700',
  critical: 'text-red-700',
}

export interface MetricCardProps {
  label: string
  /** Null when the product has no source for this figure yet. */
  value: string | null
  /** The line under the number — what it means, not what it is. */
  detail?: string
  /** Why there is no value. Only read when `value` is null. */
  unavailableReason?: string
  icon: LucideIcon
  tone?: MetricTone
  /** Makes the whole card a link to where the figure can be acted on. */
  href?: string
  /**
   * Plain-language answer to "what is this card for?", shown behind a ? in the
   * corner. Say what it counts, where the number comes from, and what to do
   * about it — a hint that restates the label adds a control and answers
   * nothing. See InfoHint.
   */
  help?: React.ReactNode
}

export function MetricCard({
  label,
  value,
  detail,
  unavailableReason,
  icon: Icon,
  tone = 'neutral',
  href,
  help,
}: MetricCardProps) {
  const unavailable = value === null

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span
          aria-hidden="true"
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            unavailable ? 'bg-slate-100 text-slate-400' : 'bg-plug-blue-50 text-plug-blue-600',
          )}
        >
          <Icon size={17} />
        </span>

        {/* The status dot is the only colour on a healthy card, so a row of six
            can be read for trouble without reading a single number. */}
        {!unavailable && tone !== 'neutral' ? (
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className={cn('h-1.5 w-1.5 rounded-full', TONE_DOT[tone])} />
          </span>
        ) : null}
      </div>

      <p className="mt-4 text-ui-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>

      {unavailable ? (
        <>
          <p className="mt-1.5 text-[1.375rem] font-bold leading-none text-slate-300">—</p>
          <p className="mt-2 text-ui-xs leading-snug text-slate-400">
            {unavailableReason ?? 'Not tracked yet.'}
          </p>
        </>
      ) : (
        <>
          <p className="mt-1.5 text-[1.75rem] font-black leading-none tracking-[-0.02em] tabular-nums text-slate-900">
            {value}
          </p>
          {detail ? (
            <p className={cn('mt-2 text-ui-xs leading-snug', TONE_TEXT[tone])}>{detail}</p>
          ) : null}
        </>
      )}
    </>
  )

  const shell = cn(
    'rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
    // Hover is a border and a shadow, never a transform: six cards lifting on a
    // grid is motion for its own sake, and this page is read at a glance.
    href &&
      'transition-[border-color,box-shadow] duration-200 hover:border-slate-300 hover:shadow-[0_4px_16px_-4px_rgba(15,23,42,0.10)]',
    unavailable && 'bg-slate-50/60',
  )

  /*
    The hint sits outside the card, not inside it.

    A card with an href is a Link, and a <button> inside an <a> is invalid
    markup that navigates instead of opening. Positioning it over the corner
    keeps one control per job: the card goes somewhere, the ? explains.
  */
  const card =
    href && !unavailable ? (
      <Link
        href={href}
        className={cn(shell, 'block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500')}
      >
        {body}
      </Link>
    ) : (
      <div className={shell}>{body}</div>
    )

  if (!help) return card

  return (
    <div className="relative">
      {card}
      <span className="absolute right-3.5 top-3.5">
        <InfoHint label={label} align="left">
          {help}
        </InfoHint>
      </span>
    </div>
  )
}
