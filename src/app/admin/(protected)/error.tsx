// src/app/admin/(protected)/error.tsx
'use client'

import { AlertTriangle, RotateCw } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

/**
 * Catches anything thrown while rendering an admin screen — most likely the
 * database being unreachable, or a record deleted in another tab between the
 * list rendering and the detail page loading.
 *
 * It shows the real message rather than a generic apology. This screen is
 * only ever seen by an operator who can act on "Unique constraint failed on
 * slug", and hiding that behind "Something went wrong" would waste their
 * time. It is behind admin auth, so there is no information to leak.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error('[admin]', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">
        <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
          <AlertTriangle size={22} className="text-red-600" aria-hidden="true" />
        </span>

        <h1 className="text-lg font-semibold text-slate-900">This screen failed to load</h1>
        <p className="mt-2 text-ui-sm leading-relaxed text-slate-500">
          Nothing was changed. The most common causes are the database being
          unavailable, or a record having been deleted in another tab.
        </p>

        <p className="mt-4 break-words rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left font-mono text-ui-xs text-slate-600">
          {error.message || 'Unknown error'}
          {error.digest ? (
            <span className="mt-1 block text-slate-400">digest: {error.digest}</span>
          ) : null}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-ui font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
          >
            <RotateCw size={15} aria-hidden="true" />
            Try again
          </button>

          <Link
            href="/admin"
            className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-4 text-ui font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
          >
            Back to overview
          </Link>
        </div>
      </div>
    </div>
  )
}
