// src/components/admin/PortStepper.tsx
'use client'

import { Check, Loader2, Minus, Plus } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'

export interface PortStepperProps {
  available: number
  total: number
  action: (next: number) => Promise<{ ok: boolean; message?: string }>
  label: string
}

/**
 * Inline adjustment for free ports.
 *
 * This is the write an operator makes most often and most urgently — a
 * charger frees up, the map should say so within seconds. Making them open a
 * form, scroll to a field and submit would mean the number is usually stale.
 *
 * The displayed value updates immediately and reconciles when the server
 * answers, so the control feels instant on a slow connection. If the write
 * fails the value snaps back to what the server actually holds rather than
 * leaving a comfortable lie on screen.
 */
export function PortStepper({ available, total, action, label }: PortStepperProps) {
  const [value, setValue] = React.useState(available)
  const [isPending, startTransition] = React.useTransition()
  const [savedAt, setSavedAt] = React.useState(0)
  const [error, setError] = React.useState<string | null>(null)

  // A change from the server (revalidation, another operator) wins.
  React.useEffect(() => {
    setValue(available)
  }, [available])

  React.useEffect(() => {
    if (!savedAt) return
    const timer = setTimeout(() => setSavedAt(0), 1800)
    return () => clearTimeout(timer)
  }, [savedAt])

  const commit = (next: number) => {
    const clamped = Math.max(0, Math.min(next, total))
    if (clamped === value) return

    const previous = value
    setValue(clamped)
    setError(null)

    startTransition(async () => {
      const result = await action(clamped)
      if (result.ok) {
        setSavedAt(Date.now())
      } else {
        setValue(previous)
        setError(result.message ?? 'Could not save.')
      }
    })
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <span className="inline-flex items-center gap-1">
        <button
          type="button"
          onClick={() => commit(value - 1)}
          disabled={isPending || value <= 0}
          aria-label={`One fewer port free at ${label}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 disabled:opacity-40"
        >
          <Minus size={14} />
        </button>

        <span
          aria-live="polite"
          className={cn(
            'inline-flex h-8 min-w-[68px] items-center justify-center rounded-lg border px-2 font-mono text-ui-sm font-semibold tabular-nums transition-colors',
            savedAt
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
              : 'border-slate-200 bg-white text-slate-900',
          )}
        >
          {isPending ? (
            <Loader2 size={13} className="mr-1 animate-spin" aria-hidden="true" />
          ) : savedAt ? (
            <Check size={13} className="mr-1" aria-hidden="true" />
          ) : null}
          {value}/{total}
        </span>

        <button
          type="button"
          onClick={() => commit(value + 1)}
          disabled={isPending || value >= total}
          aria-label={`One more port free at ${label}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 disabled:opacity-40"
        >
          <Plus size={14} />
        </button>
      </span>

      {error ? (
        <span role="alert" className="text-ui-xs text-red-600">
          {error}
        </span>
      ) : null}
    </span>
  )
}
