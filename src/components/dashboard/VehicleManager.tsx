// src/components/dashboard/VehicleManager.tsx
'use client'

import { Car, Check, Loader2, Plus, Star, Trash2 } from '@/components/ui/icons'
import * as React from 'react'

import { Button } from '@/components/ui'
import { SearchSelect } from '@/components/ui/SearchSelect'
import type { GarageCar, GarageCatalogueCar as CatalogueCar } from '@/lib/db/garage'
import { addMyCar, makePrimaryCar, removeMyCar, replaceMyCar } from '@/lib/db/garage-actions'
import { cn } from '@/lib/utils'

/**
 * The cars on the signed-in account.
 *
 * Each car is a row with its own dropdown on the right: open it, scroll (or
 * type) to another model, pick it, and that car is swapped in place. More than
 * one car is the "Add a car" button under the list; the first is primary, and
 * the primary is the one the rest of the site uses to suggest chargers.
 *
 * The old page was a text box with the catalogue as a long accordion beneath
 * it and a Save button under all of that, which read as having no way to change
 * the car at all.
 */

export interface VehicleManagerProps {
  garage: GarageCar[]
  cars: CatalogueCar[]
}

export function VehicleManager({ garage: saved, cars }: VehicleManagerProps) {
  /*
    Shown at once, saved behind it. Each change is several writes to a
    database in another region plus a page refresh — seven seconds or more —
    and a list that sat unchanged that long read as the pick not working.
    The server's list replaces this one whenever it arrives; a failed save
    puts the server's list back.
  */
  const [garage, setGarage] = React.useState(saved)
  React.useEffect(() => setGarage(saved), [saved])
  const [busy, setBusy] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [notice, setNotice] = React.useState<string | null>(null)
  const [adding, setAdding] = React.useState(saved.length === 0)

  /** Dropdown labels, unique, catalogue order: brand then model. */
  const { options, byLabel, labelOf } = React.useMemo(() => {
    const sorted = [...cars].sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model))
    const counts = new Map<string, number>()
    for (const car of sorted) counts.set(`${car.brand} ${car.model}`, (counts.get(`${car.brand} ${car.model}`) ?? 0) + 1)
    const labelOf = new Map<string, string>()
    const byLabel = new Map<string, CatalogueCar>()
    for (const car of sorted) {
      const short = `${car.brand} ${car.model}`
      const label = (counts.get(short) ?? 0) > 1 ? car.fullName : short
      labelOf.set(car.id, label)
      byLabel.set(label, car)
    }
    return { options: [...byLabel.keys()], byLabel, labelOf }
  }, [cars])

  const carById = React.useMemo(() => new Map(cars.map((car) => [car.id, car])), [cars])

  const run = async (
    key: string,
    action: () => Promise<{ ok: boolean; message?: string; id?: string }>,
    message: string,
    optimistic: (list: GarageCar[]) => GarageCar[],
  ) => {
    setBusy(key)
    setError(null)
    setNotice(null)
    setGarage((list) => optimistic(list))
    const result = await action()
    setBusy(null)
    if (!result.ok) {
      setGarage(saved)
      setError(result.message ?? 'Something went wrong. Try again.')
      return false
    }
    // The list on screen is already right; an add only needs its real id.
    // No router.refresh(): re-rendering this page re-reads the whole
    // catalogue, seconds of waiting for nothing new.
    if (result.id) setGarage((list) => list.map((r) => (r.id.startsWith('pending-') ? { ...r, id: result.id as string } : r)))
    setNotice(message)
    setTimeout(() => setNotice(null), 3000)
    return true
  }

  const specsOf = (car: CatalogueCar | undefined) =>
    car
      ? [car.category, car.range ? `${car.range} km range` : null, car.connector?.length ? car.connector.join(', ') : null]
          .filter(Boolean)
          .join(' · ')
      : 'Not in our catalogue'

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{garage.length > 1 ? 'Your vehicles' : 'Your vehicle'}</h2>
          <p className="mt-1 text-ui-sm text-slate-500">
            Used to suggest chargers that fit your connector.
            {garage.length > 1 ? ' The primary car is the one we use.' : ''}
          </p>
        </div>
        <p aria-live="polite" className="text-ui-sm font-semibold text-green-600 empty:hidden">
          {busy ? (
            <span className="inline-flex items-center gap-1.5 text-slate-500">
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
              Saving…
            </span>
          ) : notice ? (
            <span className="inline-flex items-center gap-1.5">
              <Check size={16} aria-hidden="true" />
              {notice}
            </span>
          ) : null}
        </p>
      </div>

      {error ? <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-ui-sm text-red-700">{error}</p> : null}

      <ul className="flex flex-col gap-3">
        {garage.map((row) => {
          const car = row.carId ? carById.get(row.carId) : undefined
          const label = row.carId ? labelOf.get(row.carId) : undefined
          const isBusy = busy?.startsWith(row.id) ?? false

          return (
            <li
              key={row.id}
              className={cn(
                'flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center',
                row.isPrimary ? 'border-plug-blue-200 bg-plug-blue-50/40' : 'border-slate-200',
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-plug-blue-50">
                  {isBusy ? (
                    <Loader2 size={20} className="animate-spin text-plug-blue-600" />
                  ) : (
                    <Car size={22} className="text-plug-blue-600" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-ui-lg font-semibold text-slate-900">{row.name}</span>
                    {row.isPrimary && garage.length > 1 ? (
                      <span className="rounded-full bg-plug-blue-600 px-2 py-0.5 text-ui-xs font-semibold text-white">Primary</span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 truncate text-ui-sm text-slate-500">{specsOf(car)}</p>
                  {/* Under the name rather than beside the dropdown, so every
                      row's dropdown sits in the same place. */}
                  {!row.isPrimary ? (
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() =>
                        void run(`${row.id}:primary`, () => makePrimaryCar(row.id), `${row.name} is now primary`, (list) =>
                          [...list.map((r) => ({ ...r, isPrimary: r.id === row.id }))].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary)),
                        )
                      }
                      className="-mx-1 mt-1 inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-ui-sm font-semibold text-plug-blue-600 hover:bg-plug-blue-50 disabled:opacity-50"
                    >
                      <Star size={13} aria-hidden="true" />
                      Make primary
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {/* The change control: a scrolling, searchable list of every car. */}
                <SearchSelect
                  ariaLabel={`Change ${row.name}`}
                  options={options}
                  value={label ?? ''}
                  allValue=""
                  allLabel="Change car"
                  searchPlaceholder="Type a make or model"
                  onChange={(next) => {
                    const pick = byLabel.get(next)
                    if (!pick || pick.id === row.carId) return
                    void run(`${row.id}:swap`, () => replaceMyCar(row.id, pick.id), `Changed to ${next}`, (list) =>
                      list.map((r) => (r.id === row.id ? { ...r, carId: pick.id, name: `${pick.brand} ${pick.model}` } : r)),
                    )
                  }}
                  className="min-w-0 flex-1 sm:w-64 sm:flex-none"
                />
                <button
                  type="button"
                  aria-label={`Remove ${row.name}`}
                  disabled={busy !== null}
                  onClick={() =>
                    void run(`${row.id}:remove`, () => removeMyCar(row.id), `${row.name} removed`, (list) => {
                      const rest = list.filter((r) => r.id !== row.id)
                      return row.isPrimary && rest[0] ? [{ ...rest[0], isPrimary: true }, ...rest.slice(1)] : rest
                    })
                  }
                  className="rounded-lg p-2.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  <Trash2 size={17} aria-hidden="true" />
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      {garage.length === 0 && !adding ? (
        <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-ui-sm text-slate-500">
          No car saved yet.
        </p>
      ) : null}

      {/* ── Add a car ───────────────────────────────────────────── */}
      <div className="mt-4">
        {adding ? (
          <div className="flex flex-col gap-3 rounded-xl border border-dashed border-plug-blue-300 bg-plug-blue-50/30 p-4 sm:flex-row sm:items-center">
            <p className="flex-1 text-ui-sm font-semibold text-slate-700">
              {garage.length === 0 ? 'Which car do you drive?' : 'Pick the car to add'}
            </p>
            <SearchSelect
              ariaLabel="Add a car"
              options={options.filter((option) => !garage.some((row) => row.carId && labelOf.get(row.carId) === option))}
              value=""
              allValue=""
              allLabel="Choose a car"
              searchPlaceholder="Type a make or model"
              onChange={(next) => {
                const pick = byLabel.get(next)
                if (!pick) return
                setAdding(false)
                void run('add', () => addMyCar(pick.id), `${next} added`, (list) => [
                  ...list,
                  { id: `pending-${pick.id}`, carId: pick.id, name: `${pick.brand} ${pick.model}`, isPrimary: list.length === 0 },
                ]).then((ok) => !ok && setAdding(true))
              }}
              className="w-full sm:w-72"
            />
            {garage.length > 0 ? (
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)} disabled={busy !== null}>
                Cancel
              </Button>
            ) : null}
          </div>
        ) : (
          <Button variant="secondary" onClick={() => setAdding(true)} disabled={busy !== null}>
            <Plus size={16} aria-hidden="true" />
            Add a car
          </Button>
        )}
      </div>
    </section>
  )
}
