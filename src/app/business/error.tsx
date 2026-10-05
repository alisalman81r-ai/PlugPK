// src/app/business/error.tsx
'use client'

import { RotateCcw } from '@/components/ui/icons'
import Link from 'next/link'
import * as React from 'react'

/**
 * The business portal's error boundary.
 *
 * The portal sits outside the (main) route group, so without this a failed
 * database read fell through to the global handler, which replaces the whole
 * document. Same approach as (main)/error.tsx: retry first, a way out beside
 * it, and the digest rather than the raw message, which is written for
 * developers and reads to an owner as a broken site.
 */
export default function BusinessError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error('Business portal route failed:', error)
  }, [error])

  return (
    <section className="min-h-screen bg-slate-50 py-24 lg:py-32">
      <div className="mx-auto max-w-md px-4 text-center">
        <p className="text-ui-sm font-bold uppercase tracking-[0.18em] text-plug-blue-600">
          Something went wrong
        </p>

        <h1 className="mt-4 text-[clamp(1.75rem,4vw,2.5rem)] font-black leading-[1.1] tracking-[-0.03em] text-slate-900">
          Your listing did not load
        </h1>

        <p className="mt-4 text-ui leading-relaxed text-slate-500">
          Nothing on your listing has changed. Trying again usually clears it.
        </p>

        {error.digest ? (
          <p className="mt-3 font-mono text-ui-xs text-slate-400">Reference: {error.digest}</p>
        ) : null}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-plug-navy-900 px-6 text-ui font-semibold text-white transition-colors hover:bg-plug-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
          >
            <RotateCcw size={16} aria-hidden="true" />
            Try again
          </button>

          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-xl border-[1.5px] border-slate-300 px-6 text-ui font-semibold text-slate-800 transition-colors hover:border-slate-900"
          >
            Back to the home page
          </Link>
        </div>
      </div>
    </section>
  )
}
