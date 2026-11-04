// src/components/dashboard/VehicleManager.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'

import type { GarageCar, GarageCatalogueCar } from '@/lib/db/garage'
import { addMyCar, makePrimaryCar, removeMyCar, replaceMyCar } from '@/lib/db/garage-actions'
import { ThemedSelect, type ThemedSelectOption } from '@/components/ui/ThemedSelect'
import { cn } from '@/lib/utils'

import { IPlus, IStar, ITrash } from './acct-icons'
import { abtn, ErrorNote, FHINT, PANEL, PANEL_H2, PANEL_SUB } from './dash-ui'

/**
 * The cars on the signed-in account (account-vehicles.html of the design).
 *
 * "Which car do you drive?" is a dashed strip with one dropdown of every car,
 * grouped by brand: it shows the primary car, and choosing another swaps it
 * (or adds the first). Each saved car is then an ink card — its photo, its
 * powertrain, the four headline figures, and the way on to planning a route
 * or working out a charge with it.
 *
 * More than one car is the app's own addition, kept: "Add another car" opens
 * a second strip, and a car that is not primary can be made primary or
 * swapped from its card. The primary is the one the site uses to suggest
 * chargers.
 *
 * Each change shows at once and saves behind it — a save is several writes to
 * a database a region away — and the server's list puts it right if it fails.
 */

/** The catalogue, with the figures and photo the car card shows. */
export interface VehicleCatalogueCar extends GarageCatalogueCar {
  slug?: string
  image?: string | null
  batteryKwh?: number | null
  powerKw?: number | null
  powerHp?: number | null
  priceDisplay?: string | null
}

export interface VehicleManagerProps {
  garage: GarageCar[]
  cars: VehicleCatalogueCar[]
}

/** The brand-grouped options of the design's #carPick. */
function carOptions(groups: [string, VehicleCatalogueCar[]][], exclude?: Set<string>): ThemedSelectOption[] {
  return groups.flatMap(([brand, list]) =>
    (exclude ? list.filter((car) => !exclude.has(car.id)) : list).map((car) => ({
      value: car.id,
      label: `${brand} ${car.model}`,
      group: brand,
    })),
  )
}

/** The picker's trigger in the shape of the dashboard's inputs (AIN). */
const PICK = 'h-[54px] rounded-[14px] px-4 text-base font-normal disabled:cursor-wait'

export function VehicleManager({ garage: saved, cars }: VehicleManagerProps) {
  const [garage, setGarage] = React.useState(saved)
  React.useEffect(() => setGarage(saved), [saved])
  const [busy, setBusy] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [notice, setNotice] = React.useState<string | null>(null)
  const [adding, setAdding] = React.useState(false)
  const pickRef = React.useRef<HTMLDivElement>(null)
  const addRef = React.useRef<HTMLDivElement>(null)

  // The add picker takes focus as it opens, as the native one did (autoFocus).
  React.useEffect(() => {
    if (adding) addRef.current?.querySelector('button')?.focus()
  }, [adding])

  const groups = React.useMemo(() => {
    const sorted = [...cars].sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model))
    const map = new Map<string, VehicleCatalogueCar[]>()
    for (const car of sorted) map.set(car.brand, [...(map.get(car.brand) ?? []), car])
    return [...map.entries()]
  }, [cars])
  const carById = React.useMemo(() => new Map(cars.map((car) => [car.id, car])), [cars])
  const owned = React.useMemo(() => new Set(garage.map((row) => row.carId).filter(Boolean) as string[]), [garage])

  const primary = garage.find((row) => row.isPrimary) ?? garage[0]
  const many = garage.length > 1

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
    const result = await action().catch(() => ({ ok: false, message: 'We could not reach the server. Try again.' }) as { ok: boolean; message?: string; id?: string })
    setBusy(null)
    if (!result.ok) {
      setGarage(saved)
      setError(result.message ?? 'Something went wrong. Try again.')
      return false
    }
    // The list on screen is already right; an add only needs its real id.
    if (result.id) setGarage((list) => list.map((r) => (r.id.startsWith('pending-') ? { ...r, id: result.id as string } : r)))
    setNotice(message)
    setTimeout(() => setNotice(null), 4000)
    return true
  }

  const nameOf = (car: VehicleCatalogueCar) => `${car.brand} ${car.model}`

  const add = (carId: string) => {
    const pick = carById.get(carId)
    if (!pick) return
    setAdding(false)
    void run('add', () => addMyCar(pick.id), `${nameOf(pick)} added.`, (list) => [
      ...list,
      { id: `pending-${pick.id}`, carId: pick.id, name: nameOf(pick), isPrimary: list.length === 0 },
    ])
  }

  const swap = (row: GarageCar, carId: string) => {
    const pick = carById.get(carId)
    if (!pick || pick.id === row.carId) return
    void run(`${row.id}:swap`, () => replaceMyCar(row.id, pick.id), `Changed to ${nameOf(pick)}.`, (list) =>
      list.map((r) => (r.id === row.id ? { ...r, carId: pick.id, name: nameOf(pick) } : r)),
    )
  }

  const remove = (row: GarageCar) =>
    void run(`${row.id}:remove`, () => removeMyCar(row.id), `${row.name} removed.`, (list) => {
      const rest = list.filter((r) => r.id !== row.id)
      return row.isPrimary && rest[0] ? [{ ...rest[0], isPrimary: true }, ...rest.slice(1)] : rest
    })

  const makePrimary = (row: GarageCar) =>
    void run(`${row.id}:primary`, () => makePrimaryCar(row.id), `${row.name} is now your primary car.`, (list) =>
      list.map((r) => ({ ...r, isPrimary: r.id === row.id })).sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary)),
    )

  const APICK =
    'mt-[22px] flex flex-wrap items-center justify-between gap-4 rounded-[18px] border-[1.5px] border-dashed border-ink/[0.14] bg-paper px-5 py-[18px]'
  const ASEL = 'relative min-w-[240px] max-w-[420px] flex-1 max-[640px]:max-w-none'

  return (
    <section id="vehicle" className={PANEL}>
      <h2 className={PANEL_H2}>{many ? 'Your vehicles' : 'Your vehicle'}</h2>
      <p className={PANEL_SUB}>
        Used to suggest chargers that fit your connector.{many ? ' The primary car is the one we use.' : ''}
      </p>

      {/* .apick — the car you drive */}
      <div className={APICK}>
        <label htmlFor="carPick" className="text-[15px] font-semibold text-ink">
          Which car do you drive?
        </label>
        <div ref={pickRef} className={ASEL}>
          <ThemedSelect
            id="carPick"
            value={primary?.carId ?? ''}
            placeholder="Choose a car"
            disabled={busy !== null}
            onChange={(id) => {
              if (!id) return
              if (primary) swap(primary, id)
              else add(id)
            }}
            className={PICK}
            wrapperClassName="w-full"
            options={carOptions(groups)}
          />
        </div>
      </div>

      {error ? <ErrorNote className="mt-4">{error}</ErrorNote> : null}

      {garage.map((row) => {
        const car = row.carId ? carById.get(row.carId) : undefined
        const isBusy = busy?.startsWith(row.id) ?? false
        const power = car?.powerKw ? `${car.powerKw} kW` : car?.powerHp ? `${car.powerHp} hp` : '—'
        const routeHref = row.carId ? `/routes?car=${encodeURIComponent(row.carId)}` : '/routes'
        const calcHref = car?.slug ? `/charging-calculator?car=${encodeURIComponent(car.slug)}` : '/charging-calculator'

        return (
          <article
            key={row.id}
            aria-busy={isBusy || undefined}
            className={cn(
              'mt-[18px] grid grid-cols-[minmax(0,320px)_minmax(0,1fr)] items-center gap-6 rounded-[20px] bg-ink p-[18px] text-white transition-opacity max-[760px]:grid-cols-1',
              isBusy && 'opacity-70',
            )}
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[14px] bg-[#1c1f24]">
              {car?.image ? (
                <Image src={car.image} alt="" fill sizes="(max-width: 760px) 92vw, 320px" className="object-cover" />
              ) : (
                <span className="absolute inset-0 grid place-items-center font-display text-[28px] text-white/20">{car?.brand ?? row.name}</span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {car?.category ? (
                  <span className="inline-flex h-[26px] items-center rounded-full bg-volt px-2.5 font-mono text-xs font-semibold text-ink">{car.category}</span>
                ) : null}
                {row.isPrimary && many ? (
                  <span className="inline-flex h-[26px] items-center rounded-full border border-white/25 px-2.5 font-mono text-xs font-semibold text-white">Primary</span>
                ) : null}
              </div>
              <h3 className="mt-2.5 font-display text-[30px] font-normal leading-[1.1]">{row.name}</h3>
              {!car ? <p className="mt-1 text-sm text-fog">Not in our catalogue</p> : null}

              <dl className="mt-[18px] grid grid-cols-4 gap-3 max-[760px]:grid-cols-2">
                {[
                  { dt: 'Battery', dd: car?.batteryKwh ? `${car.batteryKwh} kWh` : '—', mono: true },
                  { dt: 'Range', dd: car?.range ? `${car.range} km` : '—', mono: true },
                  { dt: 'Power', dd: power, mono: true },
                  { dt: 'Price', dd: car?.priceDisplay || '—', mono: false },
                ].map((spec) => (
                  <div key={spec.dt}>
                    <dt className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-fog">{spec.dt}</dt>
                    <dd className={cn('mt-1.5 text-lg font-semibold', spec.mono && 'font-mono tracking-[-0.01em] tabular-nums')}>{spec.dd}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link href={routeHref} className={abtn('volt', 'sm')}>
                  <span>Plan a route with it</span>
                </Link>
                <Link href={calcHref} className={abtn('lineDark', 'sm')}>
                  <span>Charging calculator</span>
                </Link>
                {!row.isPrimary ? (
                  <>
                    <button type="button" disabled={busy !== null} onClick={() => makePrimary(row)} className={abtn('lineDark', 'sm')}>
                      <IStar />
                      <span>Make primary</span>
                    </button>
                    <ThemedSelect
                      tone="dark"
                      aria-label={`Change ${row.name}`}
                      value=""
                      placeholder="Change car"
                      disabled={busy !== null}
                      onChange={(id) => swap(row, id)}
                      className="h-[42px] border border-white/25 bg-transparent font-semibold hover:border-volt disabled:opacity-45 [&>span]:text-white"
                      options={carOptions(groups, owned)}
                    />
                  </>
                ) : null}
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => {
                    remove(row)
                    pickRef.current?.querySelector('button')?.focus()
                  }}
                  aria-label={`Remove ${row.name}`}
                  className={abtn('plainDark', 'sm')}
                >
                  <ITrash />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </article>
        )
      })}

      {/* More than one car: the app's own addition, in the design's strip. */}
      {garage.length > 0 ? (
        adding ? (
          <div className={APICK}>
            <label htmlFor="carAdd" className="text-[15px] font-semibold text-ink">
              Add another car
            </label>
            <div className="flex min-w-[240px] max-w-[520px] flex-1 items-center gap-2 max-[640px]:max-w-none">
              <div ref={addRef} className="relative flex-1">
                <ThemedSelect
                  id="carAdd"
                  value=""
                  placeholder="Choose a car"
                  disabled={busy !== null}
                  onChange={(id) => add(id)}
                  className={PICK}
                  wrapperClassName="w-full"
                  options={carOptions(groups, owned)}
                />
              </div>
              <button type="button" onClick={() => setAdding(false)} className={abtn('line', 'sm')}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button type="button" disabled={busy !== null} onClick={() => setAdding(true)} className={abtn('line', 'sm', 'mt-[18px]')}>
            <IPlus />
            <span>Add another car</span>
          </button>
        )
      ) : null}

      <p aria-live="polite" className={cn(FHINT, 'mt-3.5', notice && 'text-[#12804a]')}>
        {busy ? 'Saving…' : notice ?? 'Saved to your account as soon as you choose.'}
      </p>
    </section>
  )
}
