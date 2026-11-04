// src/components/admin/AdminPagination.tsx
import Link from 'next/link'

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
  /** A note after the count, e.g. "Reviewer names hidden". */
  note?: string
}

/**
 * The design's `.pager`: where you are in words on the left, Previous / Page
 * x of y / Next on the right.
 *
 * Links rather than buttons: a page of results is a URL, so it can be opened
 * in a new tab or shared, and it works before any JavaScript has loaded. The
 * end that does not exist is a disabled-looking span, not a dead link.
 */
export function AdminPagination({ path, params, page, pageSize, total, noun = ['result', 'results'], note }: AdminPaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1
  const last = Math.min(total, page * pageSize)
  const word = total === 1 ? noun[0] : noun[1]
  const shown = Math.min(page, pages)

  return (
    <nav aria-label="Pagination" className="pager">
      <span aria-live="polite">
        {total === 0 ? (
          `No ${noun[1]}`
        ) : page > pages ? (
          `Page ${page} is past the end — there ${total === 1 ? 'is' : 'are'} ${total} ${word}.`
        ) : (
          <>
            Showing{' '}
            <b>
              {first}–{last}
            </b>{' '}
            of <b>{total.toLocaleString('en-PK')}</b> {word}
          </>
        )}
        {note ? ` · ${note}` : null}
      </span>

      <div className="pager__btns">
        {page > 1 ? (
          <Link href={buildHref(path, params, { page: String(Math.min(page - 1, pages)) })} className="btn btn--line btn--sm" rel="prev">
            Previous
          </Link>
        ) : (
          <span className="btn btn--line btn--sm" aria-disabled="true">
            Previous
          </span>
        )}
        <span>
          Page {shown} of {pages}
        </span>
        {page < pages ? (
          <Link href={buildHref(path, params, { page: String(page + 1) })} className="btn btn--line btn--sm" rel="next">
            Next
          </Link>
        ) : (
          <span className="btn btn--line btn--sm" aria-disabled="true">
            Next
          </span>
        )}
      </div>
    </nav>
  )
}
