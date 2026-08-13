// src/components/admin/AdminHeader.tsx
import type * as React from 'react'

export interface AdminHeaderProps {
  title: string
  description?: string
  /** Primary action for the page, rendered right-aligned. */
  action?: React.ReactNode
}

export function AdminHeader({ title, description, action }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-8 py-5 backdrop-blur-md">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {description ? <p className="mt-0.5 text-ui-sm text-slate-500">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}
