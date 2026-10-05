// src/components/admin/DeleteButton.tsx
'use client'

import { Loader2, Trash2 } from '@/components/ui/icons'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { cn } from '@/lib/utils'

import { useAdminToast } from './AdminToast'
import { runAction } from './run-action'

export interface DeleteButtonProps {
  /** Server action bound to the record's id by the caller. */
  action: () => Promise<{ ok: boolean; message?: string }>
  /** Named in the confirmation, so nobody deletes the wrong row. */
  label: string
  /**
   * What goes with the record, shown while the button is armed — "and its 3
   * connectors and 12 reviews". Several deletes here cascade in the schema,
   * and a two-click confirm that does not say so is confirming the wrong
   * question.
   */
  consequence?: string
  className?: string
}

/**
 * Two-step delete. The first click arms it and the second confirms, which
 * beats window.confirm: it cannot be suppressed by the browser, it is
 * keyboard reachable, and the armed state is visible in the row itself.
 *
 * Arming resets after a few seconds so a forgotten click cannot sit primed
 * on the page waiting for an accidental second one — longer when there is a
 * consequence to read.
 *
 * Every outcome is reported. A rejected action (network, expired deployment)
 * used to leave the spinner turning, and a success said nothing at all.
 */
export function DeleteButton({ action, label, consequence, className }: DeleteButtonProps) {
  const router = useRouter()
  const toast = useAdminToast()
  const [armed, setArmed] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)
  const noteId = React.useId()

  React.useEffect(() => {
    if (!armed) return
    const timer = setTimeout(() => setArmed(false), consequence ? 8000 : 4000)
    return () => clearTimeout(timer)
  }, [armed, consequence])

  const handleClick = () => {
    if (!armed) {
      setArmed(true)
      setError(null)
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await runAction(action)
      setArmed(false)
      if (!result.ok) {
        const message = result.message ?? 'Could not delete.'
        setError(message)
        toast.error(message)
        return
      }
      toast.success(result.message ?? `Deleted ${label}.`)
      router.refresh()
    })
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-label={armed ? `Confirm deleting ${label}` : `Delete ${label}`}
        aria-describedby={armed && consequence ? noteId : undefined}
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

      {armed && consequence ? (
        <span
          id={noteId}
          role="note"
          className="max-w-[16rem] text-right text-ui-xs font-medium leading-snug text-red-700"
        >
          Also deletes {consequence}.
        </span>
      ) : null}

      {error ? (
        <span role="alert" className="max-w-[16rem] text-right text-ui-xs text-red-600">
          {error}
        </span>
      ) : null}
    </span>
  )
}
