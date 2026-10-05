// src/components/admin/BusinessStatusControl.tsx
'use client'

import { Check, Loader2, Undo2, X } from '@/components/ui/icons'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { cn } from '@/lib/utils'

import { useAdminToast } from './AdminToast'
import { runAction } from './run-action'

export type BusinessStatus = 'pending' | 'approved' | 'rejected'

export interface BusinessStatusControlProps {
  status: BusinessStatus
  /** Bound to the business by the page. `note` is sent with a rejection. */
  action: (next: BusinessStatus, note?: string) => Promise<{ ok: boolean; message?: string }>
  /**
   * Why this listing cannot be approved yet (no pin, a charger without a
   * photo), from validateForApproval. Approve is disabled and the reason shown,
   * rather than letting the operator click and be refused.
   */
  approveBlockedReason?: string | null
}

const BUTTON =
  'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-ui-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60'

const NOTE_MAX = 500

/**
 * Approve or reject an application, and undo either.
 *
 * Both decisions are reversible in one click. Approving asks for nothing.
 * Rejecting asks for a reason, and requires one: a rejected business gets no
 * explanation otherwise, and the next operator to open the record has no idea
 * why it was turned down — so it is either approved by mistake or rejected
 * again for a reason that may no longer hold. The note is stored on the
 * listing and shown back on the card.
 */
export function BusinessStatusControl({ status, action, approveBlockedReason }: BusinessStatusControlProps) {
  const router = useRouter()
  const toast = useAdminToast()
  const [isPending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)
  const [rejecting, setRejecting] = React.useState(false)
  const [note, setNote] = React.useState('')
  const noteId = React.useId()

  const move = (next: BusinessStatus, reason?: string) => {
    setError(null)
    startTransition(async () => {
      const result = await runAction(() => action(next, reason))
      if (!result.ok) {
        setError(result.message ?? 'Could not update.')
        return
      }
      setRejecting(false)
      setNote('')
      toast.success(
        result.message ??
          (next === 'approved' ? 'Approved — now live on the map.' : next === 'rejected' ? 'Rejected.' : 'Moved back to pending.'),
      )
      router.refresh()
    })
  }

  const spinner = <Loader2 size={14} className="shrink-0 animate-spin" aria-hidden="true" />
  const trimmed = note.trim()

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <span className="inline-flex items-center gap-2">
        {status === 'pending' ? (
          <>
            <button
              type="button"
              onClick={() => move('approved')}
              disabled={isPending || Boolean(approveBlockedReason)}
              title={approveBlockedReason ?? undefined}
              className={cn(
                BUTTON,
                'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500',
              )}
            >
              {isPending && !rejecting ? spinner : <Check size={14} className="shrink-0" aria-hidden="true" />}
              Approve
            </button>

            <button
              type="button"
              onClick={() => setRejecting((value) => !value)}
              disabled={isPending}
              aria-expanded={rejecting}
              aria-controls={noteId}
              className={cn(
                BUTTON,
                rejecting
                  ? 'border border-red-300 bg-red-50 text-red-700 focus-visible:ring-red-400'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 focus-visible:ring-slate-400',
              )}
            >
              <X size={14} className="shrink-0" aria-hidden="true" />
              Reject
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => move('pending')}
            disabled={isPending}
            className={cn(
              BUTTON,
              'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 focus-visible:ring-slate-400',
            )}
          >
            {isPending ? spinner : <Undo2 size={14} className="shrink-0" aria-hidden="true" />}
            Reopen
          </button>
        )}
      </span>

      {status === 'pending' && approveBlockedReason ? (
        <span className="max-w-[18rem] text-right text-ui-xs text-amber-800">{approveBlockedReason}</span>
      ) : null}

      {rejecting && status === 'pending' ? (
        <form
          id={noteId}
          onSubmit={(event) => {
            event.preventDefault()
            if (trimmed) move('rejected', trimmed)
          }}
          className="mt-1 w-72 max-w-full rounded-lg border border-red-200 bg-red-50/60 p-3"
        >
          <label htmlFor={`${noteId}-note`} className="block text-ui-xs font-semibold text-red-900">
            Reason for rejecting <span aria-hidden="true">*</span>
          </label>
          <textarea
            id={`${noteId}-note`}
            value={note}
            onChange={(event) => setNote(event.target.value.slice(0, NOTE_MAX))}
            rows={3}
            required
            maxLength={NOTE_MAX}
            autoFocus
            placeholder="e.g. Charger photos show a domestic socket, not an EV charger."
            className="mt-1.5 w-full resize-y rounded-md border border-red-200 bg-white p-2 text-ui-sm text-slate-900 outline-none focus-visible:border-red-400"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[11px] tabular-nums text-red-900/60">
              {note.length}/{NOTE_MAX}
            </span>
            <span className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setRejecting(false)}
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
                Reject application
              </button>
            </span>
          </div>
        </form>
      ) : null}

      {error ? (
        <span role="alert" className="max-w-[18rem] text-right text-ui-xs text-red-600">
          {error}
        </span>
      ) : null}
    </span>
  )
}
