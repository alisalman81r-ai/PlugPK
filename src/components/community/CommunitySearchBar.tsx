// src/components/community/CommunitySearchBar.tsx
'use client'

import { Search, X } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Search across the board.
 *
 * useCommunity has filtered on a search query since it was written — title,
 * body and author — but no page ever rendered a field to type into, so the
 * whole branch was unreachable and community was the one directory on the site
 * you could not search. This is that field.
 *
 * No suggestion dropdown, unlike the map's search bar. There a match is a place
 * you want the map to fly to, so the list has to name candidates before you
 * commit; here the feed directly below *is* the result list, and a popover over
 * it would cover the answer it was helping you find.
 *
 * Same shell as the map's field on purpose — h-14, white on the dark band, one
 * count badge, one clear button — because the two do the same job one page
 * apart.
 */

export interface CommunitySearchBarProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  /** Posts matching the query right now, shown once something is typed. */
  resultCount: number
  className?: string
}

export function CommunitySearchBar({
  value,
  onChange,
  onClear,
  resultCount,
  className,
}: CommunitySearchBarProps) {
  const hasQuery = value.trim().length > 0

  return (
    <div className={cn('relative w-full', className)}>
      <div
        className={cn(
          'flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-e3 transition-shadow duration-200',
          'focus-within:border-blue-300 focus-within:shadow-[0_4px_24px_rgba(37,99,235,0.15)]',
        )}
      >
        <Search size={20} className="shrink-0 text-slate-400" aria-hidden="true" />

        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            // Escape clears rather than blurs: with the results directly below,
            // emptying the field is the thing you actually wanted.
            if (event.key === 'Escape' && hasQuery) {
              event.preventDefault()
              onClear()
            }
          }}
          placeholder="Search discussions, or an author…"
          aria-label="Search discussions"
          className="min-w-0 flex-1 border-none bg-transparent text-ui text-slate-900 outline-none placeholder:text-slate-400 [&::-webkit-search-cancel-button]:appearance-none"
        />

        {hasQuery ? (
          <>
            <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 font-mono text-ui-xs font-semibold text-plug-blue-600">
              {resultCount} found
            </span>
            <button
              type="button"
              onClick={onClear}
              aria-label="Clear search"
              className="shrink-0 rounded-full p-1 text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <X size={18} />
            </button>
          </>
        ) : null}
      </div>

      {/* The badge is visual; this is what a screen reader hears, and only
          when the number settles rather than on every keystroke. */}
      <span aria-live="polite" className="sr-only">
        {hasQuery ? `${resultCount} ${resultCount === 1 ? 'post' : 'posts'} match` : ''}
      </span>
    </div>
  )
}
