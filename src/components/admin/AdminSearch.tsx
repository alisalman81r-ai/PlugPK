// src/components/admin/AdminSearch.tsx
'use client'

import { Search, X } from '@/components/ui/icons'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'

import { cn } from '@/lib/utils'

import { buildHref, flattenParams } from './list-params'

export interface AdminSearchProps {
  placeholder: string
  /** Read by screen readers; the placeholder vanishes once typing starts. */
  label: string
  /** Query-string key. Every list uses `q`. */
  param?: string
  className?: string
}

/**
 * A search box that searches the database, not the page.
 *
 * Typing updates `?q=` after a short pause, and the server page re-reads one
 * page of matches. The pause is what keeps it from being a round trip per
 * keystroke; Enter skips it. `replace` rather than `push`, so Back leaves the
 * list instead of stepping through every prefix of what was typed.
 */
export function AdminSearch({ placeholder, label, param = 'q', className }: AdminSearchProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get(param) ?? ''

  const [value, setValue] = React.useState(current)
  const [isPending, startTransition] = React.useTransition()

  // What this box last sent. When the URL catches up with it, the box is not
  // reset — the operator may already have typed more.
  const sent = React.useRef(current)

  // Another control (a chip, Back) changed the URL: follow it.
  React.useEffect(() => {
    if (current !== sent.current) setValue(current)
    sent.current = current
  }, [current])

  const commit = React.useCallback(
    (next: string) => {
      if (next.trim() === current.trim()) return
      sent.current = next.trim()
      const params = flattenParams(Object.fromEntries(searchParams.entries()))
      startTransition(() => {
        router.replace(buildHref(pathname, params, { [param]: next.trim() || undefined }), { scroll: false })
      })
    },
    [current, param, pathname, router, searchParams],
  )

  React.useEffect(() => {
    if (value === current || value.trim() === sent.current) return
    const timer = setTimeout(() => commit(value), 350)
    return () => clearTimeout(timer)
  }, [value, current, commit])

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        commit(value)
      }}
      className={cn('relative min-w-[220px] flex-1', className)}
    >
      <Search
        size={16}
        className={cn(
          'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2',
          isPending ? 'animate-pulse text-plug-blue-500' : 'text-slate-400',
        )}
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        maxLength={100}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-ui text-slate-900 outline-none transition-[border-color,box-shadow] placeholder:text-slate-400 focus-visible:border-plug-blue-500 focus-visible:shadow-focus [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            setValue('')
            commit('')
          }}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
        >
          <X size={14} />
        </button>
      ) : null}
    </form>
  )
}
