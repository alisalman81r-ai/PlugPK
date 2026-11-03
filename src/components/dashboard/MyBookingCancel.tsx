// src/components/dashboard/MyBookingCancel.tsx
'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'

import { cancelMyBooking } from '@/lib/db/host-actions'

/** Gives the slot back. The advance is the host's to refund, and it says so. */
export function MyBookingCancel({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          if (!window.confirm('Cancel this booking? Any refund of the advance is arranged with the host.')) return
          setBusy(true)
          setError(null)
          const result = await cancelMyBooking(bookingId).catch(() => ({ ok: false, message: 'Could not reach plugpk.' }))
          setBusy(false)
          if (!result.ok) setError(result.message ?? 'Could not cancel.')
          else router.refresh()
        }}
        className="text-ui-sm font-semibold text-red-600 hover:underline disabled:opacity-50"
      >
        {busy ? 'Cancelling…' : 'Cancel booking'}
      </button>
      {error ? <p role="alert" className="mt-1 text-ui-sm text-red-600">{error}</p> : null}
    </>
  )
}
