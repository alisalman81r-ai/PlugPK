// src/app/(main)/cars/error.tsx
'use client'

import { RotateCcw } from '@/components/ui/icons'
import * as React from 'react'

import { Btn, Eyebrow } from '@/components/v2/ui'

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
    <section data-theme="light" className="bg-chalk py-24 lg:py-32">
      <div className="mx-auto w-[min(560px,calc(100%-32px))] text-center">
        <Eyebrow>Something went wrong</Eyebrow>

        <h1 className="font-display text-[clamp(32px,4.4vw,52px)] leading-[1.04] text-ink text-balance">
          The car database did not load
        </h1>

        <p className="mt-4 text-base leading-relaxed text-muted">This one is on us. Trying again usually clears it.</p>

        {error.digest ? <p className="mt-3 font-mono text-xs text-muted">Reference: {error.digest}</p> : null}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Btn variant="ink" size="lg" onClick={reset}>
            <RotateCcw aria-hidden="true" />
            Try again
          </Btn>
          <Btn variant="ghost" size="lg" href="/map">
            Find a charger instead
          </Btn>
        </div>
      </div>
    </section>
  )
}
