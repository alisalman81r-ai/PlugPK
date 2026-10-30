// src/components/admin/AdminFilterChips.tsx
import Link from 'next/link'

import { cn } from '@/lib/utils'

import { buildHref, type ListParams } from './list-params'

export interface FilterOption {
  value: string
  label: string
  /** Rows behind the chip, when the page knows it. */
  count?: number
}

export interface AdminFilterChipsProps {
  /** Names the group for screen readers. */
  label: string
  /** Query-string key this group sets. */
  param: string
  options: FilterOption[]
  /** The value in the URL now; `all` when absent. */
  current: string
  path: string
  params: ListParams
}

/**
 * A row of filter chips that are links.
 *
 * Each chip is a URL with one parameter changed, so the server reads the
 * filtered page and nothing filters in the browser. A chip carries its count
 * when the page has one, so the answer is visible before the click.
 */
export function AdminFilterChips({ label, param, options, current, path, params }: AdminFilterChipsProps) {
  return (
    <div role="group" aria-label={label} className="flex min-w-0 flex-wrap items-center gap-1">
      {options.map((option) => {
        const on = current === option.value
        return (
          <Link
            key={option.value}
            href={buildHref(path, params, { [param]: option.value })}
            aria-current={on ? 'true' : undefined}
            scroll={false}
            className={cn(
              'group/chip inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-ui-sm font-semibold transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500',
              on ? 'bg-plug-navy-900 text-white' : 'text-slate-800 hover:bg-slate-100',
            )}
          >
            {option.label}
            {option.count !== undefined ? (
              <span
                className={cn(
                  'rounded px-1 text-[11px] tabular-nums',
                  on ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 group-hover/chip:bg-slate-200',
                  !on && option.count === 0 && 'bg-slate-100/70 text-slate-400',
                )}
              >
                {option.count}
              </span>
            ) : null}
          </Link>
        )
      })}
    </div>
  )
}
