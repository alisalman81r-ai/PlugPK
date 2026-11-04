// src/components/admin/MetricCard.tsx
import type { IconType } from '@/components/ui/icons'
import Link from 'next/link'
import type * as React from 'react'

import { cn } from '@/lib/utils'

import { AdmIcon, type AdmIconName } from './admin-icons'
import { CountUp, KpiRing } from './admin-motion'
import { InfoHint } from './InfoHint'

/**
 * One figure: the design's KPI tile (`.card.kpi`) — an icon, a mono label, a
 * big JetBrains figure that counts up, and a note with a status dot. The first
 * tile of a row is usually `lit` (ink, volt icon and ring).
 *
 * ── Why a metric can have no value ────────────────────────────────────
 *
 * `value` is nullable on purpose. A figure the product has no source for
 * renders as "—" with the reason underneath rather than a plausible number,
 * which would be indistinguishable from a real reading. The tile keeps its
 * place, so the gap is visible.
 *
 * ── Value ─────────────────────────────────────────────────────────────
 *
 * A whole number ("1,204") counts up. "5 / 6" is drawn as the design draws it:
 * the 5 counts up and " / 6" sits after it, small and fog. Anything else is
 * shown as given.
 */

export type MetricTone = 'neutral' | 'good' | 'warn' | 'critical'

const TONE_DOT: Record<MetricTone, string | null> = {
  neutral: null,
  good: 'dot--ok',
  warn: 'dot--warn',
  critical: 'dot--bad',
}

const TONE_TEXT: Record<MetricTone, string | undefined> = {
  neutral: undefined,
  good: 'ok',
  warn: 'warn',
  critical: 'bad',
}

export interface MetricCardProps {
  label: string
  /** Null when the product has no source for this figure yet. */
  value: string | null
  /** The line under the number — what it means, not what it is. */
  detail?: React.ReactNode
  /** Why there is no value. Only read when `value` is null. */
  unavailableReason?: string
  /** A design icon name ('bolt', 'plug', 'users'…) or a component. */
  icon: AdmIconName | IconType
  tone?: MetricTone
  /** Makes the whole tile a link to where the figure can be acted on. */
  href?: string
  /** Plain-language answer to "what is this tile for?", behind the design's `?`. */
  help?: React.ReactNode
  /** The ink tile (`.kpi.is-lit`): volt icon and ring. */
  lit?: boolean
  /** The amber tile (`.kpi--warn`). */
  warn?: boolean
  /** Draws the corner ring to this fraction (0–1). */
  ring?: number | null
  /** Small text after the figure, e.g. "%" or " / 6". */
  suffix?: string
  /** Position in its row, for the design's staggered entrance. */
  index?: number
  className?: string
}

function Figure({ value, suffix }: { value: string; suffix?: string }) {
  const split = /^\s*([\d,]+)\s*\/\s*(.+)$/.exec(value)
  const main = split?.[1] ?? value
  const tail = split ? ` / ${split[2]}` : suffix
  const n = /^\d[\d,]*$/.test(main) ? Number(main.replace(/,/g, '')) : null
  return (
    <p className="kpi__val">
      {n !== null ? <CountUp value={n} /> : main}
      {tail ? <small>{tail}</small> : null}
    </p>
  )
}

export function MetricCard({
  label,
  value,
  detail,
  unavailableReason,
  icon,
  tone = 'neutral',
  href,
  help,
  lit = false,
  warn = false,
  ring,
  suffix,
  index = 0,
  className,
}: MetricCardProps) {
  const unavailable = value === null
  const Icon = typeof icon === 'string' ? null : icon
  const dot = TONE_DOT[tone]
  const hasRing = typeof ring === 'number' && !unavailable

  /*
    The help button sits outside the link, never inside it: a <button> in an
    <a> is invalid and navigates instead of opening. With a ring in the corner
    it moves beside the label instead.
  */
  const hint = help ? (
    <InfoHint label={label} align="left">
      {help}
    </InfoHint>
  ) : null

  const body = (
    <>
      <div className="kpi__top">
        {Icon ? <Icon size={24} className="kpi__ico" aria-hidden="true" /> : <AdmIcon name={icon as AdmIconName} className="kpi__ico" />}
      </div>
      {hasRing ? <KpiRing fraction={ring} /> : null}
      <p className="kpi__lab">{label}</p>
      {unavailable ? (
        <>
          <p className="kpi__val kpi__val--none">—</p>
          <p className="kpi__note">{unavailableReason ?? 'Not tracked yet.'}</p>
        </>
      ) : (
        <>
          <Figure value={value} suffix={suffix} />
          {detail ? (
            <p className="kpi__note">
              {dot ? <i className={cn('dot', dot)} aria-hidden="true" /> : null}
              <span className={TONE_TEXT[tone]}>{detail}</span>
            </p>
          ) : null}
        </>
      )}
    </>
  )

  const shell = cn('card kpi', lit && 'is-lit', warn && 'kpi--warn', unavailable && 'kpi--none', className)
  const style = { '--i': index } as React.CSSProperties

  return (
    <article className={cn(shell, href && !unavailable && 'kpi--link')} data-in style={style}>
      {href && !unavailable ? (
        <Link href={href} className="kpi__hit" aria-label={`${label}: ${value}`}>
          <span className="sr">Open</span>
        </Link>
      ) : null}
      {body}
      {hint ? <span className={cn('kpi__help', hasRing && 'kpi__help--ring')}>{hint}</span> : null}
    </article>
  )
}
