// src/components/cars/CarCollectionHero.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'

import { ArrowDown, ArrowRight, ChevronRight } from '@/components/ui/icons'
import type { Car, CarCategory } from '@/data/cars'
import { carModelName, electricDistance, formatCarPrice } from '@/lib/cars'
import { cn } from '@/lib/utils'

/**
 * The landing for one slice of the catalogue — a powertrain, a brand, or both.
 *
 * ── Why the page changes shape ────────────────────────────────────────
 *
 * The general hero asks "which car?" and offers a search box. Somebody who has
 * just tapped Electric or BYD has answered that question, and leaving the
 * general hero in place meant their choice registered as a change three hundred
 * pixels below a heading that still said "Every EV in Pakistan". The slice is
 * now the page: its own title, a line saying what it is, its extent in four
 * numbers, and the line-up standing on a stage beside it.
 *
 * Every number here comes from the rows in scope. Nothing is a sales line —
 * "longest range" is the largest published range, not a claim about anybody's
 * commute — so the hero says the same thing the grid below it does.
 *
 * ── The stage ─────────────────────────────────────────────────────────
 *
 * The photographs share one style now: a car on white. On a dark section that
 * is a white rectangle, so they get a light stage of their own, lit from above
 * like the cards in the grid, and the stage is what turns. It cycles through a
 * spread of the line-up from cheapest to dearest, pauses while a pointer or
 * focus is on it, and does not move at all for prefers-reduced-motion.
 */

export interface CollectionScope {
  category: CarCategory | null
  brand: string | null
}

export interface CarCollectionHeroProps {
  scope: CollectionScope
  /** Every car inside the scope, before search and the sidebar filters. */
  cars: Car[]
  /** Scrolls the catalogue into view. */
  onBrowse: () => void
  /** Leave the slice and go back to the whole catalogue. */
  onClear: () => void
  /** Drop the powertrain but keep the brand — the brand crumb's job. */
  onClearCategory: () => void
}

/** What each powertrain is called, in the heading and in running text. */
const CATEGORY_COPY: Record<
  CarCategory,
  { title: string; short: string; plural: string; blurb: string }
> = {
  EV: {
    title: 'Electric Cars (EVs)',
    short: 'Electric',
    plural: 'electric cars',
    blurb:
      'Battery only, no engine at all — the range is the whole range, and every one of them charges from a plug.',
  },
  PHEV: {
    title: 'Plug-in Hybrid Cars (PHEVs)',
    short: 'Plug-in hybrid',
    plural: 'plug-in hybrids',
    blurb:
      'A plug and an engine. Charge it for the daily run and the engine covers everything past that, so the electric range is the shorter of two numbers.',
  },
  REEV: {
    title: 'Range-Extender Cars (REEVs)',
    short: 'Range extender',
    plural: 'range extenders',
    blurb:
      'The motor drives the wheels at all times. The engine on board never does — it runs as a generator once the battery is low.',
  },
  Hybrid: {
    title: 'Hybrid Cars (HEVs)',
    short: 'Hybrid',
    plural: 'hybrids',
    blurb:
      'Petrol driven, with a small battery the car fills itself while braking. There is no socket, so nothing to charge and no plug to find.',
  },
}

/** The brand's own name in running text: "BYD electric cars". */
const BRAND_CATEGORY_TITLE: Record<CarCategory, string> = {
  EV: 'Electric Cars',
  PHEV: 'Plug-in Hybrids',
  REEV: 'Range Extenders',
  Hybrid: 'Hybrids',
}

// ─── Figures ────────────────────────────────────────────────────────

interface Figure {
  key: string
  label: string
  value: number | null
  /** Places to keep while counting, so 10.95 does not tick through 10.9500001. */
  places: number
  unit: string
}

/** Lakh under a crore, crore above it — the way a price is said here. */
function rupeeFigure(rupees: number): {
  value: number
  unit: string
  places: number
} {
  if (rupees >= 10_000_000) {
    const value = Number((rupees / 10_000_000).toFixed(2))
    return { value, unit: 'Crore', places: decimals(value) }
  }
  const value = Number((rupees / 100_000).toFixed(2))
  return { value, unit: 'Lakh', places: decimals(value) }
}

function decimals(value: number): number {
  const text = String(value)
  const dot = text.indexOf('.')
  return dot === -1 ? 0 : Math.min(2, text.length - dot - 1)
}

function maxOf(values: Array<number | null | undefined>): number | null {
  const real = values.filter((value): value is number => typeof value === 'number' && value > 0)
  return real.length > 0 ? Math.max(...real) : null
}

function figuresFor(cars: Car[], scope: CollectionScope): Figure[] {
  const cheapest = cars.length > 0 ? Math.min(...cars.map((car) => car.price.min)) : null
  const dearest = cars.length > 0 ? Math.max(...cars.map((car) => car.price.max)) : null
  const low = cheapest === null ? null : rupeeFigure(cheapest)
  const high = dearest === null ? null : rupeeFigure(dearest)

  const out: Figure[] = [
    {
      key: 'cheapest',
      label: 'Cheapest',
      value: low?.value ?? null,
      places: low?.places ?? 0,
      unit: low?.unit ?? '',
    },
    {
      key: 'dearest',
      label: 'Most expensive',
      value: high?.value ?? null,
      places: high?.places ?? 0,
      unit: high?.unit ?? '',
    },
  ]

  /*
    Range where anybody published one, power where nobody did.

    A hybrid has no electric range worth quoting, and a slice made only of
    hybrids would otherwise print "—" in the third cell of every visit. Power is
    the next thing a buyer compares and every row has it.
  */
  const range = maxOf(
    cars.map((car) => car.rangeMax ?? car.electricRangeMax ?? electricDistance(car)),
  )
  if (range !== null) {
    out.push({
      key: 'range',
      label: 'Longest range',
      value: range,
      places: 0,
      unit: 'km',
    })
  } else {
    out.push({
      key: 'power',
      label: 'Most powerful',
      value: maxOf(cars.map((car) => car.power)),
      places: 0,
      unit: 'hp',
    })
  }

  /*
    The fourth cell measures the dimension the slice did not fix. A powertrain
    is sold by several makers, so count them; a brand is one maker, so say how
    fast its quickest car charges, which is the thing the rest of this site is
    about.
  */
  if (scope.brand === null) {
    out.push({
      key: 'brands',
      label: 'Brands',
      value: new Set(cars.map((car) => car.brand)).size,
      places: 0,
      unit: '',
    })
  } else {
    const dc = maxOf(cars.map((car) => car.dcCharging))
    if (dc !== null) {
      out.push({
        key: 'dc',
        label: 'Fastest DC charge',
        value: dc,
        places: 0,
        unit: 'kW',
      })
    } else {
      out.push({
        key: 'types',
        label: 'Powertrains',
        value: new Set(cars.map((car) => car.category)).size,
        places: 0,
        unit: '',
      })
    }
  }

  return out
}

// ─── Copy ───────────────────────────────────────────────────────────

function headingFor(scope: CollectionScope): { lead: string; tail: string } {
  if (scope.brand && scope.category) {
    return {
      lead: `${scope.brand} ${BRAND_CATEGORY_TITLE[scope.category]}`,
      tail: 'in Pakistan',
    }
  }
  if (scope.brand) return { lead: `${scope.brand} Cars`, tail: 'in Pakistan' }
  if (scope.category) return { lead: CATEGORY_COPY[scope.category].title, tail: 'in Pakistan' }
  return { lead: 'Cars', tail: 'in Pakistan' }
}

/** "3 fully electric, 2 plug-in hybrids and 1 hybrid". */
function lineUp(cars: Car[]): string {
  const parts: string[] = []
  const order: CarCategory[] = ['EV', 'PHEV', 'REEV', 'Hybrid']
  for (const category of order) {
    const n = cars.filter((car) => car.category === category).length
    if (n === 0) continue
    const copy = CATEGORY_COPY[category]
    parts.push(
      category === 'EV'
        ? `${n} fully electric`
        : `${n} ${n === 1 ? copy.plural.replace(/s$/, '') : copy.plural}`,
    )
  }
  if (parts.length <= 1) return parts.join('')
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
}

function blurbFor(scope: CollectionScope, cars: Car[]): string {
  const year = new Date().getFullYear()
  const cheapestFirst = 'cheapest first, with prices, range and charging figures for each'

  if (scope.brand && scope.category) {
    const copy = CATEGORY_COPY[scope.category]
    return `Every ${scope.brand} ${copy.plural.replace(/s$/, '')} on sale in Pakistan (${year}), ${cheapestFirst}. ${copy.blurb}`
  }
  if (scope.brand) {
    const mix = lineUp(cars)
    return `Every ${scope.brand} model on sale in Pakistan (${year})${mix ? ` — ${mix}` : ''}. Listed ${cheapestFirst}, and where to charge it on the live plug.pk map.`
  }
  if (scope.category) {
    const copy = CATEGORY_COPY[scope.category]
    return `All ${copy.plural} on sale in Pakistan (${year}), ${cheapestFirst}. ${copy.blurb}`
  }
  return ''
}

// ─── Motion ─────────────────────────────────────────────────────────

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return reduced
}

/**
 * A number that counts up to its value when it first appears.
 *
 * Rendered at its final value on the server and before hydration, so a crawler,
 * a screen reader and a slow phone all read the real figure. The count is a
 * flourish laid over a number that is already correct, never the other way.
 */
function CountUp({ value, places }: { value: number; places: number }) {
  const reduced = usePrefersReducedMotion()
  const [shown, setShown] = React.useState(value)

  React.useEffect(() => {
    if (reduced) {
      setShown(value)
      return
    }
    let frame = 0
    const start = performance.now()
    const duration = 900
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      // easeOutExpo: most of the travel early, then settles onto the figure.
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      setShown(value * eased)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, reduced])

  return <>{shown.toFixed(places)}</>
}

// ─── The stage ──────────────────────────────────────────────────────

/** Up to five cars spread evenly from cheapest to dearest. */
function stageLineUp(cars: Car[]): Car[] {
  const pictured = cars
    .filter((car) => Boolean(car.image))
    .sort((a, b) => a.price.min - b.price.min)
  if (pictured.length <= 5) return pictured
  const picks: Car[] = []
  for (let i = 0; i < 5; i += 1) {
    const car = pictured[Math.round((i * (pictured.length - 1)) / 4)]
    if (car && !picks.includes(car)) picks.push(car)
  }
  return picks
}

function Stage({ cars }: { cars: Car[] }) {
  const reduced = usePrefersReducedMotion()
  const [index, setIndex] = React.useState(0)
  const [paused, setPaused] = React.useState(false)

  React.useEffect(() => {
    if (reduced || paused || cars.length < 2) return
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % cars.length), 4200)
    return () => window.clearInterval(timer)
  }, [reduced, paused, cars.length])

  const active = cars[index] ?? cars[0]
  if (!active) return null

  const distance = active.rangeMax ?? electricDistance(active)

  return (
    <div
      className="collection-rise relative"
      style={{ '--rise-delay': '180ms' } as React.CSSProperties}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* A mint glow under the stage, so it sits on the section rather than
          being pasted onto it. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-8 -bottom-10 top-1/3 -z-10 rounded-full bg-[#6FE8B6]/10 blur-3xl"
      />

      <div className="overflow-hidden rounded-[1.75rem] border border-white/15 bg-white/[0.06] p-2 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.65)] backdrop-blur-sm">
        <Link
          href={`/cars/${active.slug}`}
          className="group relative block aspect-[16/11] overflow-hidden rounded-[1.35rem] bg-[linear-gradient(to_bottom,#FFFFFF_0%,#F4F7F6_60%,#E6ECEA_100%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6FE8B6]"
        >
          {/* Every photograph in the line-up is mounted and they crossfade.
              Swapping one <Image> src would flash white while the next decoded. */}
          {cars.map((car, i) => (
            <span
              key={car.id}
              aria-hidden={i !== index}
              className={cn(
                'absolute inset-0 transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none',
                i === index ? 'scale-100 opacity-100' : 'scale-[1.03] opacity-0',
              )}
            >
              <Image
                src={car.image as string}
                alt={i === index ? carModelName(car) : ''}
                fill
                sizes="(max-width: 1024px) 90vw, 560px"
                priority={i === 0}
                className="object-contain p-4 mix-blend-multiply transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
              />
            </span>
          ))}

          {/* The car's name and price, set on the stage itself like a placard
              on a showroom stand. */}
          <span className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-3 rounded-2xl bg-white/80 px-4 py-3 shadow-[0_8px_24px_-12px_rgba(5,36,30,0.35)] backdrop-blur-md">
            <span className="min-w-0">
              <span className="block font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-slate-500">
                {active.brand}
              </span>
              <span className="block truncate font-display text-lg font-bold leading-tight text-slate-900">
                {carModelName(active)}
              </span>
              <span className="mt-0.5 block text-ui-xs font-semibold text-plug-navy-700">
                {formatCarPrice(active)}
                {distance ? <span className="text-slate-500"> · up to {distance} km</span> : null}
              </span>
            </span>
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-plug-navy-950 text-white transition-transform duration-300 group-hover:translate-x-0.5">
              <ArrowRight size={16} aria-hidden="true" />
            </span>
          </span>
        </Link>

        {cars.length > 1 ? (
          <div
            className="flex items-center gap-1.5 px-1 pb-0.5 pt-2"
            role="tablist"
            aria-label="Line-up"
          >
            {cars.map((car, i) => (
              <button
                key={car.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={carModelName(car)}
                onClick={() => setIndex(i)}
                className={cn(
                  'relative h-12 flex-1 overflow-hidden rounded-xl border bg-white transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6FE8B6]',
                  i === index
                    ? 'border-[#6FE8B6] opacity-100'
                    : 'border-transparent opacity-50 hover:opacity-90',
                )}
              >
                <Image
                  src={car.image as string}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-contain p-1 mix-blend-multiply"
                />
                {/* A progress line under the active thumbnail while it plays. */}
                {i === index && !paused && !reduced ? (
                  <span
                    key={`${car.id}-${index}`}
                    aria-hidden="true"
                    className="collection-progress absolute inset-x-0 bottom-0 h-0.5 origin-left bg-[#3ccf91]"
                  />
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

// ─── The hero ───────────────────────────────────────────────────────

export function CarCollectionHero({
  scope,
  cars,
  onBrowse,
  onClear,
  onClearCategory,
}: CarCollectionHeroProps) {
  const heading = headingFor(scope)
  const blurb = blurbFor(scope, cars)
  const figures = React.useMemo(() => figuresFor(cars, scope), [cars, scope])
  const stage = React.useMemo(() => stageLineUp(cars), [cars])

  const eyebrow = scope.brand ? 'By brand' : 'By powertrain'
  const crumbs: Array<{ label: string; onClick?: () => void }> = [
    { label: 'Cars', onClick: onClear },
  ]
  if (scope.brand && scope.category) {
    crumbs.push({ label: scope.brand, onClick: onClearCategory })
    crumbs.push({ label: CATEGORY_COPY[scope.category].short })
  } else if (scope.brand) {
    crumbs.push({ label: scope.brand })
  } else if (scope.category) {
    crumbs.push({ label: CATEGORY_COPY[scope.category].title })
  }

  return (
    <section className="relative isolate overflow-hidden bg-plug-navy-950">
      {/* The key light: one wide source above the content, greener than the
          general hero so a slice reads as a room of its own. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_30%_-20%,rgba(60,207,145,0.22)_0%,rgba(52,90,83,0.18)_40%,transparent_75%)]"
      />
      {/* A drafting grid, faded out toward the bottom — the reference's ground. */}
      <div
        aria-hidden="true"
        className="collection-grid pointer-events-none absolute inset-0 -z-10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />

      <div
        key={`${scope.brand ?? ''}|${scope.category ?? ''}`}
        className="container-plug relative pb-0 pt-10 lg:pt-12"
      >
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-14">
          <div>
            <nav aria-label="Breadcrumb" className="collection-rise">
              <ol className="flex flex-wrap items-center gap-1.5 text-ui-sm text-white/55">
                <li>
                  <Link
                    href="/"
                    className="underline-offset-4 transition-colors hover:text-white hover:underline"
                  >
                    Home
                  </Link>
                </li>
                {crumbs.map((crumb, i) => (
                  <React.Fragment key={crumb.label}>
                    <ChevronRight size={13} aria-hidden="true" className="shrink-0 text-white/35" />
                    <li aria-current={i === crumbs.length - 1 ? 'page' : undefined}>
                      {crumb.onClick && i < crumbs.length - 1 ? (
                        <button
                          type="button"
                          onClick={crumb.onClick}
                          className="underline-offset-4 transition-colors hover:text-white hover:underline"
                        >
                          {crumb.label}
                        </button>
                      ) : (
                        <span className="font-semibold text-white/90">{crumb.label}</span>
                      )}
                    </li>
                  </React.Fragment>
                ))}
              </ol>
            </nav>

            <p
              className="collection-rise mt-7 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-[#6FE8B6]"
              style={{ '--rise-delay': '40ms' } as React.CSSProperties}
            >
              <span>{eyebrow}</span>
              <span aria-hidden="true" className="text-white/30">
                ·
              </span>
              <span>
                {cars.length} {cars.length === 1 ? 'model' : 'models'} on sale in Pakistan
              </span>
            </p>

            <h1
              className="collection-rise mt-4 text-balance font-display text-[clamp(2.25rem,5vw,4rem)] font-extrabold leading-[1.04] tracking-[-0.035em] text-white"
              style={{ '--rise-delay': '80ms' } as React.CSSProperties}
            >
              {heading.lead} <span className="text-[#6FE8B6]">{heading.tail}</span>
            </h1>

            <p
              className="collection-rise mt-5 max-w-xl text-pretty text-base leading-relaxed sm:text-lg text-white/70"
              style={{ '--rise-delay': '120ms' } as React.CSSProperties}
            >
              {blurb}
            </p>

            <div
              className="collection-rise mt-8 flex flex-wrap items-center gap-3"
              style={{ '--rise-delay': '160ms' } as React.CSSProperties}
            >
              <button
                type="button"
                onClick={onBrowse}
                className="group inline-flex h-12 items-center gap-2 rounded-full bg-[#6FE8B6] px-6 sm:h-14 sm:px-7 text-ui font-bold text-plug-navy-950 shadow-[0_10px_40px_-8px_rgba(111,232,182,0.65)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#8af0c6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-plug-navy-950 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                Browse all {cars.length}
                <ArrowDown
                  size={16}
                  aria-hidden="true"
                  className="transition-transform duration-200 group-hover:translate-y-0.5"
                />
              </button>

              {/* The way out, for somebody who arrived on a shared link and
                  wants the whole catalogue rather than this slice of it. The
                  halfway step — every BYD, not only the electric ones — is the
                  brand crumb above, so it is not a third button here. */}
              <button
                type="button"
                onClick={onClear}
                className="inline-flex h-12 items-center sm:h-14 rounded-full border border-white/20 bg-white/[0.04] px-6 text-ui font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                See every car
              </button>
            </div>
          </div>

          {stage.length > 0 ? <Stage key={stage.map((car) => car.id).join()} cars={stage} /> : null}
        </div>

        {/* The extent of the slice in four numbers, on a hairline — the same
            rail the reference ends its hero on. */}
        <dl
          className="collection-rise mt-12 grid grid-cols-2 border-t border-white/10 lg:mt-14 lg:grid-cols-4"
          style={{ '--rise-delay': '220ms' } as React.CSSProperties}
        >
          {figures.map((figure, i) => (
            <div
              key={figure.key}
              className={cn(
                'flex flex-col-reverse px-1 py-7 sm:px-6',
                i % 2 === 1 && 'border-l border-white/10',
                i >= 2 && 'border-t border-white/10 lg:border-t-0',
                i === 2 && 'lg:border-l',
              )}
            >
              <dt className="mt-2 font-mono text-[0.625rem] uppercase leading-none tracking-[0.16em] text-white/50">
                {figure.label}
              </dt>
              <dd className="flex items-baseline gap-1.5 font-display text-[clamp(1.75rem,3.2vw,2.5rem)] font-extrabold leading-none tabular-nums tracking-[-0.02em] text-white">
                {figure.value === null ? (
                  '—'
                ) : (
                  <>
                    <CountUp value={figure.value} places={figure.places} />
                    {figure.unit ? (
                      <span
                        className={cn(
                          'font-sans font-semibold tracking-normal',
                          figure.unit === 'Lakh' || figure.unit === 'Crore'
                            ? 'text-[0.75em] text-white'
                            : 'text-sm text-white/60',
                        )}
                      >
                        {figure.unit}
                      </span>
                    ) : null}
                  </>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
