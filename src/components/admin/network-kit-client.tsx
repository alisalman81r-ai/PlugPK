// src/components/admin/network-kit-client.tsx
'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

import { runAction } from './run-action'

/**
 * .step: inline adjustment for free ports, the design's stepper.
 *
 * The write an operator makes most often and most urgently — a charger frees
 * up, the map should say so within seconds. The figure changes at once and
 * flashes volt (.bump); if the server refuses, it snaps back to what the
 * server holds rather than leaving a comfortable lie on screen.
 */
export function PortStep({
  available,
  total,
  action,
  label,
}: {
  available: number
  total: number
  action: (next: number) => Promise<{ ok: boolean; message?: string }>
  label: string
}) {
  const [value, setValue] = React.useState(available)
  const [isPending, startTransition] = React.useTransition()
  const outRef = React.useRef<HTMLOutputElement>(null)
  const [error, setError] = React.useState<string | null>(null)

  // A change from the server (revalidation, another operator) wins.
  React.useEffect(() => {
    setValue(available)
  }, [available])

  const commit = (next: number) => {
    const clamped = Math.max(0, Math.min(next, total))
    if (clamped === value) return
    const previous = value
    setValue(clamped)
    // .step.bump: the figure flashes volt as it changes.
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      outRef.current?.animate(
        [{ backgroundColor: 'rgba(212,255,58,0)' }, { backgroundColor: 'rgba(212,255,58,.5)', offset: 0.4 }, { backgroundColor: 'rgba(212,255,58,0)' }],
        { duration: 400, easing: 'cubic-bezier(.34,1.56,.64,1)' },
      )
    }
    setError(null)
    startTransition(async () => {
      const result = await runAction(() => action(clamped))
      if (!result.ok) {
        setValue(previous)
        setError(result.message ?? 'Could not save.')
      }
    })
  }

  const btn =
    'grid h-[38px] w-[38px] place-items-center border-0 bg-transparent text-ink transition-colors duration-200 enabled:hover:bg-volt disabled:cursor-default disabled:text-[#c8cacd]'

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <span className="inline-flex items-center overflow-hidden rounded-xl border border-ink/[.09] bg-white">
        <button type="button" onClick={() => commit(value - 1)} disabled={isPending || value <= 0} aria-label={`One fewer port free at ${label}`} className={btn}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true" className="h-4 w-4">
            <path d="M5 12h14" />
          </svg>
        </button>
        <output
          ref={outRef}
          aria-live="polite"
          className={cn(
            'min-w-[60px] border-x border-ink/[.09] text-center font-mono text-[15px] font-semibold leading-[38px] tabular-nums transition-opacity',
            isPending && 'opacity-60',
          )}
        >
          {value}/{total}
        </output>
        <button type="button" onClick={() => commit(value + 1)} disabled={isPending || value >= total} aria-label={`One more port free at ${label}`} className={btn}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true" className="h-4 w-4">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </span>
      {error ? (
        <span role="alert" className="text-xs text-[#c2410c]">
          {error}
        </span>
      ) : null}
    </span>
  )
}
