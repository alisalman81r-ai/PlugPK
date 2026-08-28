// src/components/admin/ServiceReviewControl.tsx
'use client'

import { Check, Loader2, X } from 'lucide-react'
import * as React from 'react'

import { reviewServiceApplication } from '@/lib/db/service-application-actions'
import { cn } from '@/lib/utils'

/**
 * Approve or reject one service application.
 *
 * Approving publishes the listing, which is the one irreversible-feeling action
 * on this page, so it is a real button with the word on it rather than a tick
 * icon — an operator should never approve something because they guessed what a
 * glyph did. Rejecting asks for nothing extra: the note field exists on the row
 * for when a reason is worth recording, and forcing one before every rejection
 * would just get filled with a full stop.
 *
 * The server action re-checks the admin session itself. This component is only
 * the trigger; it cannot be trusted, and it does not need to be.
 */
export function ServiceReviewControl({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)

  function review(status: 'approved' | 'rejected') {
    setError(null)
    startTransition(async () => {
      const result = await reviewServiceApplication(id, status)
      if (!result.ok) setError(result.message ?? 'That did not work.')
    })
  }

  return (
    <span className="flex items-center justify-end gap-1.5">
      {error ? <span className="mr-1 text-ui-xs text-red-600">{error}</span> : null}

      <button
        type="button"
        disabled={pending}
        onClick={() => review('approved')}
        aria-label={`Approve ${name}`}
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-lg bg-plug-blue-600 px-3 text-ui-sm font-semibold text-white',
          'transition-colors hover:bg-plug-blue-700 disabled:cursor-not-allowed disabled:opacity-60',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2',
        )}
      >
        {pending ? (
          <Loader2 size={14} className="animate-spin" aria-hidden="true" />
        ) : (
          <Check size={14} aria-hidden="true" />
        )}
        Approve
      </button>

      <button
        type="button"
        disabled={pending}
        onClick={() => review('rejected')}
        aria-label={`Reject ${name}`}
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-lg border-[1.5px] border-slate-300 px-3 text-ui-sm font-semibold text-slate-700',
          'transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700',
          'disabled:cursor-not-allowed disabled:opacity-60',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2',
        )}
      >
        <X size={14} aria-hidden="true" />
        Reject
      </button>
    </span>
  )
}
