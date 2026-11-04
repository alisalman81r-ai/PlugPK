// src/components/admin/PortStepper.tsx
'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

import { AdmIcon } from './admin-icons'
import { runAction } from './run-action'

export interface PortStepperProps {
  available: number
  total: number
  action: (next: number) => Promise<{ ok: boolean; message?: string }>
  label: string
}

/**
 * Inline adjustment for free ports — the design's `.step`: minus, the
 * figure, plus; the figure flashes volt (`bump`) on every change.
 *
 * The write an operator makes most often and most urgently, so the figure
 * changes at once and reconciles when the server answers. If the write fails
 * it snaps back to what the server holds, with the reason under it.
 */
export function PortStepper({ available, total, action, label }: PortStepperProps) {
  const [value, setValue] = React.useState(available)
  const [isPending, startTransition] = React.useTransition()
  const [bumps, setBumps] = React.useState(0)
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
    setBumps((n) => n + 1)
    setError(null)

    startTransition(async () => {
      const result = await runAction(() => action(clamped))
      if (!result.ok) {
        setValue(previous)
        setError(result.message ?? 'Could not save.')
      }
    })
  }

  return (
    <span className="stepw">
      <span className={cn('step', bumps > 0 && 'bump', isPending && 'is-pending')}>
        <button
          type="button"
          onClick={() => commit(value - 1)}
          disabled={isPending || value <= 0}
          aria-label={`One fewer port free at ${label}`}
        >
          <AdmIcon name="minus" />
        </button>
        {/* Keyed by the change count, so the bump animation replays each time. */}
        <output key={bumps} aria-live="polite">
          {value}/{total}
        </output>
        <button
          type="button"
          onClick={() => commit(value + 1)}
          disabled={isPending || value >= total}
          aria-label={`One more port free at ${label}`}
        >
          <AdmIcon name="plus" />
        </button>
      </span>
      {error ? (
        <span role="alert" className="ferr">
          {error}
        </span>
      ) : null}
    </span>
  )
}
