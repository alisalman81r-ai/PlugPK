// src/components/admin/DashboardPanel.tsx
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

import { InfoHint } from '@/components/admin/InfoHint'
import { cn } from '@/lib/utils'

/**
 * The card every section of the operations dashboard sits in.
 *
 * Shared rather than copied, because the moment two panels disagree about
 * their radius, border or header spacing the page stops reading as one
 * console and starts reading as a stack of widgets.
 */
export interface DashboardPanelProps {
  title: string
  description?: string
  /**
   * Plain-language answer to "what is this panel for?", shown behind a ? beside
   * the title. Say what it lists, where it comes from, and what to do with it.
   * See InfoHint.
   */
  help?: React.ReactNode
  /** Filters, a link, a menu — anything right-aligned in the header. */
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}

export function DashboardPanel({
  title,
  description,
  help,
  action,
  className,
  children,
}: DashboardPanelProps) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(5,36,30,0.04)]',
        className,
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="text-ui font-bold text-slate-900">{title}</h2>
            {help ? <InfoHint label={title}>{help}</InfoHint> : null}
          </div>
          {description ? (
            <p className="mt-0.5 text-ui-xs text-slate-500">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      {children}
    </section>
  )
}

/**
 * What a panel shows when the product cannot fill it yet.
 *
 * Deliberately states the reason rather than saying "no data". An operator
 * seeing an empty chart needs to know whether the network was quiet or whether
 * nothing is being recorded — those are opposite situations and only one of
 * them is a problem with the product.
 */
export function PanelEmpty({
  icon: Icon,
  title,
  reason,
  action,
}: {
  icon: LucideIcon
  title: string
  reason: string
  action?: { label: string; href: string }
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span
        aria-hidden="true"
        className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400"
      >
        <Icon size={19} />
      </span>
      <p className="mt-3 text-ui-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1 max-w-sm text-ui-xs leading-relaxed text-slate-500">{reason}</p>
      {action ? (
        <Link
          href={action.href}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-ui-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-plug-blue-600"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  )
}
