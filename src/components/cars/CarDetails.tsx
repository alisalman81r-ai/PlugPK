// src/components/cars/CarDetails.tsx
import {
  BatteryCharging,
  ChevronRight,
  Fuel,
  Gauge,
  Plug,
  Route,
  Timer,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

import { CAP_RULE, FACE, FRAME } from '@/components/shared/frame'
import { AnimatedIcon, Badge, HoverMotion, PhotoFrame, PillButton, type BadgeVariant } from '@/components/ui'
import type { Car, CarCategory } from '@/data/cars'
import { getImageCredit } from '@/data/carImageCredits'
import { getSimilarCars, specGroups } from '@/lib/cars'
import { cn } from '@/lib/utils'

import { SpecificationTable } from './SpecificationTable'

/**
 * One car, in full.
 *
 * A server component: nothing here is interactive, so there is no reason to ship
 * it to the browser. The compare button lives on the listing page, where the
 * tray that collects selections already is.
 *
 * Every figure is rendered only when it exists. That is not defensive coding —
 * it is the point. Most of these cars were published with a price, a battery and
 * little else, and a spec sheet padded with "—" reads as a car with no torque
 * rather than a figure nobody stated.
 */

export interface CarDetailsProps {
  car: Car
  /**
   * The catalogue this car is being compared against, for the similar-cars
   * rail at the foot of the page.
   *
   * Passed in rather than imported. The rows live in the database now, and a
   * component that reached for the seed module itself would show a rail built
   * from a set the rest of the page is not using — quietly recommending a car
   * that had been deleted, or missing one that was just added.
   */
  pool: Car[]
}

const CATEGORY_VARIANT: Record<CarCategory, BadgeVariant> = {
  EV: 'blue',
  PHEV: 'amber',
  REEV: 'purple',
  Hybrid: 'green',
}

const CATEGORY_BLURB: Record<CarCategory, string> = {
  EV: 'Fully electric — charges from a plug, no engine.',
  PHEV: 'Plug-in hybrid — runs on battery, then on its engine.',
  REEV: 'Range extender — driven by its motor, with an engine that only charges the battery.',
  Hybrid: 'Hybrid — engine assisted by a battery.',
}

export function CarDetails({ car, pool }: CarDetailsProps) {
  const groups = specGroups(car)
  const similar = getSimilarCars(car, pool)
  const credit = car.image ? getImageCredit(car.id) : undefined

  /**
   * The headline row, ordered by powertrain.
   *
   * An EV's story is battery → range → charging speed. A PHEV's is battery →
   * electric range → engine. Same component, different emphasis, because the
   * question a buyer is asking differs.
   */
  const span = (low: number | null, high: number | null, unit: string) =>
    low === null ? null : high ? `${low}–${high} ${unit}` : `${low} ${unit}`

  const headline: Array<{ icon: typeof Zap; label: string; value: string | null }> =
    car.category === 'EV'
      ? [
          {
            icon: BatteryCharging,
            label: 'Battery',
            value: car.batteryCapacity ? `${car.batteryCapacity} ${car.batteryUnit}` : null,
          },
          { icon: Route, label: 'Range', value: span(car.range, car.rangeMax, car.rangeUnit) },
          {
            icon: Zap,
            label: 'DC charging',
            value: car.dcCharging ? `${car.dcCharging} ${car.dcChargingUnit}` : null,
          },
          {
            icon: Plug,
            label: 'AC charging',
            value: car.acCharging ? `${car.acCharging} ${car.acChargingUnit}` : null,
          },
        ]
      : [
          {
            icon: BatteryCharging,
            label: 'Battery',
            value: car.batteryCapacity ? `${car.batteryCapacity} ${car.batteryUnit}` : null,
          },
          {
            icon: Route,
            label: 'Electric range',
            value: span(car.electricRange, car.electricRangeMax, car.rangeUnit),
          },
          {
            icon: Fuel,
            label: car.category === 'REEV' ? 'Range extender' : 'Engine',
            value: car.engineCapacity ? `${car.engineCapacity} cc` : null,
          },
          {
            icon: Gauge,
            label: 'Power',
            value: car.power ? `${car.power} ${car.powerUnit}` : null,
          },
        ]

  const present = headline.filter((item) => item.value)

  return (
    <div>
      {/* A trail rather than a back link. It names the level above and the
          category, so the page says where it sits instead of only offering a
          way out — and gives a second route in, via the powertrain. */}
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5 text-ui-sm text-slate-400">
          <li>
            <Link href="/cars" className="font-medium transition-colors hover:text-slate-900">
              Cars
            </Link>
          </li>
          <ChevronRight size={13} aria-hidden="true" className="shrink-0" />
          <li className="font-medium text-slate-600">{car.brand}</li>
          <ChevronRight size={13} aria-hidden="true" className="shrink-0" />
          <li aria-current="page" className="font-semibold text-slate-900">
            {car.model}
          </li>
        </ol>
      </nav>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
        {/* ── The car ──────────────────────────────────────────── */}
        <div>
          <div className={FRAME}>
            <div className={cn(FACE, 'overflow-hidden')}>
              <div className="relative aspect-[16/10] bg-slate-50">
                <PhotoFrame
                  src={car.image ?? undefined}
                  alt={car.fullName}
                  sizes="(max-width: 1024px) 100vw, 640px"
                  priority
                />
              </div>
            </div>
          </div>

          {/*
            The photographer, named on the page rather than only in a credits
            file. Most of these are CC BY-SA, which requires attribution
            wherever the image appears — burying it one link deep would not
            honour that, and it costs one quiet line here.
          */}
          {credit ? (
            <p className="mt-2.5 text-ui-xs leading-relaxed text-slate-400">
              Photo: {credit.author} ·{' '}
              {credit.licenceUrl ? (
                <a
                  href={credit.licenceUrl}
                  rel="noopener noreferrer nofollow"
                  target="_blank"
                  className="underline hover:text-slate-600"
                >
                  {credit.licence}
                </a>
              ) : (
                credit.licence
              )}{' '}
              ·{' '}
              <a
                href={credit.source}
                rel="noopener noreferrer nofollow"
                target="_blank"
                className="underline hover:text-slate-600"
              >
                Wikimedia Commons
              </a>
            </p>
          ) : null}

          {present.length > 0 ? (
            <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {present.map((item) => {
                const Icon = item.icon

                return (
                  <HoverMotion
                    key={item.label}
                    className="rounded-2xl border border-slate-200 bg-white p-4 transition-colors duration-300 hover:border-plug-blue-300"
                  >
                    <dt className="flex items-center gap-1.5 text-ui-xs text-slate-400">
                      <AnimatedIcon motion="pulse">
                        <Icon size={12} className="shrink-0" aria-hidden="true" />
                      </AnimatedIcon>
                      <span className="truncate">{item.label}</span>
                    </dt>
                    <dd className="mt-1.5 text-lg font-black tracking-tight text-slate-900">
                      {item.value}
                    </dd>
                  </HoverMotion>
                )
              })}
            </dl>
          ) : null}
        </div>

        {/* ── Identity and price ───────────────────────────────── */}
        <div>
          <div className="flex items-center gap-3">
            <span className="text-ui-sm font-bold uppercase tracking-[0.16em] text-plug-blue-600">
              {car.brand}
            </span>
            <Badge variant={CATEGORY_VARIANT[car.category]} size="sm">
              {car.category}
            </Badge>
          </div>

          <h1 className="mt-3 text-[clamp(2rem,4.5vw,3rem)] font-black leading-[1.05] tracking-[-0.03em] text-slate-900">
            {car.model}
          </h1>

          <p className="mt-3 text-ui leading-relaxed text-slate-500">
            {CATEGORY_BLURB[car.category]}
          </p>

          <span aria-hidden="true" className={cn('mt-6 block', CAP_RULE)} />

          <p className="mt-6 text-ui-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            Pakistan market price
          </p>
          <p className="mt-1.5 text-[clamp(1.75rem,3.5vw,2.5rem)] font-black tracking-tight text-slate-900">
            {car.price.display}
          </p>
          {car.price.min !== car.price.max ? (
            <p className="mt-1.5 text-ui-sm text-slate-500">
              Varies by variant. Confirm the on-road figure with the dealer.
            </p>
          ) : null}

          {car.acceleration ? (
            <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 px-3.5 py-1.5 text-ui-sm font-semibold text-slate-700">
              <Timer size={13} className="text-slate-400" aria-hidden="true" />
              0–100 km/h in {car.acceleration} {car.accelerationUnit}
            </p>
          ) : null}

          {car.notes ? (
            <p className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-ui-sm leading-relaxed text-slate-600">
              {car.notes}
            </p>
          ) : null}

          {/*
            The obvious next question after "can I afford it" is "where do I
            charge it", which is the rest of this site. An EV page that ends in
            a spec table ends nowhere.
          */}
          <div className="mt-8">
            <PillButton href="/map">Find charging nearby</PillButton>
          </div>

          {/*
            Blocks rather than one fourteen-row list. Grouped, the charging
            figures sit together and a reader can find them without scanning
            everything; an empty group is dropped, so a PHEV shows an Engine
            block where an EV shows none.
          */}
          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200">
            {groups.map((group, index) => (
              <div
                key={group.title}
                className={cn('px-6 py-5', index > 0 && 'border-t border-slate-200')}
              >
                <SpecificationTable rows={group.rows} title={group.title} />
              </div>
            ))}

            {/* Said once, plainly, rather than repeated as a dash on every
                missing row. */}
            <p className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-ui-xs leading-relaxed text-slate-500">
              Only published figures are listed. Anything absent was not stated by the
              manufacturer or importer — Plug.pk does not estimate specifications.
            </p>
          </div>
        </div>
      </div>

      {/*
        Where a buyer goes next. A detail page that offers only "back" makes
        the reader do the comparing; three nearby cars of the same powertrain
        does it for them. Rendered as compact rows rather than full cards so it
        reads as a suggestion, not a second catalogue.
      */}
      {similar.length > 0 ? (
        <section className="mt-16 border-t border-slate-200 pt-10">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Similar cars
            </h2>
            <Link
              href="/cars"
              className="text-ui-sm font-semibold text-plug-blue-600 transition-colors hover:text-plug-blue-800"
            >
              See all
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {similar.map((other) => (
              <HoverMotion key={other.id} className={FRAME}>
                <Link href={`/cars/${other.slug}`} className={cn(FACE, 'gap-3 p-3')}>
                  <span className="relative block aspect-[16/10] overflow-hidden rounded-xl bg-slate-50">
                    <PhotoFrame
                      src={other.image ?? undefined}
                      alt={other.fullName}
                      sizes="(max-width: 640px) 100vw, 300px"
                    />
                  </span>

                  <span className="px-1 pb-1">
                    <span className="block text-ui-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                      {other.brand}
                    </span>
                    <span className="mt-1 block truncate text-ui font-bold tracking-tight text-slate-900">
                      {other.model}
                    </span>
                    <span className="mt-1.5 block text-ui-sm font-semibold text-slate-700">
                      {other.price.display}
                    </span>
                  </span>
                </Link>
              </HoverMotion>
            ))}
          </div>

          {/* Straight into the comparison with this car already picked, which
              is the thing a reader on this page most likely wants next. */}
          <div className="mt-6 flex justify-center">
            <Link
              href={`/cars/compare?ids=${[car.id, similar[0]?.id].filter(Boolean).join(',')}`}
              className="inline-flex h-11 items-center gap-2 rounded-full border-[1.5px] border-slate-300 px-5 text-ui-sm font-semibold text-slate-700 transition-colors hover:border-slate-900"
            >
              Compare {car.model} with {similar[0]?.model}
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  )
}
