// src/components/cars/CarCard.tsx
'use client'

import { ArrowRight, Check, GitCompareArrows, Heart, Zap } from '@/components/ui/icons'
import Link from 'next/link'
import * as React from 'react'

import type { Car, CarCategory } from '@/data/cars'
import { bodyStyle, carDisplayName, electricDistance, electricDistanceMax, formatPkr, formatSpan } from '@/lib/cars'
import { cn } from '@/lib/utils'

import { CarPhoto } from './car-motion'
import { CAR_HOVER, PHOTO_HOVER, STAGE, STAGE_CHIP, STAGE_CHIP_TONE, STAGE_HOVER, type StageChipTone } from './car-ui'

/**
 * One card, every car (landing-v2's .car): the car on a lit stage, then its
 * name, one line of context, the one figure that decides most shortlists, and
 * the price.
 *
 * The photographs are studio cut-outs on white. Drawn with `mix-blend-multiply`
 * on the stage, the white drops out and the car stands in the light rather than
 * in a white box.
 *
 * Every card is the same sequence at the same sizes, so a grid reads as one
 * card repeated and the prices line up across a row.
 *
 * The whole card is one link. Save and compare are real buttons above it,
 * small and quiet, because they do something the card does not.
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
  /** Loads the photograph eagerly: set by the grid on its first row only. */
  priority?: boolean
}

/**
 * Chips on the photograph, two at most.
 *
 * The powertrain only when it is the exception — most of the catalogue is
 * electric, and "EV" on every card says nothing about any of them. A price
 * qualifier, or a full hybrid's lack of a plug, because each changes what the
 * figures below mean.
 */
function chips(car: Car): Array<{ label: string; tone: StageChipTone }> {
  const out: Array<{ label: string; tone: StageChipTone }> = []
  if (car.category !== 'EV') out.push({ label: car.category, tone: 'powertrain' })
  if (/\(indicative\)/i.test(car.price.display)) out.push({ label: 'Indicative', tone: 'indicative' })
  else if (car.category === 'Hybrid') out.push({ label: 'No plug', tone: 'noplug' })
  return out
}

const RANGE_NOUN: Record<CarCategory, string> = {
  EV: 'km range',
  PHEV: 'km electric range',
  REEV: 'km electric range',
  Hybrid: '',
}

/**
 * The one figure under the name: electric range where there is one, else the
 * battery, else power. Returned as figure and words so the figure can be set
 * bold.
 */
function headline(car: Car): { figure: string; words: string } | null {
  const reach = formatSpan(electricDistance(car), electricDistanceMax(car), '')?.trim()
  if (reach && car.category !== 'Hybrid') return { figure: reach, words: RANGE_NOUN[car.category] }
  if (car.batteryCapacity) return { figure: String(car.batteryCapacity), words: 'kWh battery' }
  if (car.power) return { figure: String(car.power), words: 'hp' }
  return null
}

/**
 * "89.9 Lakh", from the lowest published price.
 *
 * The figure comes from the integer rather than the display string, so a span
 * like "PKR 63–77 Lakh" reads as "from 63 Lakh" and every card prints the
 * same shape of number. "PKR" is set apart, small, as the unit.
 */
function priceFigure(car: Car): string {
  return formatPkr(car.price.min).replace(/^PKR\s*/, '')
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
  const href = `/cars/${car.slug}`
  const name = carDisplayName(car)
  const meta = [car.brand, bodyStyle(car), car.variant].filter(Boolean).join(' · ')
  const lead = headline(car)
  const cardChips = chips(car)
  const ranged = car.price.min !== car.price.max

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-[28px] border border-ink/10 bg-white shadow-e1',
        // .car:hover — the CSS translate property, so it never fights the
        // transform the grid's entrance tween writes on the list item.
        CAR_HOVER,
        isCompared && 'border-ink ring-2 ring-volt',
      )}
    >
      {/* ── The car on its stage ───────────────────────────────────
          A fixed ratio, so every image in a row lines up whatever loads first.
          Contained rather than cropped: a card that cuts off a bumper is
          showing less of the one thing it is for. */}
      <div className={cn(STAGE, 'mx-2 mt-2 aspect-[16/11] rounded-[22px]', STAGE_HOVER)}>
        {car.image ? (
          <CarPhoto
            src={car.image}
            alt=""
            sizes="(max-width: 420px) 92vw, (max-width: 1100px) 46vw, 420px"
            priority={priority}
            className="inset-x-[6%] bottom-[2%] top-[4%]"
            imageClassName={PHOTO_HOVER}
          />
        ) : (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <span aria-hidden="true" className="font-display text-[2rem] leading-none text-ink/20">
              {car.brand}
            </span>
            <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">No photograph yet</span>
          </span>
        )}

        {cardChips.length > 0 ? (
          <div className="pointer-events-none absolute left-3 top-3 z-20 flex flex-wrap gap-[5px]">
            {cardChips.map((chip) => (
              <span key={chip.label} className={cn(STAGE_CHIP, STAGE_CHIP_TONE[chip.tone])}>
                {chip.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {/* ── Name, context, the figure ───────────────────────────── */}
      <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5 sm:px-5 sm:pb-[18px] sm:pt-[18px]">
        <h3 className="truncate font-display text-[clamp(22px,1.8vw,27px)] leading-[1.06] text-ink">{car.model}</h3>
        <p className="mt-1.5 truncate text-[13.5px] leading-[1.45] text-muted" title={meta}>
          {meta}
        </p>

        {lead ? (
          <p className="mt-3 flex items-center gap-[7px] text-[13px] leading-[1.3] text-muted">
            <Zap aria-hidden="true" className="h-[15px] w-[15px] shrink-0 fill-volt-ink text-volt-ink" />
            <span>
              <b className="font-mono text-[13.5px] font-semibold tabular-nums text-ink">{lead.figure}</b> {lead.words}
            </span>
          </p>
        ) : null}

        {/* ── Price ─────────────────────────────────────────────
            mt-auto with the hairline, so the price rows of a grid row share a
            baseline however the lines above them came out. */}
        <div className="mt-auto pt-4">
          <div className="flex items-end justify-between gap-3 border-t border-ink/10 pt-4">
            <div className="min-w-0">
              <span className="block font-mono text-[10.5px] font-semibold uppercase leading-none tracking-[0.16em] text-muted">
                {ranged ? 'From' : 'Price'}
              </span>
              <p className="mt-[7px] whitespace-nowrap font-mono text-[clamp(20px,1.7vw,24px)] font-semibold leading-none tracking-[-0.02em] tabular-nums text-ink [word-spacing:-0.3em]">
                <small className="mr-[5px] align-[2px] text-[11px] tracking-[0.06em] text-muted">PKR</small>
                {priceFigure(car)}
              </p>
            </div>

            <span
              aria-hidden="true"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-white [transition:background-color_.3s,color_.3s,transform_.45s_cubic-bezier(.34,1.56,.64,1)] group-hover:bg-volt group-hover:text-ink"
            >
              <ArrowRight
                size={18}
                className="[transition:transform_.45s_cubic-bezier(.34,1.56,.64,1)] group-hover:-rotate-45"
              />
            </span>
          </div>
        </div>
      </div>

      {/* The card as one link, under the two buttons and above everything else.
          It carries the card's accessible name, with the trim, so two trims of
          one car are two different links to a screen reader. */}
      <Link
        href={href}
        aria-label={`${name}, ${car.price.display}`}
        className="absolute inset-0 z-10 rounded-[28px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
      />

      {/* ── Save and compare ─────────────────────────────────────
          Last in the DOM so they sit above the link without a stacking trick,
          and outside it: a button inside an anchor leaves the browser to decide
          which a tap meant. */}
      {onToggleFavourite || onToggleCompare ? (
        <div className="absolute right-4 top-4 z-20 flex flex-col gap-1.5">
          {onToggleFavourite ? (
            <button
              type="button"
              onClick={() => onToggleFavourite(car)}
              aria-pressed={isFavourite}
              aria-label={isFavourite ? `Remove ${name} from saved` : `Save ${name}`}
              className={cn(ROUND, isFavourite ? 'bg-white' : REVEAL)}
            >
              <Heart
                size={17}
                aria-hidden="true"
                className={cn('transition-colors', isFavourite ? 'fill-ember text-ember' : 'text-ink')}
              />
            </button>
          ) : null}
          {onToggleCompare ? (
            <button
              type="button"
              onClick={() => onToggleCompare(car)}
              // Disabled only when the tray is full and this car is not in it,
              // so a full tray can still be emptied from the cards.
              disabled={compareDisabled && !isCompared}
              aria-pressed={isCompared}
              aria-label={
                isCompared
                  ? `Remove ${name} from comparison`
                  : compareDisabled
                    ? 'Comparison is full'
                    : `Add ${name} to comparison`
              }
              className={cn(ROUND, isCompared ? 'border-ink bg-ink text-volt hover:bg-ink' : REVEAL)}
            >
              {isCompared ? <Check size={17} aria-hidden="true" /> : <GitCompareArrows size={17} aria-hidden="true" />}
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

/** The save and compare buttons: 44px, white, hairline. */
const ROUND = cn(
  'grid h-11 w-11 place-items-center rounded-full border border-ink/10 bg-white/85 text-ink backdrop-blur',
  'shadow-e1 transition-[background-color,transform,opacity] duration-200',
  'hover:bg-white active:scale-95',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink',
  'disabled:cursor-not-allowed disabled:opacity-40',
)

/*
  Hidden until the card is hovered, on a device that can hover — so a grid at
  rest shows cars rather than two dozen pairs of buttons. Always shown on touch,
  where there is no hover to reveal them, and whenever one has keyboard focus.
  A saved or compared car keeps its button showing, since that is its state.
*/
const REVEAL =
  '[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-visible:opacity-100'
