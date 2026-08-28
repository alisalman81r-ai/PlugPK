// src/app/(main)/cars/error.tsx
'use client'

import { RotateCcw } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

/**
 * The car section's error boundary.
 *
 * Scoped to this route rather than the app: a failure in the catalogue should
 * not take the map or the community down with it, and this way the header and
 * footer survive so nobody is stranded on a blank page.
 *
 * `reset` re-renders the segment without a full reload, which is the right first
 * move for a transient failure. A way out sits beside it, because pressing retry
 * twice on something permanently broken is where trust goes.
 *
 * The error's own message is not printed. It is written for whoever wrote the
 * code, and a stack fragment on a car page reads as a broken site rather than as
 * information. The digest is shown instead — it is safe, and it is what ties
 * somebody's screen to a line in the server log.
 */
export default function CarsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error('Cars route failed:', error)
  }, [error])

  return (
    <section className="bg-white py-24 lg:py-32">
      <div className="container-plug">
        <div className="mx-auto max-w-md text-center">
          <p className="text-ui-sm font-bold uppercase tracking-[0.18em] text-plug-blue-600">
            Something went wrong
          </p>

          <h1 className="mt-4 text-[clamp(1.75rem,4vw,2.5rem)] font-black leading-[1.1] tracking-[-0.03em] text-slate-900">
            The car database did not load
          </h1>

          <p className="mt-4 text-ui leading-relaxed text-slate-500">
            This one is on us. Trying again usually clears it.
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
              href="/map"
              className="inline-flex h-12 items-center justify-center rounded-xl border-[1.5px] border-slate-300 px-6 text-ui font-semibold text-slate-800 transition-colors hover:border-slate-900"
            >
              Find a charger instead
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
