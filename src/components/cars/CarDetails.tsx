// src/components/cars/CarDetails.tsx
import {
  BadgeCheck,
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
  Tag as TagIcon,
  Timer,
  Users,
  Zap,
} from '@/components/ui/icons'
import Link from 'next/link'
import * as React from 'react'

import { CountUp } from '@/components/v2/Reveal'
import { Btn, BtnArrow, CARD, Eyebrow, ExampleBadge, H2_CLASS, Hl, PageHero, WRAP, btnClass } from '@/components/v2/ui'
import type { Car, CarCategory } from '@/data/cars'
import { getCarFeatures } from '@/data/car-features'
import { getImageCredit } from '@/data/carImageCredits'
import {
  bodyStyle,
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
import { RATES_CHECKED, RATES_FISCAL_YEAR, onRoadEstimates, onRoadProvinces } from '@/lib/onroad'
import { cn } from '@/lib/utils'

import { CarCard } from './CarCard'
import { CarGrid, CarPhoto } from './car-motion'
import { OnRoadPrice } from './OnRoadPrice'
import { CAR_ENTRANCE_ITEM, STAGE, priceQualifier } from './car-ui'

/**
 * One car, in full, in the catalogue's language (landing-v2 cars.html): the
 * ink hero with the car's name, a paper sheet lifted into it holding the car on
 * its lit stage beside the price and the four headline figures, then the
 * on-road price, every published figure, the key features and similar cars.
 *
 * A server component: the only interactive part is the on-road calculator.
 *
 * Every figure is rendered only when it exists. Most of these cars were
 * published with a price, a battery and little else, and a sheet padded with
 * "—" reads as a car with no torque rather than a figure nobody stated. The
 * paragraph and the headline figures follow the same rule.
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
  EV: 'Fully electric',
  PHEV: 'Plug-in hybrid',
  REEV: 'Range extender',
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
  'Pakistan market': TagIcon,
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

/** A section heading in the display face, with an optional lead. */
function SectionTitle({ title, lead, className }: { title: React.ReactNode; lead?: React.ReactNode; className?: string }) {
  return (
    <header className={cn('mb-7', className)}>
      <h2 data-split="" className="font-display text-[clamp(30px,3.4vw,48px)] leading-[1.04] text-ink text-balance">
        {title}
      </h2>
      {lead ? <p data-reveal="" className="mt-3 max-w-[46rem] text-[15px] leading-[1.6] text-muted">{lead}</p> : null}
    </header>
  )
}

export function CarDetails({ car, pool }: CarDetailsProps) {
  const groups = specGroups(car)
  const similar = getSimilarCars(car, pool)
  const credit = car.image ? getImageCredit(car.id) : undefined
  const stats = headlineStats(car)
  const price = panelPrice(car)
  const qualifier = priceQualifier(car.price.display)
  const name = carDisplayName(car)
  const features = getCarFeatures(car.slug)
  const onRoad = onRoadEstimates(car)
  const body = bodyStyle(car)

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
    <>
      {/* ── Hero ────────────────────────────────────────────────── */}
      <PageHero
        eyebrow={[car.brand, CATEGORY_NAME[car.category], body].filter(Boolean).join(' · ')}
        title={
          <>
            {car.brand} <Hl dark>{car.model}</Hl>
            {/* The trim lives inside the h1, on its own smaller line: the
                heading is the page's one statement of which car this is. */}
            {car.variant ? (
              <span className="mt-3 block font-sans text-[clamp(16px,1.6vw,21px)] font-medium leading-snug tracking-normal text-white/60 [-webkit-text-stroke:0]">
                {car.variant}
              </span>
            ) : null}
          </>
        }
        sub={carSummary(car)}
        actions={
          <>
            <Btn
              href={compareHref}
              variant="light"
              aria-label={`Compare ${carModelName(car)}${similar[0] ? ` with ${carModelName(similar[0])}` : ''}`}
            >
              <Plus aria-hidden="true" />
              Compare
            </Btn>
            <Btn href="#specifications" variant="ghostDark">
              Full specs
            </Btn>
          </>
        }
      />

      {/* ── The sheet: the car, the price, the figures ──────────── */}
      <div
        data-theme="light"
        data-lift=""
        className="relative z-[3] mx-auto -mt-[84px] w-[min(1320px,calc(100%-2*clamp(16px,4vw,64px)))] overflow-hidden rounded-3xl border border-white/60 bg-paper shadow-e4 sm:-mt-28 sm:rounded-[32px]"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 bg-[linear-gradient(90deg,#F4F3EE,#fff)] px-[18px] py-4 sm:px-7">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
              <li>
                <Link href="/cars" className="font-medium transition-colors hover:text-ink">
                  Cars
                </Link>
              </li>
              <ChevronRight size={13} aria-hidden="true" className="shrink-0" />
              <li>
                <Link
                  href={`/cars?brand=${encodeURIComponent(car.brand)}`}
                  className="font-medium transition-colors hover:text-ink"
                >
                  {car.brand}
                </Link>
              </li>
              <ChevronRight size={13} aria-hidden="true" className="shrink-0" />
              <li aria-current="page" className="font-semibold text-ink">
                {carModelName(car)}
              </li>
            </ol>
          </nav>
          <span className="inline-flex h-[26px] items-center rounded-full border border-ink bg-ink px-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
            {car.category}
          </span>
        </div>

        <div className="grid gap-2 p-2 sm:gap-4 sm:p-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          {/* The stage. The cut-out is multiplied into the light. */}
          <div className={cn(STAGE, 'aspect-[16/11] rounded-[22px] lg:aspect-auto lg:min-h-[30rem]')}>
            {car.image ? (
              <CarPhoto
                src={car.image}
                alt={name}
                sizes="(max-width: 1024px) 100vw, 760px"
                priority
                className="inset-x-[6%] bottom-[6%] top-[8%]"
              />
            ) : (
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <span aria-hidden="true" className="font-display text-5xl text-ink/20">
                  {car.brand}
                </span>
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                  No photograph yet
                </span>
              </span>
            )}
          </div>

          <div className="flex min-w-0 flex-col px-3 pb-4 pt-3 sm:px-4 lg:py-6 lg:pl-3 lg:pr-5">
            {/* The trim names the figures below, so it heads them — only when
                the row declares one. */}
            {car.variant ? (
              <p className="mb-5 font-display text-[clamp(22px,2vw,28px)] leading-[1.1] text-ink">{car.variant}</p>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                {/* The badge carries the qualifier; the label stays plain. */}
                {qualifier ? (car.price.min !== car.price.max ? 'Price range' : 'Price') : price.label}
              </span>
              {qualifier ? <ExampleBadge className="capitalize">{qualifier}</ExampleBadge> : null}
            </div>
            <p className="mt-2.5 font-mono text-[clamp(28px,2.8vw,40px)] font-semibold leading-none tracking-[-0.03em] tabular-nums text-ink">
              <small className="mr-2 align-[0.35em] text-[13px] tracking-[0.06em] text-muted">PKR</small>
              {price.amount.replace(/^PKR\s*/, '')}
            </p>

            {stats.length > 0 ? (
              <dl className="mt-7 grid grid-cols-2 gap-2.5 sm:gap-3">
                {stats.map((stat) => {
                  const Icon = stat.icon
                  // A span such as "510–650" is twice the width of "530": it
                  // steps down a size rather than wrapping the unit away.
                  const long = stat.value.length + stat.unit.length > 7
                  return (
                    <div key={stat.caption} className="flex min-w-0 flex-col rounded-[22px] border border-ink/10 bg-white p-4 sm:p-5">
                      <dt className="order-2 mt-2 text-[13px] leading-snug text-muted">{stat.caption}</dt>
                      <dd className="order-1 min-w-0">
                        <Icon aria-hidden="true" className="h-5 w-5 text-volt-ink" />
                        <span className="mt-3 flex items-baseline gap-1 whitespace-nowrap font-mono font-semibold leading-none tabular-nums text-ink">
                          <span
                            className={cn(
                              'tracking-[-0.03em]',
                              long ? 'text-[clamp(20px,1.8vw,26px)]' : 'text-[clamp(26px,2.4vw,34px)]',
                            )}
                          >
                            {/* Counted up like the hero figures (data-count),
                                when the figure is a single number. */}
                            {/^\d+(\.\d+)?$/.test(stat.value) ? (
                              <CountUp value={Number(stat.value)} decimals={stat.value.split('.')[1]?.length ?? 0} />
                            ) : (
                              stat.value
                            )}
                          </span>
                          {stat.unit ? <span className="text-[13px] font-semibold text-muted">{stat.unit}</span> : null}
                        </span>
                      </dd>
                    </div>
                  )
                })}
              </dl>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-2 lg:mt-auto lg:pt-6">
              {actions.map((action, index) => {
                const Icon = action.icon
                return (
                  <Link key={action.label} href={action.href} className={btnClass(index === 0 ? 'ink' : 'ghost', 'sm', 'h-11')}>
                    <Icon aria-hidden="true" />
                    {action.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* The photographer, named on the page: most of these are CC BY-SA, which
          requires attribution wherever the image appears. */}
      {credit ? (
        <p className={cn(WRAP, 'px-2 pt-3 text-xs leading-relaxed text-muted')}>
          Photo: {credit.author} ·{' '}
          {credit.licenceUrl ? (
            <a href={credit.licenceUrl} rel="noopener noreferrer nofollow" target="_blank" className="underline hover:text-ink">
              {credit.licence}
            </a>
          ) : (
            credit.licence
          )}{' '}
          ·{' '}
          <a href={credit.source} rel="noopener noreferrer nofollow" target="_blank" className="underline hover:text-ink">
            Wikimedia Commons
          </a>
          {credit.changes ? <> · {credit.changes}</> : null}
        </p>
      ) : null}

      <section data-theme="light" className="bg-chalk pb-[clamp(64px,7vw,104px)] pt-[clamp(48px,6vw,88px)]">
        <div className={cn(WRAP, 'grid gap-[clamp(56px,6vw,88px)]')}>
          {/* ── Price in Pakistan ─────────────────────────────────
              Only where at least one province has sourced rates, and never for
              an indicative or estimated price (onRoadEstimates decides). */}
          {onRoad ? (
            <OnRoadPrice
              title={`${name} price in Pakistan`}
              provinces={onRoadProvinces().filter((entry) => onRoad[entry.key])}
              estimates={onRoad}
              fiscalYear={RATES_FISCAL_YEAR}
              checked={RATES_CHECKED}
            />
          ) : null}

          {/* ── Every published figure ─────────────────────────────
              Grouped; an empty group is dropped, so a PHEV shows an Engine
              sheet where an EV shows none. */}
          <section id="specifications" className="scroll-mt-[calc(var(--nav-h)+16px)]">
            <Eyebrow>Specifications</Eyebrow>
            <SectionTitle
              title={`${name} specs and range`}
              lead={
                <>
                  {car.variant ? `Full figures for the ${car.variant} variant, as published.` : 'Full figures, as published.'}{' '}
                  Anything absent was not stated by the manufacturer or importer — plugpk does not estimate specifications.
                </>
              }
            />

            <div className="grid gap-3 lg:grid-cols-2">
              {groups.map((group) => {
                const Icon = GROUP_ICON[group.title] ?? CarIcon
                return (
                  <div key={group.title} data-reveal="" className={cn(CARD, 'px-5 py-5 sm:px-7 sm:py-6')}>
                    <h3 className="flex items-center gap-3 font-display text-[22px] leading-tight text-ink">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-chalk">
                        <Icon size={18} aria-hidden="true" className="text-ink" />
                      </span>
                      {group.title}
                    </h3>
                    <dl className="mt-3">
                      {group.rows.map((row) => (
                        <div
                          key={row.label}
                          className="flex items-baseline justify-between gap-6 border-t border-ink/10 py-3"
                        >
                          <dt className="text-[14.5px] text-muted">{row.label}</dt>
                          <dd
                            className={cn(
                              'text-right font-semibold text-ink',
                              // Figures in mono; words (a distributor, a warranty) in the UI face.
                              /^(?:\d|PKR\s)/.test(String(row.value))
                                ? 'font-mono text-[14px]'
                                : 'text-[14.5px]',
                            )}
                          >
                            {row.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )
              })}
            </div>

            {/* ── Key features ─────────────────────────────────────
                What the Pakistan trim is equipped with, grouped. Only for a car
                with a reviewed list in src/data/car-features.ts. Columns rather
                than a grid, so the groups pack by height. */}
            {features ? (
              <div data-reveal="" className={cn(CARD, 'mt-3 px-5 py-5 sm:px-7 sm:py-7')}>
                <h3 className="flex flex-wrap items-center gap-3 font-display text-[22px] leading-tight text-ink">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-volt-tint">
                    <BadgeCheck size={18} aria-hidden="true" className="text-volt-ink" />
                  </span>
                  Key features
                  {features.trim ? (
                    <span className="font-mono text-[12px] font-semibold uppercase tracking-[0.12em] text-muted [-webkit-text-stroke:0]">
                      {features.trim}
                    </span>
                  ) : null}
                </h3>
                <div className="mt-4 border-t border-ink/10 pt-5 sm:columns-2 sm:gap-12 lg:columns-3">
                  {features.groups.map((group) => (
                    <div key={group.title} className="mb-6 break-inside-avoid">
                      <h4 className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-volt-ink">{group.title}</h4>
                      <ul className="mt-3 flex flex-col gap-2">
                        {group.items.map((item) => (
                          <li key={item} className="flex gap-2.5 text-[15px] leading-snug text-ink">
                            <span aria-hidden="true" className="mt-[0.5em] h-1.5 w-1.5 shrink-0 rounded-full bg-ink/30" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <p className="border-t border-ink/10 pt-4 text-xs leading-relaxed text-muted">
                  Equipment as listed for the Pakistan model by{' '}
                  {/* One link per site: two brochures on the same site read as a
                      repeated word otherwise. */}
                  {features.sources
                    .filter((source, index, all) => all.findIndex((other) => new URL(other).hostname === new URL(source).hostname) === index)
                    .map((source, index) => (
                      <React.Fragment key={source}>
                        {index > 0 ? ', ' : null}
                        <a href={source} rel="noopener noreferrer nofollow" target="_blank" className="underline hover:text-ink">
                          {new URL(source).hostname.replace(/^www\./, '')}
                        </a>
                      </React.Fragment>
                    ))}
                  . Checked {features.checked}. Confirm with the dealer before you buy.
                </p>
              </div>
            ) : null}

            {/* The research trail — which source said what, where two
                disagreed. Behind a disclosure: it is not what a buyer came for. */}
            {car.notes ? (
              <details data-reveal="" className="group/notes mt-3 rounded-[22px] border border-ink/10 bg-white transition-shadow open:shadow-e1">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-[16px] font-semibold text-ink sm:px-7 [&::-webkit-details-marker]:hidden">
                  Data notes
                  <span className="text-sm font-medium text-muted">
                    <span className="group-open/notes:hidden">Where these figures came from</span>
                    <span className="hidden group-open/notes:inline">Hide</span>
                  </span>
                </summary>
                <p className="border-t border-ink/10 px-5 py-4 text-sm leading-relaxed text-muted sm:px-7">{car.notes}</p>
              </details>
            ) : null}
          </section>
        </div>
      </section>

      {/* ── Similar cars ────────────────────────────────────────────
          The same cards as the catalogue, so a buyer moves between them
          without learning a second layout. */}
      {similar.length > 0 ? (
        <section data-theme="light" className="bg-paper py-[clamp(64px,7vw,104px)]">
          <div className={WRAP}>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <Eyebrow>Keep looking</Eyebrow>
                <h2 data-split="" className={cn(H2_CLASS, 'text-ink')}>
                  Similar <Hl>cars</Hl>
                </h2>
              </div>
              <Btn href="/cars" variant="ghost">
                See all cars
                <BtnArrow />
              </Btn>
            </div>
            {/* The cards come in as the catalogue's do. */}
            <CarGrid className="grid grid-cols-1 gap-3 min-[421px]:grid-cols-2 sm:gap-[clamp(14px,1.6vw,22px)] min-[1101px]:grid-cols-3">
              {similar.map((other) => (
                <li key={other.id} className={cn('min-w-0', CAR_ENTRANCE_ITEM)}>
                  <CarCard car={other} />
                </li>
              ))}
            </CarGrid>
          </div>
        </section>
      ) : null}
    </>
  )
}
