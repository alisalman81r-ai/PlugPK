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
 * Photograph on a stage, then brand, model, trim, the price on a line of its
 * own, three figures in a panel, and one quiet action. Every card is that
 * sequence at those sizes in that order — which is the point. A visitor
 * comparing nine cars is not reading nine cards, they are reading one card
 * nine times, and that only works if the battery figure is always in the same
 * place.
 *
 * ── What changed from the spec-sheet version, and why ─────────────────
 *
 * The previous card set its four figures as label/value rows with a hairline
 * under each and the price as the last of them. It was legible and it was
 * honest, and it read as an invoice: nine of them in a grid gave the page
 * thirty-six horizontal rules and no focal point. Three things were actually
 * wrong with it rather than merely plain.
 *
 *   1. THE PRICE WAS BEING TRUNCATED. Measured on the rendered grid, six of the
 *      forty-eight cards clipped it — "PKR 63–77 Lakh (ex-factory)" wanted
 *      240px and had 162px, "PKR 4,899,000 – 4,999,999" wanted 220px. The price
 *      shared a baseline with its own label in a justify-between row, so it
 *      could never have more than about two thirds of a 256px card. A truncated
 *      price is not a small visual flaw: it is the single number the whole card
 *      exists to deliver, and an ellipsis in the middle of it means the reader
 *      cannot tell a 63 Lakh car from a 63 Lakh one with conditions.
 *
 *      It now has a full-width line to itself with no label — "PKR" makes a
 *      label redundant — and any parenthetical qualifier drops to a quiet line
 *      beneath rather than competing for the same width.
 *
 *   2. THE FIGURES DID NOT NEED A HAIRLINE EACH. There were four rows with a
 *      rule under every one and the price as the fourth, so nine cards drew
 *      thirty-six horizontal lines and the card had no focal point. They are
 *      still rows — set side by side in three cells they truncated the range
 *      spans, which is measured in the figures block below — but there are
 *      three of them now rather than four, the rules are gone, and one soft
 *      panel groups them instead. Same information, a ninth of the lines.
 *
 *   3. FORTY-EIGHT FILLED NAVY BUTTONS. "View details" was a solid slab on
 *      every card, so the loudest thing on the page was the same instruction
 *      repeated four dozen times, and the actual differences between the cars
 *      were quieter than the furniture around them. The whole card is the link
 *      now — which is what a visitor already expects to be able to click — and
 *      the words stay as a quiet cue that animates on hover rather than a
 *      button competing with the photograph above it.
 *
 * ── The stage ─────────────────────────────────────────────────────────
 *
 * The photographs come from different sources and do not share a background:
 * some are white studio cut-outs, some are lit against dark grey, some are
 * location shots. Three of those in one row is the strongest single reason the
 * old grid looked assembled rather than designed.
 *
 * CSS cannot repair that — a filter that neutralised the dark backdrops would
 * also shift the cars' paint colour, which on a page whose job is to describe
 * cars accurately is not a trade worth making. What it can do is stop the card
 * from making it worse: the panel sits on a soft vertical stage with a vignette
 * rather than flat white, so a cut-out has something to stand on and a dark
 * photograph is a deliberate-looking dark panel instead of a hole. Genuinely
 * fixing it means re-shooting or re-sourcing on one ground.
 *
 * ── Surface ───────────────────────────────────────────────────────────
 *
 * Flat at rest — the site's graded hairline at this card's own 14px radius, no
 * shadow, on a grey page ground that does the separating. FRAME's resting
 * shadow is explicitly cleared: thirty-six shadows in one grid add up to a grey
 * haze, and a card already lifted has nowhere to go on hover. Hover is where
 * the elevation lives, and every part of it — rise, shadow, border, a 4% image
 * push — is transform, opacity or colour, so it stays on the compositor.
 *
 * ── What is not on the card ───────────────────────────────────────────
 *
 * `car.notes`. It used to print in a filled bar above the photograph, which
 * broke row alignment and spent four lines explaining that a full hybrid has no
 * plug. That belongs on the detail page, where it is. The card carries the two
 * facts from it that change a buying decision — a price that is indicative, a
 * car that cannot be plugged in — as chips, two words each, both derived from
 * the data rather than written.
 *
 * The category chip is now conditional, which is the same argument. Thirty-one
 * of the forty-eight cars are EVs, so an "EV" chip on all of them was ink that
 * told the reader nothing about the card they were looking at — while the
 * supporting line under the model already says "Fully electric" in words. The
 * chip appears when the powertrain is the exception (PHEV, REEV, Hybrid), which
 * is precisely when it carries information.
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
 * order of what changes a decision. Everything else is on the detail page, and
 * the figures below carry the ones that matter most.
 *
 * ── Why drive type leads the second part ───────────────────────────────
 *
 * It used to be the connector, and that was right when the alternative was an
 * acceleration time. It is not right at forty-eight cars: thirty of them carry
 * exactly ['CCS2', 'Type 2'], so a column of nine cards printed the same nine
 * words and the line became wallpaper — present on every card, telling the
 * reader nothing about the card they were looking at.
 *
 * `driveType` was null on every row when this was written and is now stated on
 * thirty-seven. FWD, RWD, AWD and 2WD/4WD actually differ card to card, they
 * are three or four characters so the line can never truncate on them, and on a
 * page that includes a pickup and two AWD SUVs it is a real distinction.
 *
 * The connector keeps its place in the chain, just below seats, so it still
 * surfaces on a row that states no drive type and no seat count. Nothing is
 * lost: the full connector list is a row of its own on the detail page.
 */
function supportingLine(car: Car): string {
  const extra = car.driveType
    ? car.driveType
    : car.seats
      ? `${car.seats} seats`
      : car.connector?.length
        ? car.connector.join(' / ')
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
 * Never more than two: a third starts to wrap on a 256px card, and there are
 * only ever two true ones here.
 *
 * The powertrain chip is conditional — see the note at the head of this file on
 * why an "EV" chip on thirty-one of forty-eight cards was ink spent saying
 * nothing. "Indicative" is read out of the price string rather than a flag
 * because that is where the data carries it; see the provenance note in
 * src/data/cars.ts. The qualifier is then stripped from the price below, so the
 * caveat appears once as a chip instead of twice in two registers.
 */
function chips(car: Car): Array<{ label: string; className: string }> {
  const out: Array<{ label: string; className: string }> = []

  if (car.category !== 'EV') {
    out.push({ label: car.category, className: CATEGORY_CHIP[car.category] })
  }

  if (/\((?:indicative|ex-factory)\)/i.test(car.price.display)) {
    out.push({
      label: /ex-factory/i.test(car.price.display) ? 'Ex-factory' : 'Indicative',
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

/**
 * Splits "PKR 63–77 Lakh (ex-factory)" into the figure and its qualifier.
 *
 * The qualifier is already a chip on the photograph, so what comes back here is
 * the price alone. It is returned rather than discarded because a card that
 * somehow has a qualifier with no matching chip should still say so somewhere
 * rather than silently drop a condition attached to a price.
 */
function splitPrice(display: string): { amount: string; qualifier: string | null } {
  const match = /^(.*?)\s*\(([^)]+)\)\s*$/.exec(display)
  if (!match?.[1]) return { amount: display.trim(), qualifier: null }
  return { amount: match[1].trim(), qualifier: match[2]?.trim() ?? null }
}

/**
 * The type size for a price, chosen so every price is one line.
 *
 * The prices in this catalogue are not the same length. Most are short — "PKR
 * 1.05 Cr", "PKR 55–68 Lakh" — but a handful span two units ("PKR 98.49 Lakh –
 * 1.03 Cr") and one states rupees rather than Lakh or Crore: the JMEV EV3 is
 * published as "PKR 4,899,000 – 4,999,999", twenty-five characters against the
 * fourteen of the median.
 *
 * At one fixed size that longest string wrapped to two lines at the tightest
 * column, which is 216px of content. A wrapped price is the thing this is
 * fixing: it makes one card in a row of three a different shape from its
 * neighbours, and it pushes everything below it down so the figure panels stop
 * lining up across the row — the alignment the whole card is built around.
 *
 * The alternative was to shorten the string in the data, and that is not
 * available. src/data/cars.ts carries a note on that exact row: the Premium is
 * priced at 4,999,999 rupees, one short of 50 lakh, and "PKR 48.99–50 Lakh"
 * would print a price nobody quoted. Rule 2 of that file forbids moving a
 * published figure to make it fit a layout, which is the correct priority — the
 * card is what should bend.
 *
 * So the size steps down instead, twice, and the thresholds come from measuring
 * the rendered grid rather than from arithmetic. Nineteen characters is the
 * longest that holds one line at 20px: twenty was tried and "PKR 84.99–99.99
 * Lakh" came out at 214px against the 210px its box actually offers, which is
 * only four pixels but it is four pixels into the card's padding. Twenty-two
 * holds at 17px. Anything longer takes 15px, where the 25-character outlier has
 * room to spare.
 *
 * A price that is a step smaller on one card in a row is a much smaller
 * inconsistency than a price on two lines: the size difference reads as the
 * number simply being longer, which it is, while the wrap read as a broken
 * card.
 */
function priceSize(amount: string): string {
  if (amount.length <= 19) return 'text-[1.25rem]'
  if (amount.length <= 22) return 'text-[1.0625rem]'
  return 'text-[0.9375rem]'
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
  const { amount, qualifier } = splitPrice(car.price.display)
  const cardChips = chips(car)

  return (
    <article
      className={cn(
        isCompared ? FRAME_FEATURED : FRAME,
        // The catalogue's own radius, not the marketing cards'. twMerge lets the
        // later class win, so this keeps a tighter corner than the 24px the
        // marketing cards use while still taking the site's graded edge. 14px
        // rather than the previous 12px: the card is taller now and a 12px
        // corner on a 560px card starts to read as square.
        'rounded-[0.875rem]',
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
          // The frame's radius minus its 1.5px padding, the same relationship
          // FACE already encodes for the 24px case.
          'overflow-hidden rounded-[calc(0.875rem-1.5px)]',
        )}
      >
        {/* ── Photograph ───────────────────────────────────────────
            First in the card and a ratio rather than a height, so the images in
            a row line up whatever else a car does or does not have, and nothing
            shifts while they load.

            4:3, opened up again from 7:5. The panel is the largest thing on a
            card and the first thing anybody looks at, and the figures below now
            cost 56px instead of 120px — that height is better spent here. 4:3
            is 1.33 against the source photographs' 1.50–1.78, so `cover` crops
            more off the sides than 7:5 did; object-center keeps the crop
            symmetrical, and a car photographed side-on loses background rather
            than bodywork. */}
        <div className="relative aspect-[4/3] shrink-0 overflow-hidden">
          {/* The stage. A vertical wash plus a vignette, under the photograph
              and above nothing — see the stage note at the head of the file for
              what this is compensating for and what it cannot fix. */}
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(to_bottom,#F8FAFC_0%,#F1F5F9_55%,#E7ECF3_100%)]"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_42%,rgba(255,255,255,0.85)_0%,transparent_70%)]"
          />

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

              SIXTEEN of the forty-eight cars have no licensed photograph — the
              three the images note in src/data/cars.ts describes, plus the 2026
              model-year rows added since — and the shared fallback is a very
              pale gradient with a 28px icon in the middle of it. Across a third
              of the grid that is 250px of near-white nothing, and in a row
              beside two photographs it reads as a card that failed to load
              rather than a car nobody has published a picture of.

              The brand wordmark at display size fills the panel deliberately
              and the caption says what is actually true. It sits on the same
              stage as a real panel, so the row still reads as a row. Still
              quieter than any photograph, so a real panel keeps winning its
              row. The fix is files, not CSS: drop a licensed image into
              /public/images/cars/<slug>.jpg and set `image` on the row.
            */
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <span
                aria-hidden="true"
                className="font-display text-[clamp(1.5rem,3.5vw,2rem)] font-bold leading-none tracking-tight text-slate-400"
              >
                {car.brand}
              </span>
              <span className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-slate-500">
                No photograph
              </span>
            </span>
          )}

          {/* A hairline along the bottom edge of the panel. The stage and the
              type block are close in value, and a light-bodied car meeting the
              content block with no line between them reads as the card having
              no image at all. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-px bg-slate-200/90"
          />

          {cardChips.length > 0 ? (
            <div className="pointer-events-none absolute left-3 top-3 z-20 flex max-w-[calc(100%-4.5rem)] flex-wrap gap-1.5">
              {cardChips.map((chip) => (
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
          ) : null}
        </div>

        {/* ── Type ─────────────────────────────────────────────────
            Brand quiet and small above, model at reading size and weight below.
            The model is what somebody is looking for — "Atto 3", not "BYD",
            since the brand is already the thing they filtered on to get here —
            so it gets the only piece of real typographic weight above the
            price. */}
        <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
          <p className="font-mono text-[0.625rem] font-medium uppercase leading-none tracking-[0.16em] text-slate-400">
            {car.brand}
          </p>

          {/* No anchor of its own any more. The whole card is the link — see the
              overlay at the foot of this component — and a nested anchor around
              the model would put a second tab stop and a second announced link
              on every card for the same destination. The colour still responds
              to hovering the card, because that transition is the cue that the
              heading is what you are about to open. */}
          <h3 className="mt-2 line-clamp-2 text-ui-lg font-semibold leading-snug tracking-[-0.012em] text-slate-900 transition-colors duration-200 group-hover:text-plug-blue-700">
            {car.model}
          </h3>

          {/*
            The trim, on its own line, only when the row declares one.

            Not appended to the h3. The model there is clamped to two lines and
            carries the card's only real typographic weight; "Seal 61.4 kWh RWD
            Comfort" at 17px semibold would eat both lines on a 256px card and
            push the model itself out of the clamp, so the thing a reader is
            scanning for would be the thing that got cut.

            truncate rather than wrap, for the same reason the line below it
            truncates: two cards in a row whose type blocks are different
            heights break the horizontal rhythm the figures depend on.
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

          {/* ── Price ─────────────────────────────────────────────
              A full-width line with no label, which is the fix for the
              truncation measured at the head of this file. "PKR" is its own
              label, so the word Price was spending a third of the width to
              repeat what the value already says.

              tabular-nums because Poppins' default digits are proportional, and
              a column of prices that do not align on their digits reads as a
              list of strings rather than a set of comparable amounts. */}
          <div className="mt-4">
            {/* A fixed 28px line box with the price sitting on its floor.

                The height has to be reserved rather than left to the type,
                because priceSize can set three different sizes and a 15px line
                box is 6px shorter than a 20px one — which would put that card's
                figure panel 6px above its neighbours' and undo half of what the
                one-line fix was for. Bottom-aligned so the baselines agree
                rather than the cap heights, since the baseline is the line the
                eye actually reads across a row.

                nowrap, and the sizes are chosen to make that safe: measured at
                1440, 1280, 1024 and 390, no price wraps and none overflows. */}
            <div className="flex h-7 items-end">
              <p
                className={cn(
                  'whitespace-nowrap font-bold leading-none tracking-[-0.02em] tabular-nums text-slate-900',
                  priceSize(amount),
                )}
              >
                {amount}
              </p>
            </div>
            {qualifier ? (
              <p className="mt-1.5 font-mono text-[0.5625rem] uppercase leading-none tracking-[0.12em] text-slate-400">
                {qualifier}
              </p>
            ) : null}
          </div>

          {/* ── The foot: figures, then actions ───────────────────
              Bottom-anchored as one group, and that is what makes the figure
              panels line up across a row.

              Not everything above this is the same height. The trim line is
              only there on cars that declare one, and the price qualifier only
              on the seven that carry one, so a card can be one or two lines
              taller than the card beside it before this point. Left to flow,
              the panels came out up to 21px apart within a single row —
              measured: "GIGI(panel@351, variant) EV3(panel@330) Box(panel@330)"
              — and a row of three panels at three different heights is the
              thing the card's whole alignment argument is against.

              Every card in a grid row is the same height, so anchoring this
              group to the bottom puts the panels and the actions at identical
              offsets on all three. The variable slack collects as whitespace
              above the panel instead, where it reads as breathing room rather
              than as a mistake. */}
          <div className="mt-auto pt-4">
            {/* ── The figures ───────────────────────────────────────
                Three rows in a tinted panel: label left, figure right, no rules.

                This was tried as three cells side by side and measured wrong. A
                third of a 256px card is 72px, and the range figures here are
                spans with a test cycle attached — "80–180 km NEDC" — so eleven of
                the forty-eight cards truncated their range to "80-1…". Trading a
                truncated price for a truncated range is not a redesign.

                Rows give the figure about 150px, which every value in the
                catalogue fits. What made the previous rows read as an invoice was
                not that they were rows: it was a hairline under each of four of
                them, with the price as the fourth, so nine cards in a grid drew
                thirty-six rules and had no focal point.

                So: the price is out of the list and above it at 20px, and there
                are three rows rather than four.

                What groups them is one hairline, not a fill. It was a tinted
                panel with an inset ring, and on the textured ground this section
                now has, that panel was the least considered thing on the card —
                a grey slab inside a white card reads as a disabled input, and
                nine of them tile the grid with grey rectangles. The objection
                recorded above was never to rules as such: it was to a rule under
                each of four rows, thirty-six in a grid. One rule per card is
                nine, it does the same grouping the fill was doing, and it is the
                same hairline the rest of the site uses to separate a block from
                the block above it.

                tabular-nums on the figures: Poppins' default digits are
                proportional, so a column of "45.12" over "380" over "65" would
                not align on the decimal. */}
            <dl className="border-t border-slate-200/90 pt-3">
              {specs.map((spec, index) => (
                <div
                  // Label, not value — two rows can share a figure ("380 km" and
                  // "380 hp" is unlikely but "—" and "—" is not), and a padded
                  // row has no label at all.
                  key={spec.label || `empty-${index}`}
                  className="flex items-baseline justify-between gap-3 py-[0.3125rem]"
                >
                  <dt className="shrink-0 font-mono text-[0.5625rem] uppercase leading-none tracking-[0.12em] text-slate-500">
                    {spec.short}
                  </dt>
                  <dd className="min-w-0 truncate font-mono text-ui-sm font-semibold leading-none tabular-nums text-slate-900">
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
            </dl>

            {/* ── Actions ───────────────────────────────────────────
                mt-auto, so the row sits on the bottom edge of every card however
                a model name wrapped above it.

                "View details" is a cue rather than a button now — the card itself
                is the link. It is not interactive and takes no tab stop; the
                overlay below is the one focusable target for the destination, so
                a keyboard user gets one stop per card instead of three.

                Compare stays a real control, 44px, because it does something the
                card does not. */}
            <div className="flex items-center justify-between gap-3 pt-5">
              <span
                aria-hidden="true"
                className="inline-flex items-center gap-1.5 text-ui-sm font-semibold text-slate-500 transition-colors duration-200 group-hover:text-plug-blue-700"
              >
                View details
                <ArrowRight
                  size={14}
                  className="transition-transform duration-300 ease-out group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                />
              </span>

              {onToggleCompare ? (
                <button
                  type="button"
                  onClick={() => onToggleCompare(car)}
                  // Disabled only when the tray is full AND this car is not in
                  // it, so a full tray can still be emptied from the cards.
                  disabled={compareDisabled && !isCompared}
                  aria-pressed={isCompared}
                  /* An accessible name as well as the icon: this control is an
                     icon alone at every width, and `title` is not a name a screen
                     reader reliably announces. */
                  aria-label={
                    isCompared
                      ? `Remove ${carDisplayName(car)} from comparison`
                      : compareDisabled
                        ? 'Comparison is full'
                        : `Add ${carDisplayName(car)} to comparison`
                  }
                  // z-20 and relative: the card-wide link overlay sits at z-10,
                  // and without this the overlay would swallow every click meant
                  // for this button.
                  className={cn(
                    'relative z-20 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border',
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

        {/* ── The card as a link ───────────────────────────────────
            One anchor covering the face, under the two real controls and above
            everything else.

            This replaces both the old filled "View details" button and the
            anchor that wrapped the model name, and it is why the card can be
            quiet: a visitor clicking a product card expects the card to open,
            so the instruction does not have to be shouted on forty-eight tiles.

            It carries the accessible name for the whole card, since the h3 it
            replaced is no longer a link. carDisplayName rather than the model
            alone: "Seal" twice in a list of links names neither trim.

            The focus ring is drawn on this element at the card's own radius, so
            tabbing through the grid outlines the card rather than a strip of
            text inside it. */}
        <Link
          href={href}
          aria-label={`${carDisplayName(car)} — view details`}
          className={cn(
            'absolute inset-0 z-10 rounded-[calc(0.875rem-1.5px)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2',
          )}
        />

        {/* The favourite control, last in the DOM so it lands above the overlay
            without a stacking trick, and outside any anchor — a button nested in
            an anchor is invalid and leaves the browser to decide which a tap
            meant, which is how the heart used to navigate instead of saving.
            44px, the touch-target floor. */}
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
    </article>
  )
}
