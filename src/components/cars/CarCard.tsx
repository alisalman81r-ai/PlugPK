// src/components/cars/CarCard.tsx
'use client'

import { ArrowRight, BatteryCharging, Check, GitCompareArrows, Plug, Route, Zap } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

import { CAP_RULE, FACE, FRAME } from '@/components/shared/frame'
import { AnimatedIcon, Badge, PhotoFrame, type BadgeVariant } from '@/components/ui'
import type { Car, CarCategory } from '@/data/cars'
import { headlineSpecs } from '@/lib/cars'
import { cn } from '@/lib/utils'

/**
 * One card, every car.
 *
 * Built on the same FRAME/FACE treatment as the ecosystem grid and the partner
 * cards, so a new section does not arrive with its own idea of what a card looks
 * like. The image uses PhotoFrame, which already renders a fallback rather than
 * a broken <Image> when `src` is undefined — which is every car until real
 * photography exists.
 *
 * The spec row is whatever headlineSpecs() returns for that powertrain: an EV
 * shows battery, range and charging speeds, a PHEV shows battery, electric range
 * and engine. Nothing renders an empty row, so a car with only a price and an
 * engine size looks deliberately sparse rather than broken.
 */

export interface CarCardProps {
  car: Car
  /** Compare state is owned by the browser above; this only reports clicks. */
  isCompared?: boolean
  onToggleCompare?: (car: Car) => void
  /** True when the comparison tray is full and this car is not in it. */
  compareDisabled?: boolean
}

const CATEGORY_VARIANT: Record<CarCategory, BadgeVariant> = {
  EV: 'blue',
  PHEV: 'amber',
  REEV: 'purple',
  Hybrid: 'green',
}

/** Matched to what the figure means, so the row scans without reading labels. */
const SPEC_ICON: Record<string, typeof Zap> = {
  Battery: BatteryCharging,
  Range: Route,
  'Electric range': Route,
  'DC charging': Zap,
  'AC charging': Plug,
  Engine: Zap,
  Power: Zap,
}

export function CarCard({ car, isCompared, onToggleCompare, compareDisabled }: CarCardProps) {
  const specs = headlineSpecs(car)

  return (
    <div className={FRAME}>
      <div className={cn(FACE, 'overflow-hidden')}>
        {/* A ratio rather than a height, so the card keeps its proportion as
            the column narrows. */}
        <Link
          href={`/cars/${car.slug}`}
          className="relative block aspect-[16/10] shrink-0 overflow-hidden bg-slate-50"
        >
          <PhotoFrame
            src={car.image ?? undefined}
            alt={car.fullName}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
            zoomOnHover
          />

          <span className="absolute left-3 top-3 z-10">
            <Badge variant={CATEGORY_VARIANT[car.category]} size="sm">
              {car.category}
            </Badge>
          </span>
        </Link>

        <div className="flex flex-1 flex-col p-5">
          <span className="text-ui-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            {car.brand}
          </span>

          <h3 className="mt-1.5 text-lg font-bold leading-snug tracking-tight text-slate-900">
            <Link href={`/cars/${car.slug}`} className="hover:text-plug-blue-700">
              {car.model}
            </Link>
          </h3>

          <span aria-hidden="true" className={cn('mt-4 block', CAP_RULE)} />

          <p className="mt-4 text-xl font-black tracking-tight text-slate-900">
            {car.price.display}
          </p>

          {specs.length > 0 ? (
            <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-slate-100 pt-4">
              {specs.map((spec) => {
                const Icon = SPEC_ICON[spec.label] ?? Zap

                return (
                  <div key={spec.label} className="min-w-0">
                    <dt className="flex items-center gap-1.5 text-ui-xs text-slate-400">
                      <Icon size={11} className="shrink-0" aria-hidden="true" />
                      <span className="truncate">{spec.label}</span>
                    </dt>
                    <dd className="mt-0.5 truncate text-ui-sm font-semibold text-slate-900">
                      {spec.value}
                    </dd>
                  </div>
                )
              })}
            </dl>
          ) : null}

          <div className="mt-5 flex items-center gap-2 pt-1">
            <Link
              href={`/cars/${car.slug}`}
              className="group/cta inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 text-ui-sm font-semibold text-white transition-colors duration-200 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
            >
              View details
              <AnimatedIcon motion="travel">
                <ArrowRight size={14} aria-hidden="true" />
              </AnimatedIcon>
            </Link>

            {onToggleCompare ? (
              <button
                type="button"
                onClick={() => onToggleCompare(car)}
                // Disabled only when the tray is full AND this car is not in it,
                // so a full tray can still be emptied from the cards.
                disabled={compareDisabled && !isCompared}
                aria-pressed={isCompared}
                title={
                  isCompared
                    ? 'Remove from comparison'
                    : compareDisabled
                      ? 'Comparison is full'
                      : 'Add to comparison'
                }
                className={cn(
                  'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border-[1.5px] px-3 text-ui-sm font-semibold transition-colors duration-200',
                  'disabled:cursor-not-allowed disabled:opacity-40',
                  isCompared
                    ? 'border-plug-blue-500 bg-blue-50 text-plug-blue-700'
                    : 'border-slate-300 text-slate-600 hover:border-slate-900',
                )}
              >
                {isCompared ? (
                  <Check size={14} aria-hidden="true" />
                ) : (
                  <GitCompareArrows size={14} aria-hidden="true" />
                )}
                <span className="sr-only sm:not-sr-only">
                  {isCompared ? 'Added' : 'Compare'}
                </span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
