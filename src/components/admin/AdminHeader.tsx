// src/components/admin/AdminHeader.tsx
import type * as React from 'react'

import { InfoHint } from '@/components/admin/InfoHint'
import { BackButton } from '@/components/ui'

export interface AdminHeaderProps {
  title: string
  description?: string
  /** Plain-language answer to "what is this page for?". See InfoHint. */
  help?: React.ReactNode
  /** Primary action for the page, rendered right-aligned. */
  action?: React.ReactNode
  /** Parent route for detail and create pages. */
  backHref?: string
}

export function AdminHeader({ title, description, help, action, backHref }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-8 py-5 backdrop-blur-md">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          {backHref ? <BackButton fallbackHref={backHref} /> : null}
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          {help ? <InfoHint label={title}>{help}</InfoHint> : null}
        </div>
        {description ? <p className="mt-0.5 text-ui-sm text-slate-500">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}
