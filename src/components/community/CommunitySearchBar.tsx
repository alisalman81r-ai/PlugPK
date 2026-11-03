// src/components/community/CommunitySearchBar.tsx
'use client'

import { Search } from '@/components/ui/icons'
import * as React from 'react'

import { btnClass } from '@/components/v2/ui'
import { cn } from '@/lib/utils'

/**
 * Search across the board — landing-v2's .psearch: a white pill on the dark
 * hero with a volt glow under it.
 *
 * No suggestion dropdown, unlike the map's search bar. There a match is a place
 * you want the map to fly to; here the feed directly below *is* the result
 * list, and a popover over it would cover the answer it was helping you find.
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
        role="search"
        className="relative flex h-16 w-full items-center gap-2 rounded-full bg-white py-[7px] pl-[52px] pr-2 shadow-[0_24px_60px_-24px_rgba(212,255,58,.35)] transition-shadow duration-300 focus-within:shadow-[0_0_0_4px_rgba(212,255,58,.45),0_24px_60px_-24px_rgba(212,255,58,.35)]"
      >
        <Search size={20} className="absolute left-5 text-[#8a8e95]" aria-hidden="true" />

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
          autoComplete="off"
          className="h-full min-w-0 flex-1 border-none bg-transparent text-base text-ink outline-none placeholder:text-[#8a8e95] [&::-webkit-search-cancel-button]:appearance-none"
        />

        {hasQuery ? (
          <>
            <span className="hidden shrink-0 rounded-full bg-chalk px-2.5 py-1 font-mono text-[11px] font-semibold text-muted sm:inline">
              {resultCount} found
            </span>
            <button
              type="button"
              onClick={onClear}
              aria-label="Clear search"
              className={btnClass('ink', 'md', 'shrink-0 px-[18px]')}
            >
              Clear
            </button>
          </>
        ) : null}
      </div>

      {/* The badge is visual; this is what a screen reader hears. */}
      <span aria-live="polite" className="sr-only">
        {hasQuery ? `${resultCount} ${resultCount === 1 ? 'post' : 'posts'} match` : ''}
      </span>
    </div>
  )
}
