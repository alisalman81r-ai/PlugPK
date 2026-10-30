// src/components/cars/CarDetails.tsx
import {
  Banknote,
  BatteryCharging,
  Car as CarIcon,
  ChevronRight,
  Flame,
  Gauge,
  type IconType,
  Maximize2,
  PlugZap,
  Plus,
  Route,
  Store,
  Tag,
  Timer,
  Users,
  Zap,
} from '@/components/ui/icons'
import Link from 'next/link'
import * as React from 'react'

import { PhotoFrame } from '@/components/ui'
import type { Car, CarCategory } from '@/data/cars'
import { getImageCredit } from '@/data/carImageCredits'
import {
  carDisplayName,
  carModelName,
  carSummary,
  driveLabel,
  electricDistance,
  electricDistanceMax,
  formatSpan,
  getSimilarCars,
  specGroups,
} from '@/lib/cars'
import { cn } from '@/lib/utils'

import { CarCard } from './CarCard'

/**
 * One car, in full.
 *
 * A server component: nothing here is interactive.
 *
 * ── The layout ────────────────────────────────────────────────────────
 *
 * A showroom page: the name and a paragraph about the car, then one grey panel
 * with the car large on the left and, beside it, the trim, the price and the
 * four figures a buyer asks about first. Under it, every published figure in
 * grouped two-column sheets, and similar cars as the same cards the catalogue
 * uses.
 *
 * Every figure is rendered only when it exists. Most of these cars were
 * published with a price, a battery and little else, and a sheet padded with
 * "—" reads as a car with no torque rather than a figure nobody stated. The
 * paragraph and the four headline figures follow the same rule: they are
 * built from what the row holds, and a sparse row gets fewer of them.
 */

export interface CarDetailsProps {
  car: Car
  /**
   * The live catalogue, for the similar-cars row. Passed in rather than
   * imported, so it is the set the rest of the page is built from.
   */
  pool: Car[]
}

const CATEGORY_NAME: Record<CarCategory, string> = {
  EV: 'EV',
  PHEV: 'PHEV',
  REEV: 'REEV',
  Hybrid: 'Hybrid',
}

/** An icon for each spec group, by its title in specGroups(). */
const GROUP_ICON: Record<string, IconType> = {
  'Basic information': CarIcon,
  'Battery & performance': BatteryCharging,
  Engine: Flame,
  'Range extender': Flame,
  'Range & efficiency': Route,
  Charging: PlugZap,
  Dimensions: Maximize2,
  'Pakistan market': Tag,
}

interface Stat {
  icon: IconType
  value: string
  unit: string
  caption: string
}

/**
 * The four headline figures, in the order a buyer asks: power, pace, battery,
 * range. Where one is missing the next published figure takes its place, so a
 * car never shows an empty tile.
 */
function headlineStats(car: Car): Stat[] {
  const reach = formatSpan(electricDistance(car), electricDistanceMax(car), '')?.trim()
  const candidates: Array<Stat | null> = [
    car.power ? { icon: Zap, value: String(car.power), unit: 'hp', caption: driveLabel(car) ?? 'Power' } : null,
    car.acceleration
      ? { icon: Timer, value: String(car.acceleration), unit: car.accelerationUnit, caption: '0–100 km/h' }
      : null,
    car.batteryCapacity
      ? { icon: BatteryCharging, value: String(car.batteryCapacity), unit: 'kWh', caption: 'Battery capacity' }
      : null,
    reach && car.category !== 'Hybrid'
      ? {
          icon: Route,
          value: reach,
          unit: 'km',
          caption: `${car.category === 'EV' ? 'Range' : 'Electric range'}${car.rangeStandard ? ` (${car.rangeStandard})` : ''}`,
        }
      : null,
    car.dcCharging ? { icon: PlugZap, value: String(car.dcCharging), unit: 'kW', caption: 'Max DC charging' } : null,
    car.topSpeed ? { icon: Gauge, value: String(car.topSpeed), unit: 'km/h', caption: 'Top speed' } : null,
    car.seats ? { icon: Users, value: String(car.seats), unit: '', caption: 'Seats' } : null,
  ]
  return candidates.filter((stat): stat is Stat => stat !== null).slice(0, 4)
}

/**
 * The price for the panel, and the word over it.
 *
 * A single published price is printed in full rupees, as a buyer is quoted it;
 * a span keeps the published wording. A qualifier — "ex-factory",
 * "indicative" — becomes the label rather than trailing the figure.
 */
function panelPrice(car: Car): { label: string; amount: string } {
  const match = /^(.*?)\s*\(([^)]+)\)\s*$/.exec(car.price.display)
  const qualifier = match?.[2]?.trim()
  const label = qualifier ?? (car.price.min !== car.price.max ? 'Price range' : 'Price')
  const amount =
    car.price.min === car.price.max
      ? `PKR ${car.price.min.toLocaleString('en-US')}`
      : (match?.[1]?.trim() ?? car.price.display)
  return { label, amount }
}

export function CarDetails({ car, pool }: CarDetailsProps) {
  const groups = specGroups(car)
  const similar = getSimilarCars(car, pool)
  const credit = car.image ? getImageCredit(car.id) : undefined
  const stats = headlineStats(car)
  const price = panelPrice(car)
  const name = carDisplayName(car)

  const compareHref = `/cars/compare?ids=${[car.id, similar[0]?.id].filter(Boolean).join(',')}`

  /*
    The buyer's next steps, each linked only where the destination can use it.
    The calculator takes any plug-in with a published battery; the route planner
    only battery-electric cars with both a range and a battery, since a plug-in
    can refuel and a charging-stop plan would be wrong for it.
  */
  const canCalculate = car.category !== 'Hybrid' && Boolean(car.batteryCapacity && car.batteryCapacity > 0)
  const canPlan =
    car.category === 'EV' &&
    Boolean(car.range && car.range > 0) &&
    Boolean(car.batteryCapacity && car.batteryCapacity > 0)
  const actions = [
    canCalculate
      ? { href: `/charging-calculator?car=${encodeURIComponent(car.slug)}`, icon: Banknote, label: 'Cost to charge' }
      : null,
    canPlan ? { href: `/routes?car=${encodeURIComponent(car.slug)}`, icon: Route, label: 'Plan a trip' } : null,
    { href: '/services/dealership', icon: Store, label: 'Find a dealer' },
  ].filter((action): action is { href: string; icon: IconType; label: string } => action !== null)

  return (
    <div>
      {/* ── Breadcrumb ──────────────────────────────────────────── */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1.5 text-ui-sm text-slate-500">
          <li>
            <Link href="/cars" className="font-medium transition-colors hover:text-slate-900">
              Cars
            </Link>
          </li>
          <ChevronRight size={13} aria-hidden="true" className="shrink-0" />
          <li>
            <Link
              href={`/cars?brand=${encodeURIComponent(car.brand)}`}
              className="font-medium transition-colors hover:text-slate-900"
            >
              {car.brand}
            </Link>
          </li>
          <ChevronRight size={13} aria-hidden="true" className="shrink-0" />
          <li aria-current="page" className="font-semibold text-slate-900">
            {carModelName(car)}
          </li>
        </ol>
      </nav>

      {/* ── Name and introduction ───────────────────────────────── */}
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <Link
              href={`/cars?brand=${encodeURIComponent(car.brand)}`}
              className="text-ui-sm font-extrabold uppercase tracking-[0.14em] text-slate-900 underline decoration-2 underline-offset-[6px] transition-colors hover:text-plug-cyan-700"
            >
              {car.brand}
            </Link>
            <span className="rounded-full border-[1.5px] border-slate-900 px-2.5 py-0.5 text-ui-xs font-bold leading-tight text-slate-900">
              {CATEGORY_NAME[car.category]}
            </span>
          </div>

          {/* The trim lives inside the h1, on its own smaller line: the heading
              is the page's one statement of which car this is, and a crawler
              and a screen reader both read it as one string. */}
          <h1 className="mt-3 font-display text-[clamp(2.5rem,6vw,4.25rem)] font-black leading-[1.02] tracking-[-0.04em] text-dark-base">
            {car.model}
            {car.variant ? (
              <span className="mt-2 block text-[clamp(1.0625rem,1.8vw,1.375rem)] font-bold leading-snug tracking-[-0.01em] text-slate-500">
                {car.variant}
              </span>
            ) : null}
          </h1>
        </div>

        <Link
          href={compareHref}
          aria-label={`Compare ${carModelName(car)}${similar[0] ? ` with ${carModelName(similar[0])}` : ''}`}
          className="inline-flex h-12 shrink-0 items-center gap-2 self-start rounded-full bg-dark-base px-6 text-ui font-bold text-white transition-colors hover:bg-plug-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
        >
          <Plus size={18} aria-hidden="true" />
          Compare
        </Link>
      </header>

      <p className="mt-5 max-w-4xl text-ui-lg leading-[1.75] text-slate-700">{carSummary(car)}</p>

      {/* ── The panel ───────────────────────────────────────────────
          The car on the left on a lit stage; the trim, price and headline
          figures on the right. Stacked on a phone, car first. */}
      <div className="mt-8 grid gap-2 rounded-[2rem] bg-slate-100 p-2 sm:p-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-4">
        {/* The stage. The cut-out is multiplied into a soft radial light, so its
            white ground becomes the light itself and the car stands in it. */}
        <div className="relative aspect-[16/11] overflow-hidden rounded-[1.5rem] bg-[radial-gradient(75%_70%_at_50%_42%,#FFFFFF_0%,#F3F6F5_55%,#E4EAE8_100%)] lg:aspect-auto lg:min-h-[28rem]">
          {car.image ? (
            <div className="absolute inset-x-[6%] inset-y-[8%]">
              <PhotoFrame
                src={car.image}
                alt={name}
                sizes="(max-width: 1024px) 100vw, 760px"
                priority
                className="bg-transparent"
                imageClassName="object-contain mix-blend-multiply"
              />
            </div>
          ) : (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <span aria-hidden="true" className="font-display text-5xl font-black tracking-tight text-slate-300">
                {car.brand}
              </span>
              <span className="text-ui-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                No photograph yet
              </span>
            </span>
          )}
        </div>

        <div className="flex flex-col p-4 sm:p-6 lg:py-8 lg:pl-4 lg:pr-8">
          {/* The trim names the figures below, so it heads them — only when the
              row declares one; otherwise the h1 above has already said it. */}
          {car.variant ? (
            <p className="mb-4 font-display text-[1.5rem] font-extrabold leading-tight tracking-[-0.02em] text-dark-base">
              {car.variant}
            </p>
          ) : null}
          <div>
            <p className="text-ui-xs font-bold uppercase tracking-[0.16em] text-slate-500">{price.label}</p>
            <p className="mt-2 flex flex-wrap items-baseline gap-x-1.5 font-display leading-none">
              <span className="text-ui font-bold text-slate-400">PKR</span>
              <span className="text-[clamp(1.875rem,3.2vw,2.5rem)] font-black tabular-nums tracking-[-0.03em] text-slate-900">
                {price.amount.replace(/^PKR\s*/, '')}
              </span>
            </p>
          </div>

          {stats.length > 0 ? (
            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 lg:mt-10">
              {stats.map((stat) => {
                const Icon = stat.icon
                return (
                  // The caption is the term and comes first in the DOM, as a
                  // definition list needs; `order` sets the figure above it.
                  <div key={stat.caption} className="flex flex-col">
                    <dt className="order-2 mt-2 text-ui-sm text-slate-600">{stat.caption}</dt>
                    <dd className="order-1">
                      <Icon size={24} aria-hidden="true" className="text-slate-500" />
                      <span className="mt-3 flex items-baseline gap-1 font-display leading-none">
                        <span className="text-[clamp(2rem,3.4vw,2.625rem)] font-black tabular-nums tracking-[-0.035em] text-plug-cyan-700">
                          {stat.value}
                        </span>
                        {stat.unit ? <span className="text-ui-lg font-bold text-slate-400">{stat.unit}</span> : null}
                      </span>
                    </dd>
                  </div>
                )
              })}
            </dl>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-2 pt-2 lg:mt-auto">
            {actions.map((action, index) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className={cn(
                    'inline-flex h-11 items-center gap-2 rounded-full px-5 text-ui-sm font-bold transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2',
                    index === 0
                      ? 'bg-plug-cyan-500 text-plug-navy-950 hover:bg-plug-cyan-400'
                      : 'border border-slate-300 bg-white text-slate-800 hover:border-slate-900',
                  )}
                >
                  <Icon size={16} aria-hidden="true" />
                  {action.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* The photographer, named on the page: most of these are CC BY-SA, which
          requires attribution wherever the image appears. */}
      {credit ? (
        <p className="px-2 pt-3 text-ui-xs leading-relaxed text-slate-500">
          Photo: {credit.author} ·{' '}
          {credit.licenceUrl ? (
            <a href={credit.licenceUrl} rel="noopener noreferrer nofollow" target="_blank" className="underline hover:text-slate-600">
              {credit.licence}
            </a>
          ) : (
            credit.licence
          )}{' '}
          ·{' '}
          <a href={credit.source} rel="noopener noreferrer nofollow" target="_blank" className="underline hover:text-slate-600">
            Wikimedia Commons
          </a>
          {credit.changes ? <> · {credit.changes}</> : null}
        </p>
      ) : null}

      {/* ── Every published figure ─────────────────────────────────
          Grouped, so the charging figures sit together and a reader can find
          them without scanning everything; an empty group is dropped, so a PHEV
          shows an Engine sheet where an EV shows none. */}
      <section id="specifications" className="mt-14 scroll-mt-24 lg:mt-16">
        <h2 className="font-display text-[clamp(1.625rem,3vw,2.125rem)] font-black leading-tight tracking-[-0.03em] text-slate-900">
          {name} specs and range
        </h2>
        <p className="mt-2 text-ui text-slate-600">
          {car.variant ? `Full figures for the ${car.variant} variant, as published.` : 'Full figures, as published.'}{' '}
          Anything absent was not stated by the manufacturer or importer — Plug.pk does not estimate specifications.
        </p>

        <div className="mt-6 flex flex-col gap-4">
          {groups.map((group) => {
            const Icon = GROUP_ICON[group.title] ?? CarIcon
            return (
              <div key={group.title} className="rounded-[1.5rem] bg-slate-100 px-5 py-5 sm:px-7 sm:py-6">
                <h3 className="flex items-center gap-2.5 font-display text-[1.25rem] font-extrabold tracking-[-0.02em] text-slate-900">
                  <Icon size={20} aria-hidden="true" className="text-slate-500" />
                  {group.title}
                </h3>
                <dl className="mt-3 grid gap-x-12 sm:grid-cols-2">
                  {group.rows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-baseline justify-between gap-6 border-t border-slate-300/60 py-3.5"
                    >
                      <dt className="text-ui text-slate-600">{row.label}</dt>
                      <dd className="text-right text-ui font-bold text-slate-900">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )
          })}
        </div>

        {/* The research trail — which source said what, where two disagreed.
            Worth keeping for anyone checking the numbers, behind a disclosure
            because it is not what a buyer came to read. */}
        {car.notes ? (
          <details className="group mt-4 rounded-[1.5rem] bg-slate-100">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-ui font-bold text-slate-900 sm:px-7 [&::-webkit-details-marker]:hidden">
              Data notes
              <span className="text-ui-sm font-medium text-slate-500">
                <span className="group-open:hidden">Where these figures came from</span>
                <span className="hidden group-open:inline">Hide</span>
              </span>
            </summary>
            <p className="border-t border-slate-300/60 px-5 py-4 text-ui-sm leading-relaxed text-slate-600 sm:px-7">
              {car.notes}
            </p>
          </details>
        ) : null}
      </section>

      {/* ── Similar cars ────────────────────────────────────────────
          The same cards as the catalogue, so a buyer moves between them
          without learning a second layout. */}
      {similar.length > 0 ? (
        <section className="mt-16">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-display text-[clamp(1.625rem,3vw,2.125rem)] font-black tracking-[-0.03em] text-slate-900">
              Similar cars
            </h2>
            <Link href="/cars" className="text-ui-sm font-bold text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline">
              See all cars
            </Link>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {similar.map((other) => (
              <CarCard key={other.id} car={other} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
