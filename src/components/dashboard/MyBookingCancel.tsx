// src/components/dashboard/MyBookingCancel.tsx
'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'

import { cancelMyBooking } from '@/lib/db/host-actions'

import { abtn, ADLG, ADLG_BTNS, ADLG_H2, ADLG_P, FERR } from './dash-ui'

/**
 * Gives the slot back. The advance is the host's to refund, and the
 * confirmation says so — in the account pages' dialog (.adlg) rather than
 * window.confirm, which some in-app browsers suppress.
 */
export function MyBookingCancel({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const dialog = React.useRef<HTMLDialogElement>(null)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const titleId = `cancel-${bookingId}`

  const cancel = async () => {
    setBusy(true)
    setError(null)
    const result = await cancelMyBooking(bookingId).catch(() => ({ ok: false, message: 'Could not reach plugpk.' }))
    setBusy(false)
    dialog.current?.close()
    if (!result.ok) setError(result.message ?? 'Could not cancel.')
    else router.refresh()
  }

  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={() => dialog.current?.showModal()}
        className={abtn('line', 'sm', 'text-[#c2410c] hover:border-[#c2410c]')}
      >
        {busy ? 'Cancelling…' : 'Cancel booking'}
      </button>
      {error ? <p role="alert" className={`${FERR} mt-2`}>{error}</p> : null}

      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        data-lenis-prevent
        className={ADLG}
      >
        <h2 id={titleId} className={ADLG_H2}>
          Cancel this booking?
        </h2>
        <p className={ADLG_P}>The slot goes back to the host. Any refund of the advance is arranged with the host.</p>
        <div className={ADLG_BTNS}>
          <button type="button" onClick={() => dialog.current?.close()} disabled={busy} className={abtn('line', 'md', 'max-[640px]:w-full')}>
            Keep it
          </button>
          <button type="button" onClick={() => void cancel()} disabled={busy} className={abtn('danger', 'md', 'max-[640px]:w-full')}>
            {busy ? 'Cancelling…' : 'Cancel booking'}
          </button>
        </div>
      </dialog>
    </>
  )
}
