// src/components/admin/BusinessStatusControl.tsx
'use client'

import { Loader2 } from '@/components/ui/icons'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { cn } from '@/lib/utils'

import { useAdminToast } from './AdminToast'
import { Ico, NOTE_BOX, NOTE_TEXTAREA, btnClass } from './network-kit'
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

  const spinner = <Loader2 size={18} className="shrink-0 animate-spin" aria-hidden="true" />
  const trimmed = note.trim()

  return (
    <span className="inline-flex flex-col items-end gap-1.5">
      <span className="inline-flex flex-wrap items-center gap-2">
        {status === 'pending' ? (
          <>
            <button
              type="button"
              onClick={() => move('approved')}
              disabled={isPending || Boolean(approveBlockedReason)}
              title={approveBlockedReason ?? undefined}
              className={btnClass('ink', 'sm')}
            >
              {isPending && !rejecting ? spinner : <Ico name="okc" />}
              Approve
            </button>

            <button
              type="button"
              onClick={() => setRejecting((value) => !value)}
              disabled={isPending}
              aria-expanded={rejecting}
              aria-controls={noteId}
              className={cn(btnClass('line', 'sm'), rejecting && 'border-[#e2a48c] text-[#b23b0d]')}
            >
              <Ico name="x" />
              Reject
            </button>
          </>
        ) : (
          <button type="button" onClick={() => move('pending')} disabled={isPending} className={btnClass('line', 'sm')}>
            {isPending ? spinner : <Ico name="undo" />}
            Reopen
          </button>
        )}
      </span>

      {status === 'pending' && approveBlockedReason ? (
        <span className="max-w-[18rem] text-right text-xs leading-snug text-[#8a5a00]">{approveBlockedReason}</span>
      ) : null}

      {rejecting && status === 'pending' ? (
        <form
          id={noteId}
          onSubmit={(event) => {
            event.preventDefault()
            if (trimmed) move('rejected', trimmed)
          }}
          className={cn(NOTE_BOX, 'w-80')}
        >
          <label htmlFor={`${noteId}-note`} className="block text-[13px] font-medium text-ink">
            Reason for rejecting <span aria-hidden="true" className="text-[#c2410c]">*</span>
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
            className={NOTE_TEXTAREA}
          />
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <span className="font-mono text-xs tabular-nums text-fog">
              {note.length} / {NOTE_MAX}
            </span>
            <span className="flex items-center gap-1.5">
              <button type="button" onClick={() => setRejecting(false)} className={btnClass('line', 'sm')}>
                Cancel
              </button>
              <button type="submit" disabled={!trimmed || isPending} className={btnClass('danger', 'sm')}>
                {isPending ? spinner : null}
                Reject application
              </button>
            </span>
          </div>
        </form>
      ) : null}

      {error ? (
        <span role="alert" className="max-w-[18rem] text-right text-xs text-[#c2410c]">
          {error}
        </span>
      ) : null}
    </span>
  )
}
