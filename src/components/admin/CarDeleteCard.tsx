// src/components/admin/CarDeleteCard.tsx
'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'

import { deleteCar } from '@/lib/db/car-actions'

import { useAdminToast } from './AdminToast'
import { Ico, Spinner, k, rise, s } from './people/kit'
import { runAction } from './run-action'

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
  const toast = useAdminToast()

  const armed = typed.trim().toLowerCase() === carName.trim().toLowerCase()

  async function onDelete() {
    setPending(true)
    setError(null)

    const outcome = await runAction(() => deleteCar(carId))

    if (!outcome.ok) {
      setPending(false)
      setError(outcome.message ?? 'Could not delete it.')
      return
    }

    toast.success(outcome.message ?? 'Car deleted.')
    // Back to the list, which is the only place left to be.
    router.push('/admin/cars')
    router.refresh()
  }

  const r = rise(4)

  return (
    <section className={k('card', 'panel', 'danger', r.className)} style={r.style}>
      <h2>
        <Ico n="trash" />
        Delete this car
      </h2>

      <p>
        Removes this car from the catalogue, its comparison entries and its public page at{' '}
        <code className={s.mono}>/cars/…</code>. Any link to that URL will 404. An uploaded photograph is deleted with it;
        a seeded one is left in the repository.
      </p>

      <div className={s.fld} style={{ marginTop: 16 }}>
        <label htmlFor="confirm-delete">
          <span>
            Type <b>{carName}</b> to confirm
          </span>
        </label>
        <input
          id="confirm-delete"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          className={s.in}
        />
      </div>

      {error ? (
        <p role="alert" className={s.ferr} style={{ marginTop: 10 }}>
          {error}
        </p>
      ) : null}

      <div className={s.panel__acts}>
        <button type="button" onClick={onDelete} disabled={!armed || pending} className={k('btn', 'btn--danger')}>
          {pending ? <Spinner /> : <Ico n="trash" />}
          {pending ? 'Deleting…' : 'Delete this car'}
        </button>
      </div>
    </section>
  )
}
