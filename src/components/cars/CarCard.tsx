// src/components/cars/CarCard.tsx
'use client'

import { ArrowRight, Check, GitCompareArrows, Heart } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

import { PhotoFrame } from '@/components/ui'
import type { Car, CarCategory } from '@/data/cars'
import { cardSpecs, carDisplayName } from '@/lib/cars'
import { FACE, FRAME, FRAME_FEATURED } from '@/components/shared/frame'
import { cn } from '@/lib/utils'

/**
 * One card, every car.
 *
 * ── The shape, and why it is this shape ───────────────────────────────
 *
 * Photograph first, then a fixed block of type: brand, model, a supporting
 * line, four label/value rows, two actions. Every card in the grid is that
 * sequence, at those sizes, in that order — which is the point. A visitor
 * comparing nine cars is not reading nine cards, they are reading one card nine
 * times, and the only way that works is if the battery figure is always in the
 * same place.
 *
 * Three decisions carry most of the design:
 *
 *   1. The photograph is the first element in the DOM, not the fourth. It used
 *      to sit below the name, the price and a bordered paragraph of caveat
 *      text, and that paragraph is present on some cars and absent on others —
 *      so two cards side by side had their photographs 100px apart vertically
 *      and the row read as broken. Nothing precedes the image now, so the images
 *      in a row are aligned by construction rather than by luck.
 *
 *   2. The figures are rows, not a divided strip of cells. The strip fitted
 *      three figures across the card and looked tidy at 390px, but it could not
 *      survive a third column — 78px per cell wraps "DC charging" onto two
 *      lines — and a cell with no figure had to be dropped, which is what made
 *      cards disagree about how many figures they had. Rows read down the card,
 *      cost no horizontal room, and a row with nothing published can say so.
 *
 *   3. Labels and figures are set in the mono face. It is loaded already and
 *      unused outside a few counters, and a technical micro-label in a
 *      monospace at 10px does something no sans at 10px does: it reads as
 *      instrument marking rather than as small body copy, and the values line
 *      up in a column because every digit is the same width. On a page of
 *      batteries and kilowatts that is the difference between a spec sheet and
 *      a paragraph.
 *
 * ── Surface ───────────────────────────────────────────────────────────
 *
 * Flat at rest: a hairline border, no shadow, on a grey page ground that does
 * the separating instead. The border is now the site's graded hairline, taken
 * from components/shared/frame at this card's own 12px radius rather than the
 * 24px the marketing cards use — the edge joins the system, the density does
 * not change. FRAME's resting shadow is explicitly cleared here, for the reason
 * in the next sentence. Shadows on every card in a 36-card grid add up to a
 * grey haze, and a card that is already lifted has nowhere to go on hover.
 * Hover is where the elevation lives — a 2px rise, a shadow, the border
 * darkening a step and the photograph easing up 4% — and all four are
 * transform/opacity/colour, so it stays on the compositor.
 *
 * ── What is not on the card ───────────────────────────────────────────
 *
 * `car.notes` is. It used to print in a filled bar above the photograph, which
 * is both what broke the row alignment and a poor use of the space: the Tiggo
 * Cross HEV's note is four lines of prose explaining that a full hybrid has no
 * plug. That belongs on the detail page, where it is, and the card carries the
 * two facts from it that change a buying decision — a price that is indicative,
 * a car that cannot be plugged in — as chips on the photograph. Two words each,
 * both derived from the data, neither invented.
 */

export interface CarCardProps {
  car: Car
  /** Compare state is owned by the browser above; this only reports clicks. */
  isCompared?: boolean
  onToggleCompare?: (car: Car) => void
  /** True when the comparison tray is full and this car is not in it. */
  compareDisabled?: boolean
  isFavourite?: boolean
  onToggleFavourite?: (car: Car) => void
  /**
   * Loads the photograph eagerly and at high priority.
   *
   * Set by the grid on its first row only. Without it next/image lazy-loads
   * every card, and the images above the fold — which are the largest thing on
   * the page and the whole reason somebody is looking at it — start downloading
   * after hydration rather than with the document.
   */
  priority?: boolean
}

/** The short token, coloured. The vocabulary of the segmented control above. */
const CATEGORY_CHIP: Record<CarCategory, string> = {
  EV: 'border-plug-blue-200/80 bg-plug-blue-50/95 text-plug-blue-700',
  PHEV: 'border-amber-200/80 bg-amber-50/95 text-amber-700',
  REEV: 'border-purple-200/80 bg-purple-50/95 text-purple-700',
  Hybrid: 'border-emerald-200/80 bg-emerald-50/95 text-emerald-700',
}

/** The same token spelled out, for the supporting line. */
const CATEGORY_LINE: Record<CarCategory, string> = {
  EV: 'Fully electric',
  PHEV: 'Plug-in hybrid',
  REEV: 'Range extender',
  Hybrid: 'Hybrid',
}

/**
 * The one line under the model name: the powertrain, and one more fact.
 *
 * Two parts, not four. The first draft joined everything the source had
 * published — powertrain, connector, 0–100, seats, top speed — and at 256px the
 * BYD Atto 2 came out as "Fully electric · CCS2 / Type 2 · 0–100 i…", clipped
 * mid-word. A line that truncates is worse than a shorter line: the reader
 * cannot tell whether the missing part mattered, and the ellipsis is noise on
 * every card in the column.
 *
 * The powertrain always leads, because it is the frame the figures below are
 * read inside. The second part is the first of these a car actually has, in
 * order of what changes a decision: which charger fits it, how many it seats,
 * how quickly it gets to 100, how fast it will go. Everything else is on the
 * detail page, and the figure rows below carry the four that matter most.
 */
function supportingLine(car: Car): string {
  const extra = car.connector?.length
    ? car.connector.join(' / ')
    : car.seats
      ? `${car.seats} seats`
      : car.acceleration
        ? `0–100 in ${car.acceleration}${car.accelerationUnit}`
        : car.topSpeed
          ? `${car.topSpeed} km/h`
          : null

  const powertrain = CATEGORY_LINE[car.category]
  return extra ? `${powertrain}  ·  ${extra}` : powertrain
}

/**
 * Chips for the photograph, in the order they matter.
 *
 * Never more than two: the reference this card is built on runs to two, a third
 * starts to wrap on a 256px card, and there are only ever two true ones here.
 *
 * "Indicative" is read out of the price string rather than a flag because that
 * is where the data carries it — see the provenance note in src/data/cars.ts.
 * The qualifier is then stripped from the figure below, so the caveat appears
 * once, as a chip, instead of twice in two registers.
 */
function chips(car: Car): Array<{ label: string; className: string }> {
  const out: Array<{ label: string; className: string }> = [
    { label: car.category, className: CATEGORY_CHIP[car.category] },
  ]

  if (/\(indicative\)/i.test(car.price.display)) {
    out.push({
      label: 'Indicative price',
      className: 'border-slate-300/80 bg-white/95 text-slate-600',
    })
  } else if (car.category === 'Hybrid') {
    /*
      Hybrid only, and that is load-bearing.

      This first read `category !== 'EV' && connector === null`, which put "No
      charging port" on the GWM Tank 500 PHEV — a plug-in hybrid, which has a
      port by definition. A null connector on a PHEV means the source did not
      state the standard, not that there is nowhere to plug it in, and the two
      are opposite claims about the car.

      A full hybrid genuinely cannot be charged: it makes its own electricity
      from the engine and from braking. That is the one thing somebody comparing
      it against an EV has to know before they read anything else on the card,
      and the data says it structurally — a Hybrid row carries null for
      dcCharging, acCharging and connector alike, for that reason. See the note
      at the end of the header in src/data/cars.ts.
    */
    out.push({
      label: 'No charging port',
      className: 'border-slate-300/80 bg-white/95 text-slate-600',
    })
  }

  return out
}

export function CarCard({
  car,
  isCompared,
  onToggleCompare,
  compareDisabled,
  isFavourite,
  onToggleFavourite,
  priority = false,
}: CarCardProps) {
  const specs = cardSpecs(car)
  const href = `/cars/${car.slug}`

  return (
    <article
      className={cn(
        isCompared ? FRAME_FEATURED : FRAME,
        // The catalogue's own radius, not the marketing cards'. twMerge lets the
        // later class win, so this keeps the tighter 12px corner a dense grid
        // wants while still taking the site's graded edge. FRAME's rounded-3xl
        // on a three-up grid beside a filter rail would read as a different
        // product.
        'rounded-xl',
        // Flat at rest, which the Surface note above insists on and is right
        // about: FRAME carries a resting shadow, and thirty-six of those in one
        // grid is the grey haze that note describes. Only the base shadow is
        // cleared — FRAME's hover shadow is a different property and survives,
        // so the elevation still lives where it was designed to, on hover.
        !isCompared && 'shadow-none',
        'motion-reduce:transition-none',
      )}
    >
      <div
        className={cn(
          FACE,
          // The frame's radius minus its 1.5px padding, same relationship FACE
          // already encodes for the 24px case.
          'overflow-hidden rounded-[calc(0.75rem-1.5px)]',
        )}
      >
      {/* ── Photograph ───────────────────────────────────────────
          First in the card and a ratio rather than a height, so the images in a
          row line up whatever else a car does or does not have, and nothing
          shifts while they load.

          3:2 because the source photographs are 1.50–1.78 — a squarer panel
          would crop the nose off a car that is already photographed side-on,
          and the brief was a hero image without awkward cropping. Cover, not
          contain: these are location photographs rather than studio cut-outs,
          so letterboxing them would frame the background as much as the car. */}
      <div className="relative aspect-[3/2] shrink-0 overflow-hidden bg-slate-100">
        <Link href={href} tabIndex={-1} aria-hidden="true" className="absolute inset-0 block">
          {car.image ? (
            <PhotoFrame
              src={car.image}
              alt=""
              /* Widest real column is ~440px at 1440 and the panel is capped by
                 the grid, so 480px is the largest candidate worth shipping. */
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 480px"
              priority={priority}
              zoomOnHover
            />
          ) : (
            /*
              A stated absence rather than PhotoFrame's shared fallback.

              Three of the cars have no licensed photograph on Commons — see the
              images note in src/data/cars.ts — and the shared fallback is a very
              pale gradient with a 28px icon in the middle of it. At 3:2 across a
              third of the grid that is 250px of near-white nothing, and in a row
              beside two photographs it reads as a card that failed to load
              rather than a car nobody has published a picture of.

              The brand wordmark at display size fills the panel deliberately,
              and the caption says what is actually true. Same ground and the
              same hairline as a real panel, so the row still reads as a row.
            */
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-slate-50 to-slate-100">
              <span
                aria-hidden="true"
                className="font-display text-[clamp(1.5rem,3.5vw,2rem)] font-bold leading-none tracking-tight text-slate-300"
              >
                {car.brand}
              </span>
              <span className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-slate-400">
                No photograph
              </span>
            </span>
          )}
        </Link>

        {/* A hairline along the bottom edge of the panel, over the photograph.
            The panel and the type block are the same white otherwise, and a
            light-bodied car meeting the content block with no line between them
            reads as the card having no image at all. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-slate-200/90"
        />

        <div className="pointer-events-none absolute left-3 top-3 z-10 flex max-w-[calc(100%-4.5rem)] flex-wrap gap-1.5">
          {chips(car).map((chip) => (
            <span
              key={chip.label}
              className={cn(
                'inline-flex items-center rounded-md border px-2 py-1 font-mono text-[0.5625rem]',
                'font-medium uppercase leading-none tracking-[0.1em] backdrop-blur-sm',
                chip.className,
              )}
            >
              {chip.label}
            </span>
          ))}
        </div>

        {/* Outside the Link, not inside it. A button nested in an anchor is
            invalid and leaves the browser to decide which a tap meant — the
            heart used to navigate instead of saving. 44px, the touch-target
            floor, and the smallest control on the card. */}
        {onToggleFavourite ? (
          <button
            type="button"
            onClick={() => onToggleFavourite(car)}
            aria-pressed={isFavourite}
            /* carDisplayName, not fullName: with two trims of one car saved,
               "Remove BYD Seal from saved" twice names neither of them. */
            aria-label={
              isFavourite
                ? `Remove ${carDisplayName(car)} from saved`
                : `Save ${carDisplayName(car)}`
            }
            className={cn(
              'absolute right-2.5 top-2.5 z-20 flex h-11 w-11 items-center justify-center rounded-full',
              'bg-white/90 shadow-[0_2px_10px_rgba(15,23,42,0.10)] ring-1 ring-slate-900/[0.06] backdrop-blur-md',
              'transition-[background-color,transform] duration-200 hover:bg-white active:scale-95',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500',
              'motion-reduce:transition-none',
            )}
          >
            <Heart
              size={16}
              /* Filled when saved. An outline that only changes colour is hard
                 to read at 16px, and this is the one control whose state the
                 visitor needs to see at a glance. */
              className={cn(
                'transition-colors duration-200',
                isFavourite ? 'fill-rose-500 text-rose-500' : 'text-slate-500',
              )}
              aria-hidden="true"
            />
          </button>
        ) : null}
      </div>

      {/* ── Type ─────────────────────────────────────────────────
          Brand quiet and small above, model at reading size and weight below.
          The model is what somebody is looking for — "Atto 3", not "BYD", since
          the brand is already the thing they filtered on to get here — so it
          gets the only piece of real typographic weight above the price. */}
      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <p className="font-mono text-[0.625rem] font-medium uppercase leading-none tracking-[0.16em] text-slate-400">
          {car.brand}
        </p>

        <h3 className="mt-2 text-ui-lg font-semibold leading-snug tracking-[-0.012em] text-slate-900">
          <Link
            href={href}
            className={cn(
              'line-clamp-2 rounded transition-colors duration-200 hover:text-plug-blue-700',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2',
            )}
          >
            {car.model}
          </Link>
        </h3>

        {/*
          The trim, on its own line, only when the row declares one.

          Not appended to the h3. The model there is clamped to two lines and
          carries the card's only real typographic weight; "Seal 61.4 kWh RWD
          Comfort" at 17px semibold would eat both lines on a 256px card and push
          the model itself out of the clamp, so the thing a reader is scanning for
          would be the thing that got cut.

          A separate line at the supporting size keeps the reference's hierarchy
          intact — model strong, trim quieter beneath it — and reuses the slot
          that was already designed for exactly this: "Variant → smaller
          supporting text". Undeclared rows render nothing here and are pixel-for-
          pixel unchanged.

          truncate rather than wrap, for the same reason the line below it
          truncates: two cards in a row whose type blocks are different heights
          break the horizontal rhythm the figure rows depend on.
        */}
        {car.variant ? (
          <p
            className="mt-1 truncate font-mono text-[0.6875rem] leading-normal text-slate-500"
            title={car.variant}
          >
            {car.variant}
          </p>
        ) : null}

        {/*
          slate-500 rather than slate-400, measured: slate-400 on white is
          2.56:1, under the 4.5:1 AA floor, and 11px gets no large-text
          exemption. slate-500 is 4.76:1.
        */}
        <p className="mt-1.5 truncate text-ui-xs leading-relaxed text-slate-500">
          {supportingLine(car)}
        </p>

        {/* ── The figures ───────────────────────────────────────
            Label left, figure right, a hairline under each. Always four rows —
            three specs and the price — so the price sits on the same baseline
            on every card in the grid and the column of figures can be read
            straight down without the eye re-finding it each time.

            tabular-nums on the figures: Poppins' default digits are
            proportional, so a column of "45.12" over "380" over "65" would not
            align on the decimal. */}
        <dl className="mt-4 border-t border-slate-100">
          {specs.map((spec, index) => (
            <div
              // Label, not value — two rows can share a figure ("380 km" and
              // "380 hp" is unlikely but "—" and "—" is not), and a padded row
              // has no label at all.
              key={spec.label || `empty-${index}`}
              className="flex items-baseline justify-between gap-3 border-b border-slate-100 py-2.5"
            >
              <dt className="shrink-0 font-mono text-[0.625rem] uppercase leading-none tracking-[0.12em] text-slate-500">
                {spec.label}
              </dt>
              <dd className="min-w-0 truncate font-mono text-ui-sm font-medium tabular-nums text-slate-900">
                {spec.figure ? (
                  <>
                    {spec.figure}
                    {spec.unit ? (
                      <span className="ml-1 font-normal text-slate-500">{spec.unit}</span>
                    ) : null}
                  </>
                ) : (
                  // An em dash, and said out loud for a screen reader — a
                  // stated absence rather than a blank cell that could be a
                  // rendering fault. Never a zero, never a likely number.
                  <span className="text-slate-400">
                    <span aria-hidden="true">—</span>
                    <span className="sr-only">Not published</span>
                  </span>
                )}
              </dd>
            </div>
          ))}

          {/* The price, as the last row of the same list.
              Same rhythm, three times the type size — which is what makes it
              the anchor of the card without needing a panel, a colour or a rule
              of its own. The published wording, minus the qualifier that is now
              a chip on the photograph. */}
          <div className="flex items-baseline justify-between gap-3 border-b border-slate-100 py-3">
            <dt className="shrink-0 font-mono text-[0.625rem] uppercase leading-none tracking-[0.12em] text-slate-500">
              Price
            </dt>
            <dd className="min-w-0 truncate text-ui-lg font-bold leading-none tracking-[-0.015em] text-slate-900">
              {car.price.display.replace(/\s*\(indicative\)\s*/i, '')}
            </dd>
          </div>
        </dl>

        {/* ── Actions ───────────────────────────────────────────
            mt-auto, so the pair sits on the bottom edge of every card in the
            row however a model name wrapped above it. Both 44px tall with 8px
            between them: the touch-target floor and the minimum spacing for
            adjacent targets — below that a thumb aiming at Compare catches View
            details often enough to matter. */}
        <div className="mt-auto flex items-center gap-2 pt-4">
          <Link
            href={href}
            className={cn(
              'group/cta inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg',
              'bg-slate-900 px-4 text-ui-sm font-semibold text-white',
              'transition-colors duration-200 hover:bg-plug-blue-700',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2',
              'motion-reduce:transition-none',
            )}
          >
            View details
            <ArrowRight
              size={14}
              aria-hidden="true"
              className="transition-transform duration-300 ease-out group-hover/cta:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover/cta:translate-x-0"
            />
          </Link>

          {onToggleCompare ? (
            <button
              type="button"
              onClick={() => onToggleCompare(car)}
              // Disabled only when the tray is full AND this car is not in it,
              // so a full tray can still be emptied from the cards.
              disabled={compareDisabled && !isCompared}
              aria-pressed={isCompared}
              /* An accessible name as well as the icon: this control is an icon
                 alone at every width now, and `title` is not a name a screen
                 reader reliably announces. */
              aria-label={
                isCompared
                  ? `Remove ${carDisplayName(car)} from comparison`
                  : compareDisabled
                    ? 'Comparison is full'
                    : `Add ${carDisplayName(car)} to comparison`
              }
              className={cn(
                'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border',
                'transition-colors duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-40',
                isCompared
                  ? 'border-plug-blue-500 bg-plug-blue-50 text-plug-blue-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-900 hover:text-slate-900',
              )}
            >
              {isCompared ? (
                <Check size={16} aria-hidden="true" />
              ) : (
                <GitCompareArrows size={16} aria-hidden="true" />
              )}
            </button>
          ) : null}
        </div>
      </div>
    </div>
    </article>
  )
}
