// src/components/cars/CarDetails.tsx
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronRight,
  Gauge,
  GitCompare,
  LayoutGrid,
  Maximize2,
  Route,
  Timer,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

import { FACE, FRAME } from '@/components/shared/frame'
import { Badge, HoverMotion, PhotoFrame, type BadgeVariant } from '@/components/ui'
import type { Car, CarCategory } from '@/data/cars'
import { getImageCredit } from '@/data/carImageCredits'
import { carDisplayName, carModelName, getSimilarCars, specGroups } from '@/lib/cars'
import { cn } from '@/lib/utils'

import { SpecificationTable } from './SpecificationTable'

/**
 * One car, in full.
 *
 * A server component: nothing here is interactive, so there is no reason to ship
 * it to the browser.
 *
 * Every figure is rendered only when it exists. That is not defensive coding —
 * it is the point. Most of these cars were published with a price, a battery and
 * little else, and a spec sheet padded with "—" reads as a car with no torque
 * rather than a figure nobody stated.
 *
 * ── The layout, and what it deliberately does not copy ─────────────────
 *
 * Restyled after a car-rental dashboard: a tinted canvas, one layered panel, the
 * car large on a flat surface with its name over it, an icon rail down the side,
 * a quick-action card, and a row of three summary cards with an expand
 * affordance.
 *
 * What was NOT carried across is the content of that reference — Book a rent,
 * Insurance, Payment, My Dates, Payment Method, an AI assistant. Plug.pk rents
 * nothing, sells nothing and takes no payments, so those tiles would have been
 * controls that do not work. Every button and card below resolves to a route
 * that exists and a figure the catalogue actually holds; where the reference had
 * a payment method, this has the price, and where it had trip dates, this has
 * the battery and the charging speed.
 *
 * The accent stays the product's blue rather than the reference's green. The
 * navbar, the footer and every button on the rest of the site are blue, and one
 * page in a different accent reads as a page from a different product.
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

/** The rail and quick-action buttons share one surface treatment. */
const TILE =
  'group inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white ' +
  'text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 ' +
  'hover:border-plug-blue-300 hover:text-plug-blue-600 hover:shadow-[0_6px_16px_-8px_rgba(37,99,235,0.35)] ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2'

export function CarDetails({ car, pool }: CarDetailsProps) {
  const groups = specGroups(car)
  const similar = getSimilarCars(car, pool)
  const credit = car.image ? getImageCredit(car.id) : undefined

  const compareHref = `/cars/compare?ids=${[car.id, similar[0]?.id].filter(Boolean).join(',')}`

  /*
    The three summary cards are the price plus the first two spec groups that
    actually have rows — not a fixed Battery / Charging / Performance trio.

    specGroups already drops an empty group, so a full hybrid arrives with no
    Charging block at all. Hardcoding the titles would have left that car with an
    empty card headed "Charging", which is exactly the "—" problem this page
    avoids everywhere else.
  */
  const summaryGroups = groups.slice(0, 2)

  return (
    <div>
      {/* ── Breadcrumb ────────────────────────────────────────────
          Kept above the panel rather than replaced by the reference's lone back
          arrow. A trail names the level above and the category, so the page says
          where it sits instead of only offering a way out — and it is what a
          crawler reads. The back arrow is in the rail as well, for the reader who
          just wants out. */}
      <nav aria-label="Breadcrumb" className="mb-5">
        <ol className="flex flex-wrap items-center gap-1.5 text-ui-sm text-slate-400">
          <li>
            <Link href="/cars" className="font-medium transition-colors hover:text-slate-900">
              Cars
            </Link>
          </li>
          <ChevronRight size={13} aria-hidden="true" className="shrink-0" />
          <li className="font-medium text-slate-600">{car.brand}</li>
          <ChevronRight size={13} aria-hidden="true" className="shrink-0" />
          {/* carModelName, so the crumb names the page rather than the family.
              The brand is the crumb before it, so this must not repeat it. */}
          <li aria-current="page" className="font-semibold text-slate-900">
            {carModelName(car)}
          </li>
        </ol>
      </nav>

      {/* ── The panel ─────────────────────────────────────────────
          One surface holding the whole hero. Three tones of depth, which is what
          gives the reference its layered feel: the section behind is tinted, this
          panel is white, and the stage the car sits on is tinted again. */}
      <div className="rounded-[2rem] border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_24px_60px_-32px_rgba(15,23,42,0.28)] sm:p-6">
        <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-b from-slate-50 to-slate-100/70">
          {/*
            Two columns: everything textual on the tinted left, the photograph
            filling the right edge to edge.

            Two earlier attempts are worth recording, because the reference misled
            both. Floating the where-next card over the top right, as the
            reference does, put it on top of the car. Centring the car in a middle
            column left a wide grey void beneath it and made the photograph look
            like a placeholder dropped on a grey field.

            The reference gets its composition from a cut-out product render
            floating on the same flat colour as the panel. Our images are
            photographs with their own backgrounds — concrete, kerbs, a wall — so
            they cannot float on anything. Letting the photograph own its half of
            the panel completely is the honest version of the same idea: the car
            still dominates, and nothing pretends to be a render.
          */}
          <div className="grid lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:items-stretch">
            {/* Identity — first in the DOM, so it is first on a phone too */}
            <div className="p-6 pb-0 sm:p-8 sm:pb-0 lg:col-start-1 lg:row-start-1">
              <div className="flex items-center gap-2.5">
                <span className="text-ui-xs font-bold uppercase tracking-[0.16em] text-plug-blue-600">
                  {car.brand}
                </span>
                <Badge variant={CATEGORY_VARIANT[car.category]} size="sm">
                  {car.category}
                </Badge>
              </div>

              {/*
                The trim lives inside the h1, as a second line.

                Inside, not beside: the h1 is the page's one statement of what
                this car is, and a trim rendered in a separate element next to it
                would leave the heading itself still claiming to describe every
                Seal — which is the conflation Phase 4.1 exists to prevent. A
                crawler and a screen reader both read the heading as
                "Seal 61.4 kWh RWD Comfort", one string, because that is the car.

                It is set much smaller and lighter than the model. At
                clamp(2rem,4vw,3.25rem) black, a trim as long as "61.4 kWh RWD
                Comfort" would run to three lines and outweigh the model name.
                A block span on its own line keeps the model dominant and the
                trim legible, and costs nothing when there is no trim: the span
                is not rendered at all, so an undeclared car's h1 is exactly the
                markup it was before.

                No duplicate: this is the only place the trim appears in the
                hero. The blurb below is category prose and the chips are
                figures.
              */}
              <h1 className="mt-2 text-[clamp(2rem,4vw,3.25rem)] font-black leading-[1.03] tracking-[-0.035em] text-slate-900">
                {car.model}
                {car.variant ? (
                  <span className="mt-1.5 block text-[clamp(0.9375rem,1.4vw,1.125rem)] font-semibold leading-snug tracking-[-0.01em] text-slate-500">
                    {car.variant}
                  </span>
                ) : null}
              </h1>

              <p className="mt-2.5 max-w-sm text-ui leading-relaxed text-slate-500">
                {CATEGORY_BLURB[car.category]}
              </p>

              {/*
                Chips where the reference had colour swatches. The catalogue holds
                no paint data, and a row of invented colours on a page that
                refuses to estimate a battery figure would be an odd place to
                start guessing. These are figures the car actually has.
              */}
              {(car.acceleration || car.topSpeed || car.seats) ? (
                <ul className="mt-5 flex flex-wrap gap-2">
                  {car.acceleration ? (
                    <li className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-ui-xs font-semibold text-slate-700">
                      <Timer size={12} className="text-slate-400" aria-hidden="true" />
                      0–100 in {car.acceleration} {car.accelerationUnit}
                    </li>
                  ) : null}
                  {car.topSpeed ? (
                    <li className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-ui-xs font-semibold text-slate-700">
                      <Gauge size={12} className="text-slate-400" aria-hidden="true" />
                      {car.topSpeed} km/h
                    </li>
                  ) : null}
                  {car.seats ? (
                    <li className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-ui-xs font-semibold text-slate-700">
                      {car.seats} seats
                    </li>
                  ) : null}
                </ul>
              ) : null}

              {/* ── The rail ────────────────────────────────────
                  Three buttons, three real routes. The reference's rail is
                  decorative in places; every icon here goes somewhere, and each
                  carries a label for a screen reader because an icon alone
                  announces nothing. */}
              <div className="mt-6 flex gap-2 lg:mt-8">
                <Link href="/cars" aria-label="Back to all cars" className={cn(TILE, 'h-11 w-11')}>
                  <ArrowLeft size={17} aria-hidden="true" />
                </Link>
                <Link
                  href={compareHref}
                  aria-label={`Compare ${carModelName(car)}`}
                  className={cn(TILE, 'h-11 w-11')}
                >
                  <GitCompare size={17} aria-hidden="true" />
                </Link>
                <Link
                  href="/map"
                  aria-label="Find charging nearby"
                  className={cn(TILE, 'h-11 w-11')}
                >
                  <Zap size={17} aria-hidden="true" />
                </Link>
              </div>

            </div>

            {/*
              The photograph at its own aspect ratio, centred, with the tint
              showing around it.

              Filling the column edge to edge was the previous attempt and it
              cropped the car's nose and tail — PhotoFrame is object-cover, and a
              column sized by the text beside it is a different shape from a 16:10
              photograph. On a page whose entire job is showing somebody a car,
              cutting the car in half is worse than any amount of empty space.

              So the ratio is fixed and the leftover height becomes margin. That is
              also what the reference does, for the same reason: the car sits in
              air on a flat surface, whole.
            */}
            <div className="flex items-center justify-center p-6 sm:p-8 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:pl-0">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl">
                <PhotoFrame
                  src={car.image ?? undefined}
                  alt={carDisplayName(car)}
                  sizes="(max-width: 1024px) 100vw, 700px"
                  priority
                />
              </div>
            </div>

            {/*
              Where next — after the photograph in the DOM, beneath the identity
              on a wide screen.

              The order matters and the first version had it wrong. With this card
              inside the identity column, a phone got the car's name, then four
              navigation tiles, and only then the car — the photograph pushed below
              the fold on the one page whose job is showing somebody a car. Grid
              placement lets the DOM run identity → photograph → where-next, which
              is the right order stacked, while the desktop composition is
              unchanged.

              The reference floats an assistant panel over its hero. This is the
              same shape carrying the four things a reader here can actually do
              next, each one a route that exists — no assistant, no booking, no
              payment, because this product has none of them.
            */}
            <div className="p-6 pt-0 sm:p-8 sm:pt-0 lg:col-start-1 lg:row-start-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <p className="px-1 pb-2.5 text-ui-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                  Where next
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { href: '/map', icon: Zap, label: 'Charging', detail: 'Nearby ports' },
                    { href: '/routes', icon: Route, label: 'Routes', detail: 'With stops' },
                    { href: compareHref, icon: GitCompare, label: 'Compare', detail: 'Side by side' },
                    {
                      href: '/cars',
                      icon: LayoutGrid,
                      label: 'All cars',
                      detail: `${pool.length} listed`,
                    },
                  ].map((action) => {
                    const Icon = action.icon
                    return (
                      <Link
                        key={action.label}
                        href={action.href}
                        className={cn(TILE, 'flex-col items-start gap-1 p-3 text-left')}
                      >
                        <Icon size={15} aria-hidden="true" />
                        <span className="text-ui-sm font-bold leading-tight text-slate-900">
                          {action.label}
                        </span>
                        <span className="text-ui-xs leading-tight text-slate-400">
                          {action.detail}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>

          </div>

        </div>

        {/*
          The photographer, named on the page rather than only in a credits file.
          Most of these are CC BY-SA, which requires attribution wherever the
          image appears — burying it one link deep would not honour that, and it
          costs one quiet line here.
        */}
        {credit ? (
          <p className="px-2 pt-3 text-ui-xs leading-relaxed text-slate-400">
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

        {/* ── The three summary cards ───────────────────────────
            Where the reference had My Location, My Dates and Payment Method. The
            expand control is a real anchor to the full table below, not a
            disclosure that does nothing. */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* Price */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-ui-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                Pakistan market price
              </p>
            </div>
            <p className="mt-2 text-[clamp(1.375rem,2.2vw,1.75rem)] font-black leading-tight tracking-tight text-slate-900">
              {car.price.display}
            </p>
            <p className="mt-2 text-ui-xs leading-relaxed text-slate-500">
              {car.price.min !== car.price.max
                ? 'Varies by variant. Confirm the on-road figure with the dealer.'
                : 'Confirm the on-road figure with the dealer.'}
            </p>
          </div>

          {/* The first two spec groups that have rows */}
          {summaryGroups.map((group) => (
            <div key={group.title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-ui-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                  {group.title}
                </p>
                {/*
                  Shown only when the card is actually hiding something. An
                  expand control that expands nothing is the kind of detail that
                  makes an interface feel decorative.
                */}
                {group.rows.length > 3 ? (
                  <a
                    href="#specifications"
                    aria-label={`See all ${group.title.toLowerCase()} figures`}
                    className={cn(TILE, 'h-7 w-7 rounded-lg')}
                  >
                    <Maximize2 size={12} aria-hidden="true" />
                  </a>
                ) : null}
              </div>

              {/*
                Three rows at most. The first version printed the whole group,
                which made each card an exact duplicate of its block in the table
                below and left the expand control pointing at what was already on
                screen.
              */}
              <dl className="mt-3 flex flex-col">
                {group.rows.slice(0, 3).map((row, index) => (
                  <div
                    key={row.label}
                    className={cn(
                      'flex items-baseline justify-between gap-4 py-2',
                      index > 0 && 'border-t border-slate-100',
                    )}
                  >
                    <dt className="text-ui-sm text-slate-500">{row.label}</dt>
                    <dd className="text-right text-ui-sm font-bold text-slate-900">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </div>

      {/*
        The headline figures band that used to sit here is gone.

        It listed Battery, Range, DC and AC charging — every one of which the
        three summary cards above already show, from the same source. Two bands
        of identical numbers a hundred pixels apart is not emphasis, it is the
        reader wondering whether they are looking at the same figure twice.
      */}

      {car.notes ? (
        <p className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-ui-sm leading-relaxed text-slate-600">
          {car.notes}
        </p>
      ) : null}

      {/* ── Full specifications ───────────────────────────────────
          The anchor the summary cards point at. Blocks rather than one fourteen-row
          list: grouped, the charging figures sit together and a reader can find
          them without scanning everything; an empty group is dropped, so a PHEV
          shows an Engine block where an EV shows none. */}
      <section id="specifications" className="mt-4 scroll-mt-24">
        <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-ui-lg font-bold tracking-tight text-slate-900">
              Full specifications
            </h2>
          </div>

          {groups.map((group, index) => (
            <div
              key={group.title}
              className={cn('px-6 py-5', index > 0 && 'border-t border-slate-100')}
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
      </section>

      {/*
        Where a buyer goes next. A detail page that offers only "back" makes the
        reader do the comparing; three nearby cars of the same powertrain does it
        for them. Compact rows rather than full cards, so it reads as a
        suggestion and not a second catalogue.
      */}
      {similar.length > 0 ? (
        <section className="mt-12 border-t border-slate-200 pt-10">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Similar cars</h2>
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
                      alt={carDisplayName(other)}
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

          <div className="mt-6 flex justify-center">
            <Link
              href={compareHref}
              className="inline-flex h-11 items-center gap-2 rounded-full border-[1.5px] border-slate-300 px-5 text-ui-sm font-semibold text-slate-700 transition-colors hover:border-slate-900"
            >
              Compare {carModelName(car)} with {similar[0] ? carModelName(similar[0]) : null}
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  )
}
