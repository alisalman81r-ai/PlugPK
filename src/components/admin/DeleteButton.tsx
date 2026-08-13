// src/components/admin/DeleteButton.tsx
'use client'

import { Loader2, Trash2 } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'

export interface DeleteButtonProps {
  /** Server action bound to the record's id by the caller. */
  action: () => Promise<{ ok: boolean; message?: string }>
  /** Named in the confirmation, so nobody deletes the wrong row. */
  label: string
  className?: string
}

/**
 * Two-step delete. The first click arms it and the second confirms, which
 * beats window.confirm: it cannot be suppressed by the browser, it is
 * keyboard reachable, and the armed state is visible in the row itself.
 *
 * Arming resets after a few seconds so a forgotten click cannot sit primed
 * on the page waiting for an accidental second one.
 */
export function DeleteButton({ action, label, className }: DeleteButtonProps) {
  const [armed, setArmed] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!armed) return
    const timer = setTimeout(() => setArmed(false), 4000)
    return () => clearTimeout(timer)
  }, [armed])

  const handleClick = () => {
    if (!armed) {
      setArmed(true)
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (!result.ok) {
        setError(result.message ?? 'Could not delete.')
        setArmed(false)
      }
    })
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-label={armed ? `Confirm deleting ${label}` : `Delete ${label}`}
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-ui-sm font-medium transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-60',
          armed
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'text-slate-400 hover:bg-red-50 hover:text-red-600',
          className,
        )}
      >
        {isPending ? (
          <Loader2 size={15} className="shrink-0 animate-spin" aria-hidden="true" />
        ) : (
          <Trash2 size={15} className="shrink-0" aria-hidden="true" />
        )}
        {armed ? 'Confirm' : null}
      </button>

      {error ? (
        <span role="alert" className="text-ui-xs text-red-600">
          {error}
        </span>
      ) : null}
    </span>
  )
}
