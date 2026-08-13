// src/components/admin/MeetingStatusToggle.tsx
'use client'

import { Check, Loader2, Undo2 } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'

export interface MeetingStatusToggleProps {
  isHandled: boolean
  action: (next: 'new' | 'handled') => Promise<{ ok: boolean; message?: string }>
}

/**
 * Marks a request handled, and back again.
 *
 * Reversible on purpose, and with no confirmation step: mis-marking one is a
 * mistake an operator should be able to undo in a click, unlike deleting it.
 */
export function MeetingStatusToggle({ isHandled, action }: MeetingStatusToggleProps) {
  const [isPending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)

  const toggle = () => {
    setError(null)
    startTransition(async () => {
      const result = await action(isHandled ? 'new' : 'handled')
      if (!result.ok) setError(result.message ?? 'Could not update.')
    })
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={isPending}
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-ui-sm font-semibold transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60',
          isHandled
            ? 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 focus-visible:ring-slate-400'
            : 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500',
        )}
      >
        {isPending ? (
          <Loader2 size={14} className="shrink-0 animate-spin" aria-hidden="true" />
        ) : isHandled ? (
          <Undo2 size={14} className="shrink-0" aria-hidden="true" />
        ) : (
          <Check size={14} className="shrink-0" aria-hidden="true" />
        )}
        {isHandled ? 'Reopen' : 'Mark handled'}
      </button>

      {error ? (
        <span role="alert" className="text-ui-xs text-red-600">
          {error}
        </span>
      ) : null}
    </span>
  )
}
