// src/components/admin/ServiceReviewControl.tsx
'use client'

import { Loader2 } from '@/components/ui/icons'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { reviewServiceApplication } from '@/lib/db/service-application-actions'
import { cn } from '@/lib/utils'
import { isInPakistan } from '@/lib/validate'

import { useAdminToast } from './AdminToast'
import { Ico, NOTE_BOX, NOTE_TEXTAREA, btnClass } from './network-kit'
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
      <span className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          disabled={pending || !placeable}
          onClick={() => review('approved')}
          aria-label={`Approve ${name}`}
          title={placeable ? undefined : 'Fix the coordinates before approving'}
          className={btnClass('ink', 'sm')}
        >
          {pending && !rejecting ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Ico name="okc" />}
          Approve
        </button>

        <button
          type="button"
          disabled={pending}
          onClick={() => setRejecting((value) => !value)}
          aria-expanded={rejecting}
          aria-label={`Reject ${name}`}
          className={cn(btnClass('line', 'sm'), 'hover:border-[#e2a48c] hover:text-[#b23b0d]', rejecting && 'border-[#e2a48c] text-[#b23b0d]')}
        >
          <Ico name="x" />
          Reject
        </button>
      </span>

      {!placeable ? (
        <span className="inline-flex max-w-xs items-start gap-1.5 text-right text-xs leading-snug text-[#8a5a00] [&_svg]:h-[14px] [&_svg]:w-[14px]">
          <Ico name="alert" className="mt-px" />
          <span>
            {lat === 0 && lng === 0 ? 'No coordinates' : 'Coordinates are outside Pakistan'} — it would not appear in
            the right place.{' '}
            <Link href={`/admin/services/${id}`} className="font-semibold text-[#8a5a00] underline">
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
          className={cn(NOTE_BOX, 'w-80')}
        >
          <label htmlFor={`reject-${id}`} className="block text-[13px] font-medium text-ink">
            Reason <span className="font-normal text-muted">(stored with the application)</span>
          </label>
          <textarea
            id={`reject-${id}`}
            value={note}
            onChange={(event) => setNote(event.target.value.slice(0, NOTE_MAX))}
            rows={2}
            maxLength={NOTE_MAX}
            autoFocus
            className={NOTE_TEXTAREA}
          />
          <div className="mt-2.5 flex justify-end gap-1.5">
            <button type="button" onClick={() => setRejecting(false)} className={btnClass('line', 'sm')}>
              Cancel
            </button>
            <button type="submit" disabled={pending} className={btnClass('danger', 'sm')}>
              {pending ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : null}
              Reject application
            </button>
          </div>
        </form>
      ) : null}

      {error ? (
        <span role="alert" className="text-xs text-[#c2410c]">
          {error}
        </span>
      ) : null}
    </span>
  )
}
