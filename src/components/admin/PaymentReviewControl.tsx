// src/components/admin/PaymentReviewControl.tsx
'use client'

import { Check, Loader2, X } from '@/components/ui/icons'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { cn } from '@/lib/utils'

import { useAdminToast } from './AdminToast'
import { runAction } from './run-action'

export interface PaymentReviewControlProps {
  status: string
  /** Bound to the payment by the page. `note` is sent with a refusal. */
  action: (decision: 'verified' | 'rejected', note?: string) => Promise<{ ok: boolean; message?: string }>
}

const BUTTON =
  'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-ui-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60'

const NOTE_MAX = 500

/**
 * Confirm that a listing fee arrived, or say why it could not be found.
 *
 * Confirming is what unlocks Approve. Refusing needs a reason, because the
 * owner reads it on their dashboard and has to know whether to check the
 * transaction ID, pay the right amount, or send a clearer receipt. Either
 * decision can be changed until the listing is approved.
 */
export function PaymentReviewControl({ status, action }: PaymentReviewControlProps) {
  const router = useRouter()
  const toast = useAdminToast()
  const [isPending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)
  const [refusing, setRefusing] = React.useState(false)
  const [note, setNote] = React.useState('')
  const noteId = React.useId()

  const decide = (decision: 'verified' | 'rejected', reason?: string) => {
    setError(null)
    startTransition(async () => {
      const result = await runAction(() => action(decision, reason))
      if (!result.ok) {
        setError(result.message ?? 'Could not update the payment.')
        return
      }
      setRefusing(false)
      setNote('')
      toast.success(decision === 'verified' ? 'Payment confirmed.' : 'Payment marked as not received.')
      router.refresh()
    })
  }

  const spinner = <Loader2 size={14} className="shrink-0 animate-spin" aria-hidden="true" />
  const trimmed = note.trim()

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {status !== 'verified' ? (
          <button
            type="button"
            onClick={() => decide('verified')}
            disabled={isPending}
            className={cn(BUTTON, 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500')}
          >
            {isPending && !refusing ? spinner : <Check size={14} className="shrink-0" aria-hidden="true" />}
            Confirm payment received
          </button>
        ) : null}
        {status !== 'rejected' ? (
          <button
            type="button"
            onClick={() => setRefusing((value) => !value)}
            disabled={isPending}
            aria-expanded={refusing}
            aria-controls={noteId}
            className={cn(
              BUTTON,
              refusing
                ? 'border border-red-300 bg-red-50 text-red-700 focus-visible:ring-red-400'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 focus-visible:ring-slate-400',
            )}
          >
            <X size={14} className="shrink-0" aria-hidden="true" />
            {status === 'verified' ? 'Undo — not received' : 'Not received'}
          </button>
        ) : null}
      </div>

      {refusing ? (
        <form
          id={noteId}
          onSubmit={(event) => {
            event.preventDefault()
            if (trimmed) decide('rejected', trimmed)
          }}
          className="w-full max-w-md rounded-lg border border-red-200 bg-red-50/60 p-3"
        >
          <label htmlFor={`${noteId}-note`} className="block text-ui-xs font-semibold text-red-900">
            What the owner should fix <span aria-hidden="true">*</span>
          </label>
          <textarea
            id={`${noteId}-note`}
            value={note}
            onChange={(event) => setNote(event.target.value.slice(0, NOTE_MAX))}
            rows={3}
            required
            maxLength={NOTE_MAX}
            autoFocus
            placeholder="e.g. No transfer with this transaction ID reached our account. Check the ID on your receipt."
            className="mt-1.5 w-full resize-y rounded-md border border-red-200 bg-white p-2 text-ui-sm text-slate-900 outline-none focus-visible:border-red-400"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[11px] tabular-nums text-red-900/60">
              {note.length}/{NOTE_MAX}
            </span>
            <span className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setRefusing(false)}
                className="h-8 rounded-md px-2.5 text-ui-xs font-medium text-slate-600 hover:bg-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!trimmed || isPending}
                className="inline-flex h-8 items-center gap-1 rounded-md bg-red-600 px-3 text-ui-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? spinner : null}
                Mark not received
              </button>
            </span>
          </div>
        </form>
      ) : null}

      {error ? (
        <span role="alert" className="text-ui-xs text-red-600">
          {error}
        </span>
      ) : null}
    </div>
  )
}
