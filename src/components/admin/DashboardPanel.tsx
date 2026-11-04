// src/components/admin/DashboardPanel.tsx
import Link from 'next/link'
import type { IconType } from '@/components/ui/icons'
import type * as React from 'react'

import { cn } from '@/lib/utils'

import { AdmIcon, type AdmIconName } from './admin-icons'
import { InfoHint } from './InfoHint'

/**
 * The card every dashboard section sits in — the design's `.card` with its
 * `.chead` (a Power Grotesk title, a `?`, a muted line, and a link or control
 * on the right). Shared so no two panels disagree about radius or spacing.
 */
export interface DashboardPanelProps {
  title: string
  description?: React.ReactNode
  /** Plain-language answer to "what is this panel for?", behind the design's `?`. */
  help?: React.ReactNode
  /** A link, a toggle — anything right-aligned in the header. */
  action?: React.ReactNode
  /** A hairline (`.hr`) between the header and the body. */
  divided?: boolean
  /** The ink card (`.card.ink`). */
  ink?: boolean
  /** Position on the page, for the design's staggered entrance. */
  index?: number
  className?: string
  children: React.ReactNode
}

const slug = (text: string) => `p-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

export function DashboardPanel({
  title,
  description,
  help,
  action,
  divided = false,
  ink = false,
  index = 0,
  className,
  children,
}: DashboardPanelProps) {
  const id = slug(title)
  return (
    <section
      className={cn('card', ink && 'ink', className)}
      data-in
      style={{ '--i': index } as React.CSSProperties}
      aria-labelledby={id}
    >
      <div className="chead">
        <div className="min-w-0">
          <h2 id={id}>
            {title}
            {help ? <InfoHint label={title}>{help}</InfoHint> : null}
          </h2>
          {description ? <p>{description}</p> : null}
        </div>
        {action}
      </div>
      {divided ? <div className="hr" /> : null}
      {children}
    </section>
  )
}

/**
 * What a panel shows when there is nothing to list — the design's `.empty`: a
 * green disc with a slowly turning dashed ring, a Power Grotesk line and the
 * reason. It states the reason rather than "no data", so a quiet network and
 * an unrecorded one are never confused.
 */
export function PanelEmpty({
  icon,
  title,
  reason,
  action,
  className,
}: {
  icon: AdmIconName | IconType
  title: string
  reason: React.ReactNode
  action?: { label: string; href: string }
  className?: string
}) {
  const Icon = typeof icon === 'string' ? null : icon
  return (
    <div className={cn('empty', className)}>
      <span className="empty__ico">
        {Icon ? <Icon size={30} aria-hidden="true" /> : <AdmIcon name={icon as AdmIconName} />}
      </span>
      <b>{title}</b>
      <p>{reason}</p>
      {action ? (
        <Link href={action.href} className="btn btn--line btn--sm" style={{ marginTop: 14 }}>
          {action.label}
        </Link>
      ) : null}
    </div>
  )
}
