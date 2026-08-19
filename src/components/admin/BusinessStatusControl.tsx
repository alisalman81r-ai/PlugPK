// src/components/admin/BusinessStatusControl.tsx
'use client'

import { Check, Loader2, Undo2, X } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'

export type BusinessStatus = 'pending' | 'approved' | 'rejected'

export interface BusinessStatusControlProps {
  status: BusinessStatus
  action: (next: BusinessStatus) => Promise<{ ok: boolean; message?: string }>
}

const BUTTON =
  'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-ui-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60'

/**
 * Approve or reject an application, and undo either.
 *
 * Both decisions are reversible in one click and neither asks for
 * confirmation. That is the opposite of the delete control on purpose: a
 * wrongly-approved listing can simply be moved back, whereas a deleted
 * application cannot be recovered.
 */
export function BusinessStatusControl({ status, action }: BusinessStatusControlProps) {
  const [isPending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)

  const move = (next: BusinessStatus) => {
    setError(null)
    startTransition(async () => {
      const result = await action(next)
      if (!result.ok) setError(result.message ?? 'Could not update.')
    })
  }

  const spinner = <Loader2 size={14} className="shrink-0 animate-spin" aria-hidden="true" />

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <span className="inline-flex items-center gap-2">
        {status === 'pending' ? (
          <>
            <button
              type="button"
              onClick={() => move('approved')}
              disabled={isPending}
              className={cn(
                BUTTON,
                'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500',
              )}
            >
              {isPending ? spinner : <Check size={14} className="shrink-0" aria-hidden="true" />}
              Approve
            </button>

            <button
              type="button"
              onClick={() => move('rejected')}
              disabled={isPending}
              className={cn(
                BUTTON,
                'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 focus-visible:ring-slate-400',
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

      {error ? (
        <span role="alert" className="text-ui-xs text-red-600">
          {error}
        </span>
      ) : null}
    </span>
  )
}
