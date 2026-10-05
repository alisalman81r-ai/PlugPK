// src/components/admin/ServiceReviewControl.tsx
'use client'

import { AlertTriangle, Check, Loader2, X } from '@/components/ui/icons'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { reviewServiceApplication } from '@/lib/db/service-application-actions'
import { cn } from '@/lib/utils'
import { isInPakistan } from '@/lib/validate'

import { useAdminToast } from './AdminToast'
import { runAction } from './run-action'

const NOTE_MAX = 500

/**
 * Approve or reject one service application.
 *
 * Approving publishes the listing, so it is a real button with the word on it
 * rather than a tick icon — an operator should never approve something
 * because they guessed what a glyph did.
 *
 * Approve is disabled while the application's coordinates are 0,0 or outside
 * Pakistan. The public form can leave them unset, and approving such a row
 * published a pin in the Gulf of Guinea; the warning links to the edit form
 * where the position can be fixed first.
 *
 * Rejecting opens a short note, which is stored with the application so the
 * next person to look knows why. It is optional here — unlike a business, a
 * service rejection is usually self-evident (spam, wrong category) — but the
 * field is there and the reason travels with the row.
 *
 * The server action re-checks the admin session itself. This component is only
 * the trigger; it cannot be trusted, and it does not need to be.
 */
export function ServiceReviewControl({
  id,
  name,
  lat,
  lng,
}: {
  id: string
  name: string
  lat: number
  lng: number
}) {
  const router = useRouter()
  const toast = useAdminToast()
  const [pending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)
  const [rejecting, setRejecting] = React.useState(false)
  const [note, setNote] = React.useState('')

  const placeable = isInPakistan(lat, lng) && !(lat === 0 && lng === 0)

  function review(status: 'approved' | 'rejected') {
    setError(null)
    startTransition(async () => {
      const result = await runAction(() =>
        reviewServiceApplication(id, status, status === 'rejected' ? note.trim() || null : null),
      )
      if (!result.ok) {
        setError(result.message ?? 'That did not work.')
        return
      }
      toast.success(status === 'approved' ? `${name} approved — now in the directory.` : `${name} rejected.`)
      router.refresh()
    })
  }

  return (
    <span className="flex flex-col items-end gap-1.5">
      <span className="flex items-center justify-end gap-1.5">
        <button
          type="button"
          disabled={pending || !placeable}
          onClick={() => review('approved')}
          aria-label={`Approve ${name}`}
          title={placeable ? undefined : 'Fix the coordinates before approving'}
          className={cn(
            'inline-flex h-9 items-center gap-1.5 rounded-lg bg-plug-blue-600 px-3 text-ui-sm font-semibold text-white',
            'transition-colors hover:bg-plug-blue-700 disabled:cursor-not-allowed disabled:opacity-50',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2',
          )}
        >
          {pending && !rejecting ? (
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          ) : (
            <Check size={14} aria-hidden="true" />
          )}
          Approve
        </button>

        <button
          type="button"
          disabled={pending}
          onClick={() => setRejecting((value) => !value)}
          aria-expanded={rejecting}
          aria-label={`Reject ${name}`}
          className={cn(
            'inline-flex h-9 items-center gap-1.5 rounded-lg border-[1.5px] px-3 text-ui-sm font-semibold',
            rejecting ? 'border-red-300 bg-red-50 text-red-700' : 'border-slate-300 text-slate-700',
            'transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700',
            'disabled:cursor-not-allowed disabled:opacity-60',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2',
          )}
        >
          <X size={14} aria-hidden="true" />
          Reject
        </button>
      </span>

      {!placeable ? (
        <span className="inline-flex max-w-xs items-start gap-1.5 text-right text-ui-xs text-amber-800">
          <AlertTriangle size={13} className="mt-px shrink-0" aria-hidden="true" />
          <span>
            {lat === 0 && lng === 0 ? 'No coordinates' : 'Coordinates are outside Pakistan'} — it would not appear in
            the right place.{' '}
            <Link href={`/admin/services/${id}`} className="font-semibold underline">
              Fix the location
            </Link>{' '}
            to approve.
          </span>
        </span>
      ) : null}

      {rejecting ? (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            review('rejected')
          }}
          className="w-72 max-w-full rounded-lg border border-red-200 bg-red-50/60 p-3"
        >
          <label htmlFor={`reject-${id}`} className="block text-ui-xs font-semibold text-red-900">
            Reason <span className="font-normal text-red-900/60">(stored with the application)</span>
          </label>
          <textarea
            id={`reject-${id}`}
            value={note}
            onChange={(event) => setNote(event.target.value.slice(0, NOTE_MAX))}
            rows={2}
            maxLength={NOTE_MAX}
            autoFocus
            className="mt-1.5 w-full resize-y rounded-md border border-red-200 bg-white p-2 text-ui-sm text-slate-900 outline-none focus-visible:border-red-400"
          />
          <div className="mt-2 flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setRejecting(false)}
              className="h-8 rounded-md px-2.5 text-ui-xs font-medium text-slate-600 hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-8 items-center gap-1 rounded-md bg-red-600 px-3 text-ui-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {pending ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : null}
              Reject application
            </button>
          </div>
        </form>
      ) : null}

      {error ? <span role="alert" className="text-ui-xs text-red-600">{error}</span> : null}
    </span>
  )
}
