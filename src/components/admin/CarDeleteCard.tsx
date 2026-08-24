// src/components/admin/CarDeleteCard.tsx
'use client'

import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { deleteCar } from '@/lib/db/car-actions'

/**
 * Deleting a car.
 *
 * Confirmation is typing the model name, not a yes/no dialogue. A car carries a
 * public URL that may be linked from elsewhere and a row of specifications
 * somebody assembled; the cost of an accidental delete is not symmetrical with
 * the cost of a moment's extra friction, and an OK button is one stray click.
 *
 * Deliberately last in the sidebar and quiet until armed: a destructive control
 * should be findable, not prominent.
 */

export interface CarDeleteCardProps {
  carId: string
  carName: string
}

export function CarDeleteCard({ carId, carName }: CarDeleteCardProps) {
  const router = useRouter()
  const [typed, setTyped] = React.useState('')
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const armed = typed.trim().toLowerCase() === carName.trim().toLowerCase()

  async function onDelete() {
    setPending(true)
    setError(null)

    const outcome = await deleteCar(carId)

    if (!outcome.ok) {
      setPending(false)
      setError(outcome.message ?? 'Could not delete it.')
      return
    }

    // Back to the list, which is the only place left to be.
    router.push('/admin/cars')
  }

  return (
    <section className="rounded-2xl border border-red-200 bg-white p-5">
      <h2 className="flex items-center gap-2 text-ui-sm font-bold uppercase tracking-[0.1em] text-red-600">
        <AlertTriangle size={14} aria-hidden="true" />
        Delete
      </h2>

      <p className="mt-3 text-ui-sm leading-relaxed text-slate-600">
        Removes this car from the catalogue, its comparison entries and its public page at{' '}
        <code className="font-mono text-ui-xs">/cars/…</code>. Any link to that URL will 404. An
        uploaded photograph is deleted with it; a seeded one is left in the repository.
      </p>

      <label htmlFor="confirm-delete" className="mt-4 block text-ui-sm text-slate-700">
        Type <strong>{carName}</strong> to confirm
      </label>
      <input
        id="confirm-delete"
        value={typed}
        onChange={(event) => setTyped(event.target.value)}
        autoComplete="off"
        className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-ui text-slate-900 outline-none transition-shadow focus-visible:border-red-400 focus-visible:shadow-focus"
      />

      {error ? (
        <p role="alert" className="mt-2 text-ui-xs font-medium text-red-600">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onDelete}
        disabled={!armed || pending}
        className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-red-600 text-ui font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
      >
        {pending ? (
          <Loader2 size={15} className="animate-spin" aria-hidden="true" />
        ) : (
          <Trash2 size={15} aria-hidden="true" />
        )}
        {pending ? 'Deleting…' : 'Delete this car'}
      </button>
    </section>
  )
}
