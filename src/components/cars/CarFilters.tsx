// src/components/cars/CarFilters.tsx
'use client'

import * as React from 'react'

import type { CarCategory, ConnectorStandard } from '@/data/cars'
import { formatPkr, type CarFilterState } from '@/lib/cars'
import { cn } from '@/lib/utils'

/**
 * The filter panel, shared by the desktop sidebar and the mobile drawer.
 *
 * One component for both: the drawer in CarsBrowser renders this same tree, so
 * a filter added here appears in both places and cannot drift between them.
 * It is presentational — every value comes in as a prop and every change goes
 * out through onChange, so the browser above stays the single owner of state
 * and the URL or a reset button can drive it just as easily as a click.
 */

export interface CarFiltersProps {
  filters: CarFilterState
  onChange: (next: CarFilterState) => void
  brands: string[]
  categories: CarCategory[]
  connectors: ConnectorStandard[]
  priceBounds: { min: number; max: number }
  /** Per-brand result counts under the *other* active filters. */
  brandCounts: Record<string, number>
  categoryCounts: Record<string, number>
}

/** Round steps a buyer thinks in, rather than the raw data's odd figures. */
const BATTERY_STEPS = [20, 40, 60, 80]
const RANGE_STEPS = [100, 300, 400, 500]
const POWER_STEPS = [150, 200, 300, 400]

export function CarFilters({
  filters,
  onChange,
  brands,
  categories,
  connectors,
  priceBounds,
  brandCounts,
  categoryCounts,
}: CarFiltersProps) {
  /** Add or remove one value from a multi-select group. */
  const toggle = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value]

  return (
    <div className="flex flex-col gap-7">
      {/* ── Category ─────────────────────────────────────────── */}
      <Group label="Powertrain">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Chip
              key={category}
              active={filters.categories.includes(category)}
              onClick={() =>
                onChange({ ...filters, categories: toggle(filters.categories, category) })
              }
              count={categoryCounts[category]}
            >
              {category}
            </Chip>
          ))}
        </div>
      </Group>

      {/* ── Price ────────────────────────────────────────────── */}
      <Group label="Maximum price">
        <input
          type="range"
          min={priceBounds.min}
          max={priceBounds.max}
          step={100_000}
          value={filters.priceMax ?? priceBounds.max}
          onChange={(event) => {
            const value = Number(event.target.value)
            // At the top of the range the filter is off rather than set to the
            // maximum, so "no price filter" and "capped at the priciest car"
            // stay distinguishable.
            onChange({ ...filters, priceMax: value >= priceBounds.max ? null : value })
          }}
          aria-label="Maximum price"
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-plug-blue-600"
        />
        <p className="mt-2.5 text-ui-sm text-slate-600">
          {filters.priceMax === null ? (
            <span className="text-slate-400">Any price</span>
          ) : (
            <>
              Up to <span className="font-semibold text-slate-900">{formatPkr(filters.priceMax)}</span>
            </>
          )}
        </p>
      </Group>

      {/* ── Brand ────────────────────────────────────────────── */}
      <Group label="Brand">
        <div className="flex flex-col gap-1">
          {brands.map((brand) => {
            const count = brandCounts[brand] ?? 0
            const checked = filters.brands.includes(brand)

            return (
              <label
                key={brand}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-ui-sm transition-colors',
                  checked ? 'bg-blue-50 font-semibold text-slate-900' : 'text-slate-600 hover:bg-slate-50',
                  // Greyed rather than hidden: a brand vanishing as you filter
                  // makes the list feel unstable.
                  count === 0 && !checked && 'opacity-40',
                )}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onChange({ ...filters, brands: toggle(filters.brands, brand) })}
                    className="h-4 w-4 shrink-0 rounded border-slate-300 accent-plug-blue-600"
                  />
                  <span className="truncate">{brand}</span>
                </span>
                <span className="shrink-0 font-mono text-ui-xs tabular-nums text-slate-400">
                  {count}
                </span>
              </label>
            )
          })}
        </div>
      </Group>

      {/* ── Minimums ─────────────────────────────────────────── */}
      <Group label="Battery at least">
        <StepRow
          steps={BATTERY_STEPS}
          value={filters.minBattery}
          unit="kWh"
          onChange={(value) => onChange({ ...filters, minBattery: value })}
        />
      </Group>

      <Group label="Electric range at least">
        <StepRow
          steps={RANGE_STEPS}
          value={filters.minRange}
          unit="km"
          onChange={(value) => onChange({ ...filters, minRange: value })}
        />
      </Group>

      <Group label="Power at least">
        <StepRow
          steps={POWER_STEPS}
          value={filters.minPower}
          unit="hp"
          onChange={(value) => onChange({ ...filters, minPower: value })}
        />
      </Group>

      {connectors.length > 0 ? (
        <Group label="Charging connector">
          <div className="flex flex-wrap gap-2">
            {connectors.map((connector) => (
              <Chip
                key={connector}
                active={filters.connectors.includes(connector)}
                onClick={() =>
                  onChange({ ...filters, connectors: toggle(filters.connectors, connector) })
                }
              >
                {connector}
              </Chip>
            ))}
          </div>
          <p className="mt-2.5 text-ui-xs leading-relaxed text-slate-400">
            Only cars whose connector was published can match this.
          </p>
        </Group>
      ) : null}
    </div>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-ui-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      {children}
    </div>
  )
}

function Chip({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean
  onClick: () => void
  count?: number
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-3.5 py-1.5 text-ui-sm font-semibold transition-colors duration-150',
        active
          ? 'border-slate-900 bg-slate-900 text-white'
          : 'border-slate-200 text-slate-600 hover:border-slate-400',
      )}
    >
      {children}
      {count !== undefined ? (
        <span className={cn('font-mono text-ui-xs', active ? 'text-white/60' : 'text-slate-400')}>
          {count}
        </span>
      ) : null}
    </button>
  )
}

/** A minimum as steps rather than a slider — four taps beat a drag on a phone. */
function StepRow({
  steps,
  value,
  unit,
  onChange,
}: {
  steps: number[]
  value: number | null
  unit: string
  onChange: (value: number | null) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Chip active={value === null} onClick={() => onChange(null)}>
        Any
      </Chip>
      {steps.map((step) => (
        <Chip key={step} active={value === step} onClick={() => onChange(step)}>
          {step}+ {unit}
        </Chip>
      ))}
    </div>
  )
}
