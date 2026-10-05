// src/components/shared/RouteError.tsx
'use client'

import * as React from 'react'

import { Button } from '@/components/ui'
import { RotateCcw } from '@/components/ui/icons'

/**
 * A segment's error boundary body: a heading, the digest, a retry and a way
 * out. Shared by the dashboard and onboarding boundaries so a failed read in
 * either keeps its context instead of falling through to the public one.
 *
 * Same rules as (main)/error.tsx: the message is logged, not printed, and the
 * digest is shown because it ties a screenshot to a server log line.
 */
export interface RouteErrorProps {
  error: Error & { digest?: string }
  reset: () => void
  /** Where the visitor was, for the log line. */
  area: string
  title: string
  body: string
  exit: { href: string; label: string }
}

export function RouteError({ error, reset, area, title, body, exit }: RouteErrorProps) {
  React.useEffect(() => {
    console.error(`${area} failed:`, error)
  }, [area, error])

  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="container-plug">
        <div className="mx-auto max-w-md text-center">
          <p className="text-ui-sm font-bold uppercase tracking-[0.18em] text-plug-cyan-700">
            Something went wrong
          </p>
          <h1 className="mt-4 text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold leading-[1.15] tracking-[-0.02em] text-slate-900">
            {title}
          </h1>
          <p className="mt-4 text-ui leading-relaxed text-slate-500">{body}</p>

          {error.digest ? (
            <p className="mt-3 font-mono text-ui-xs text-slate-500">Reference: {error.digest}</p>
          ) : null}

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" onClick={reset} leftIcon={<RotateCcw size={16} aria-hidden="true" />}>
              Try again
            </Button>
            <Button size="lg" variant="secondary" href={exit.href}>
              {exit.label}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
