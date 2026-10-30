// src/components/cars/CarCard.tsx
'use client'

import { ArrowRight, Check, GitCompareArrows, Heart, Zap } from '@/components/ui/icons'
import Link from 'next/link'
import * as React from 'react'

import { PhotoFrame } from '@/components/ui'
import type { Car, CarCategory } from '@/data/cars'
import { bodyStyle, carDisplayName, electricDistance, electricDistanceMax, formatPkr, formatSpan } from '@/lib/cars'
import { cn } from '@/lib/utils'

/**
 * One card, every car: the car large, then its name, one line of context, the
 * one figure that decides most shortlists, and the price.
 *
 * ── The showroom card ─────────────────────────────────────────────────
 *
 * The photographs are studio cut-outs on white. Drawn with `mix-blend-multiply`
 * on the card's own grey, the white drops out and the car stands on the card
 * itself rather than in a white box inside it — which is what lets the car be
 * the largest thing on the card without the card looking like a frame around
 * a picture.
 *
 * ── What it carries, and in what order ────────────────────────────────
 *
 * Model in display weight, then "brand · body · trim", then the electric range
 * (the figure most buyers filter on), a hairline, and the price with a "from"
 * over it. Every card is that sequence at those sizes, so a grid reads as one
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
function chips(car: Car): string[] {
  const out: string[] = []
  if (car.category !== 'EV') out.push(car.category)
  if (/\(indicative\)/i.test(car.price.display)) out.push('Indicative')
  else if (car.category === 'Hybrid') out.push('No plug')
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
        'group relative flex flex-col overflow-hidden rounded-[1.75rem] bg-slate-100',
        'transition-[box-shadow,transform] duration-300 ease-out',
        'hover:-translate-y-1 hover:shadow-[0_24px_48px_-28px_rgba(5,36,30,0.35)]',
        'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        isCompared && 'ring-2 ring-plug-cyan-500 ring-offset-2 ring-offset-slate-50',
      )}
    >
      {/* ── The car ──────────────────────────────────────────────
          A fixed ratio, so every image in a row lines up whatever loads first.
          The car is contained rather than cropped: a card that cuts off a
          bumper is showing less of the one thing it is for. */}
      <div className="relative aspect-[16/10]">
        {car.image ? (
          <div className="absolute inset-x-4 bottom-0 top-5 sm:inset-x-5 sm:top-6">
            {/* Scaled up a step: the cut-outs carry their own white margin,
                and at 1:1 the car filled barely half the card. */}
            <PhotoFrame
              src={car.image}
              alt=""
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 440px"
              priority={priority}
              className="overflow-visible bg-transparent"
              imageClassName="object-contain mix-blend-multiply scale-[1.12] transition-transform duration-500 ease-out group-hover:scale-[1.17] motion-reduce:transition-none"
            />
          </div>
        ) : (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <span aria-hidden="true" className="font-display text-[2rem] font-bold leading-none tracking-tight text-slate-300">
              {car.brand}
            </span>
            <span className="text-ui-xs font-medium uppercase tracking-[0.14em] text-slate-500">No photograph yet</span>
          </span>
        )}

        {cardChips.length > 0 ? (
          <div className="pointer-events-none absolute left-4 top-4 z-20 flex gap-1.5 sm:left-5 sm:top-5">
            {cardChips.map((chip) => (
              <span
                key={chip}
                className="rounded-full bg-white/85 px-2.5 py-1 text-ui-xs font-bold uppercase leading-none tracking-[0.08em] text-slate-700 shadow-[0_1px_2px_rgba(5,36,30,0.06)] backdrop-blur"
              >
                {chip}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {/* ── Name, context, the figure ───────────────────────────── */}
      <div className="flex flex-1 flex-col px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
        <h3 className="truncate font-display text-[1.375rem] font-extrabold leading-tight tracking-[-0.02em] text-slate-900 sm:text-[1.5rem]">
          {car.model}
        </h3>
        <p className="mt-1 truncate text-ui-sm text-slate-600" title={meta}>
          {meta}
        </p>

        {lead ? (
          <p className="mt-3 flex items-center gap-2 text-ui-sm text-slate-500">
            <Zap size={16} aria-hidden="true" className="shrink-0 text-plug-cyan-700" />
            <span>
              <span className="font-bold tabular-nums text-slate-900">{lead.figure}</span> {lead.words}
            </span>
          </p>
        ) : null}

        {/* ── Price ─────────────────────────────────────────────
            mt-auto with the hairline, so the price rows of a grid row share a
            baseline however the lines above them came out. */}
        <div className="mt-auto pt-4">
          <div className="flex items-end justify-between gap-4 border-t border-slate-300/60 pt-4">
            <div className="min-w-0">
              <p className="text-ui-xs font-bold uppercase leading-none tracking-[0.14em] text-slate-500">
                {ranged ? 'From' : 'Price'}
              </p>
              <p className="mt-2 flex items-baseline gap-1.5 whitespace-nowrap leading-none">
                <span className="text-ui-sm font-semibold text-slate-400">PKR</span>
                <span className="font-display text-[1.625rem] font-extrabold tabular-nums tracking-[-0.025em] text-slate-900 sm:text-[1.75rem]">
                  {priceFigure(car)}
                </span>
              </p>
            </div>

            <span
              aria-hidden="true"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-dark-base text-white transition-[background-color,transform] duration-300 ease-out group-hover:bg-plug-blue-600 group-hover:-rotate-45 motion-reduce:transition-none motion-reduce:group-hover:rotate-0"
            >
              <ArrowRight size={20} />
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
        className="absolute inset-0 z-10 rounded-[1.75rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
      />

      {/* ── Save and compare ─────────────────────────────────────
          Last in the DOM so they sit above the link without a stacking trick,
          and outside it: a button inside an anchor leaves the browser to decide
          which a tap meant. */}
      {onToggleFavourite || onToggleCompare ? (
        <div className="absolute right-3 top-3 z-20 flex flex-col gap-1.5 sm:right-4 sm:top-4">
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
                className={cn('transition-colors', isFavourite ? 'fill-rose-500 text-rose-500' : 'text-slate-600')}
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
              className={cn(ROUND, isCompared ? 'bg-plug-cyan-500 text-plug-navy-950 hover:bg-plug-cyan-400' : REVEAL)}
            >
              {isCompared ? <Check size={17} aria-hidden="true" /> : <GitCompareArrows size={17} aria-hidden="true" />}
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

/** The save and compare buttons: 44px, frosted. */
const ROUND = cn(
  'flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-slate-600 backdrop-blur',
  'shadow-[0_1px_2px_rgba(5,36,30,0.06)] transition-[background-color,transform,opacity] duration-200',
  'hover:bg-white hover:text-slate-900 active:scale-95',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500',
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
