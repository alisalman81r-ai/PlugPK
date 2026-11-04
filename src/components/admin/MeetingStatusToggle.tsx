// src/components/admin/MeetingStatusToggle.tsx
'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'

import { useAdminToast } from './AdminToast'
import { Ico, Spinner, k, s } from './people/kit'
import { runAction } from './run-action'

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
  const router = useRouter()
  const toast = useAdminToast()
  const [isPending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)

  const toggle = () => {
    setError(null)
    startTransition(async () => {
      const result = await runAction(() => action(isHandled ? 'new' : 'handled'))
      if (!result.ok) {
        setError(result.message ?? 'Could not update.')
        return
      }
      toast.success(isHandled ? 'Reopened.' : 'Marked handled.')
      router.refresh()
    })
  }

  return (
    <span className={s.colend}>
      <button type="button" onClick={toggle} disabled={isPending} className={k('btn', 'btn--sm', isHandled ? 'btn--line' : 'btn--ink')}>
        {isPending ? <Spinner /> : <Ico n={isHandled ? 'undo' : 'okc'} />}
        {isHandled ? 'Reopen' : 'Mark handled'}
      </button>

      {error ? (
        <span role="alert" className={s.errline}>
          {error}
        </span>
      ) : null}
    </span>
  )
}
