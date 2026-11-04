// src/components/admin/PaymentReviewControl.tsx
'use client'

import { Loader2 } from '@/components/ui/icons'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { cn } from '@/lib/utils'

import { useAdminToast } from './AdminToast'
import { Ico, NOTE_BOX, NOTE_TEXTAREA, btnClass } from './network-kit'
import { runAction } from './run-action'

export interface PaymentReviewControlProps {
  status: string
  /** Bound to the payment by the page. `note` is sent with a refusal. */
  action: (decision: 'verified' | 'rejected', note?: string) => Promise<{ ok: boolean; message?: string }>
}

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

  const spinner = <Loader2 size={18} className="shrink-0 animate-spin" aria-hidden="true" />
  const trimmed = note.trim()

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {status !== 'verified' ? (
          <button type="button" onClick={() => decide('verified')} disabled={isPending} className={btnClass('ink', 'sm')}>
            {isPending && !refusing ? spinner : <Ico name="okc" />}
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
            className={cn(btnClass('line', 'sm'), refusing && 'border-[#e2a48c] text-[#b23b0d]')}
          >
            <Ico name="x" />
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
          className={cn(NOTE_BOX, 'w-full max-w-md')}
        >
          <label htmlFor={`${noteId}-note`} className="block text-[13px] font-medium text-ink">
            What the owner should fix <span aria-hidden="true" className="text-[#c2410c]">*</span>
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
            className={NOTE_TEXTAREA}
          />
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-xs tabular-nums text-fog">
              {note.length} / {NOTE_MAX}
            </span>
            <span className="flex items-center gap-1.5">
              <button type="button" onClick={() => setRefusing(false)} className={btnClass('line', 'sm')}>
                Cancel
              </button>
              <button type="submit" disabled={!trimmed || isPending} className={btnClass('danger', 'sm')}>
                {isPending ? spinner : null}
                Mark not received
              </button>
            </span>
          </div>
        </form>
      ) : null}

      {error ? (
        <span role="alert" className="text-xs text-[#c2410c]">
          {error}
        </span>
      ) : null}
    </div>
  )
}
