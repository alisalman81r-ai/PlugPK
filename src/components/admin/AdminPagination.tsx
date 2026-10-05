// src/components/admin/AdminPagination.tsx
import { ChevronLeft, ChevronRight } from '@/components/ui/icons'
import Link from 'next/link'

import { cn } from '@/lib/utils'

import { buildHref, type ListParams } from './list-params'

export interface AdminPaginationProps {
  /** The list's own route, e.g. /admin/members. */
  path: string
  /** The current query string, so filters survive a page change. */
  params: ListParams
  page: number
  pageSize: number
  total: number
  /** Singular and plural noun for the summary line. */
  noun?: [string, string]
}

const STEP =
  'inline-flex h-9 items-center gap-1 rounded-lg border px-3 text-ui-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500'

/**
 * Previous / next, with where you are in words.
 *
 * Links rather than buttons: a page of results is a URL, so it can be opened
 * in a new tab or shared, and it works before any JavaScript has loaded.
 * Numbered pages are left out on purpose — an operator works a queue from the
 * top, and a row of twenty page numbers is a control nobody uses.
 */
export function AdminPagination({ path, params, page, pageSize, total, noun = ['result', 'results'] }: AdminPaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1
  const last = Math.min(total, page * pageSize)
  const word = total === 1 ? noun[0] : noun[1]

  return (
    <nav aria-label="Pagination" className="mt-5 flex flex-wrap items-center justify-between gap-3">
      <p className="text-ui-sm text-slate-500" aria-live="polite">
        {total === 0 ? (
          `No ${noun[1]}`
        ) : page > pages ? (
          `Page ${page} is past the end — there ${total === 1 ? 'is' : 'are'} ${total} ${word}.`
        ) : (
          <>
            Showing <span className="font-semibold text-slate-700">{first}–{last}</span> of{' '}
            <span className="font-semibold text-slate-700">{total.toLocaleString('en-PK')}</span> {word}
          </>
        )}
      </p>

      {pages > 1 ? (
        <div className="flex items-center gap-2">
          {page > 1 ? (
            <Link
              href={buildHref(path, params, { page: String(Math.min(page - 1, pages)) })}
              className={cn(STEP, 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50')}
              rel="prev"
            >
              <ChevronLeft size={14} aria-hidden="true" />
              Previous
            </Link>
          ) : (
            <span aria-disabled="true" className={cn(STEP, 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300')}>
              <ChevronLeft size={14} aria-hidden="true" />
              Previous
            </span>
          )}

          <span className="text-ui-xs tabular-nums text-slate-500">
            Page {Math.min(page, pages)} of {pages}
          </span>

          {page < pages ? (
            <Link
              href={buildHref(path, params, { page: String(page + 1) })}
              className={cn(STEP, 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50')}
              rel="next"
            >
              Next
              <ChevronRight size={14} aria-hidden="true" />
            </Link>
          ) : (
            <span aria-disabled="true" className={cn(STEP, 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300')}>
              Next
              <ChevronRight size={14} aria-hidden="true" />
            </span>
          )}
        </div>
      ) : null}
    </nav>
  )
}
