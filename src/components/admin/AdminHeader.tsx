// src/components/admin/AdminHeader.tsx
import type * as React from 'react'

import { cn } from '@/lib/utils'

import { AdminBackButton } from './AdminBackButton'
import { InfoHint } from './InfoHint'

export interface AdminHeaderProps {
  title: React.ReactNode
  /** The line under the title. */
  description?: React.ReactNode
  /** Plain-language answer to "what is this page for?", behind the design's `?`. See InfoHint. */
  help?: React.ReactNode
  /** The page's actions, right-aligned (`.phead__actions`). Pass several in a fragment. */
  action?: React.ReactNode
  /** Parent route for detail and create pages: shows the design's `.backbtn`. */
  backHref?: string
  /** Anything under the title and description — the dashboard's live status pill. */
  children?: React.ReactNode
  /** Accessible name for the help button when the title is not plain text. */
  helpLabel?: string
  className?: string
}

/**
 * The design's page head (`.phead`): Power Grotesk title, optional `?`, a
 * muted line, and the page's buttons on the right. Not sticky — the top bar
 * above it is — and not padded: the shell's `.page` already is.
 */
export function AdminHeader({
  title,
  description,
  help,
  action,
  backHref,
  children,
  helpLabel,
  className,
}: AdminHeaderProps) {
  const text = (
    <div className="min-w-0">
      <h1>
        {title}
        {help ? (
          <>
            {' '}
            <InfoHint label={helpLabel ?? (typeof title === 'string' ? title : 'this page')}>{help}</InfoHint>
          </>
        ) : null}
      </h1>
      {description ? <p>{description}</p> : null}
      {children}
    </div>
  )

  return (
    <div className={cn('phead', className)} data-in>
      {backHref ? (
        <div className="phead__row">
          <AdminBackButton fallbackHref={backHref} />
          {text}
        </div>
      ) : (
        text
      )}
      {action ? <div className="phead__actions">{action}</div> : null}
    </div>
  )
}
