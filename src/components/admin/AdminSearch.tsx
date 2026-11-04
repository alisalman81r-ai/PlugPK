// src/components/admin/AdminSearch.tsx
'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'

import { cn } from '@/lib/utils'

import { AdmIcon } from './admin-icons'
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
 * A search box that searches the database, not the page — the design's
 * `.search` (48px, paper ground, volt focus ring), usually inside a
 * `.card.tools`.
 *
 * Typing updates `?q=` after a short pause, and the server page re-reads one
 * page of matches; Enter skips the pause. `replace` rather than `push`, so
 * Back leaves the list instead of stepping through every prefix typed.
 */
export function AdminSearch({ placeholder, label, param = 'q', className }: AdminSearchProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get(param) ?? ''

  const [value, setValue] = React.useState(current)
  const [isPending, startTransition] = React.useTransition()

  // What this box last sent. When the URL catches up, the box is not reset.
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
      className={cn('search', isPending && 'is-pending', className)}
    >
      <AdmIcon name="search" />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        maxLength={100}
      />
      {value ? (
        <button
          type="button"
          className="search__clear"
          onClick={() => {
            setValue('')
            commit('')
          }}
          aria-label="Clear search"
        >
          <AdmIcon name="x" />
        </button>
      ) : null}
    </form>
  )
}
