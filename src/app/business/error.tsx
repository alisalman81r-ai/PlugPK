'use client'

import { RotateCcw } from '@/components/ui/icons'
import Link from 'next/link'
import * as React from 'react'

import { btnClass } from '@/components/v2/ui'

/**
 * The business portal's error boundary.
 *
 * The portal sits outside the (main) route group, so without this a failed
 * database read fell through to the global handler, which replaces the whole
 * document. Retry first, a way out beside it, and the digest rather than the
 * raw message, which is written for developers and reads to an owner as a
 * broken site. Drawn in the portal's language: chalk, an ink card, volt.
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
    <section className="grid min-h-screen place-items-center bg-chalk px-4 py-20 bg-[radial-gradient(rgba(11,12,14,.055)_1px,transparent_1.5px)] [background-size:16px_16px]">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] bg-ink p-8 text-white shadow-e4 sm:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-40 h-[420px] w-[420px] rounded-full bg-[radial-gradient(closest-side,rgba(212,255,58,.16),transparent_70%)]"
        />
        <p className="relative font-mono text-xs font-semibold uppercase tracking-[0.16em] text-volt">
          Business portal · something went wrong
        </p>

        <h1 className="relative mt-4 font-display text-[clamp(2rem,4.5vw,2.75rem)] leading-[1.04]">
          Your listing did not load
        </h1>

        <p className="relative mt-4 text-[15px] leading-relaxed text-fog">
          Nothing on your listing has changed. Trying again usually clears it.
        </p>

        {error.digest ? (
          <p className="relative mt-4 inline-flex rounded-lg border border-white/10 px-2.5 py-1 font-mono text-xs text-fog">
            Reference: {error.digest}
          </p>
        ) : null}

        <div className="relative mt-8 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={reset} className={btnClass('volt', 'md')}>
            <RotateCcw size={16} aria-hidden="true" />
            Try again
          </button>
          <Link href="/" className={btnClass('ghostDark', 'md')}>
            Back to the home page
          </Link>
        </div>
      </div>
    </section>
  )
}
