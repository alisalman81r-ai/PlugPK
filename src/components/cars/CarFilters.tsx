// src/components/cars/CarFilters.tsx
'use client'

import { ChevronDown, RotateCcw } from 'lucide-react'
import * as React from 'react'

import { TurnIcon } from '@/components/ui'
import type { CarCategory, ConnectorStandard } from '@/data/cars'
import { formatPkr, type CarFilterState } from '@/lib/cars'
import { cn } from '@/lib/utils'

/**
 * The filter panel, shared by the desktop sidebar and the mobile drawer.
 *
 * One component for both, so a filter added here appears in both places and
 * cannot drift between them. Presentational throughout: every value arrives as
 * a prop and every change leaves through onChange, which is what lets the hero's
 * brand select and these checkboxes sit over the same array.
 *
 * Structured as collapsible sections rather than one long stack. Seven groups
 * unrolled is over a screen tall on a laptop, so the ones a buyer reaches for
 * first — powertrain, price, brand — open by default and the rest stay shut
 * until wanted. Each header carries a count of its own selections, so a
 * collapsed section can still say it is doing something; a closed section
 * silently filtering the grid is how a filter panel starts feeling broken.
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

  const priceValue = filters.priceMax ?? priceBounds.max

  /**
   * The filled part of the price track.
   *
   * A native range input paints one flat colour the whole way across, which
   * tells the eye nothing about where the handle sits. A gradient stop at the
   * current position makes the control read as a measure rather than a line.
   */
  const priceProgress =
    ((priceValue - priceBounds.min) / Math.max(1, priceBounds.max - priceBounds.min)) * 100

  return (
    <div className="flex flex-col">
      <Section label="Powertrain" count={filters.categories.length} defaultOpen>
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
      </Section>

      <Section
        label="Maximum price"
        count={filters.priceMax === null ? 0 : 1}
        defaultOpen
        onClear={filters.priceMax === null ? undefined : () => onChange({ ...filters, priceMax: null })}
      >
        <p className="mb-3 flex items-baseline justify-between gap-3">
          <span className="text-lg font-black tracking-tight text-slate-900">
            {filters.priceMax === null ? 'Any price' : formatPkr(filters.priceMax)}
          </span>
        </p>

        <input
          type="range"
          min={priceBounds.min}
          max={priceBounds.max}
          step={100_000}
          value={priceValue}
          onChange={(event) => {
            const value = Number(event.target.value)
            // At the top of the range the filter turns off rather than being set
            // to the maximum, so "no price filter" and "capped at the priciest
            // car" stay distinguishable — they behave the same but read
            // differently, and the label has to be able to say which it is.
            onChange({ ...filters, priceMax: value >= priceBounds.max ? null : value })
          }}
          aria-label="Maximum price"
          aria-valuetext={filters.priceMax === null ? 'Any price' : formatPkr(filters.priceMax)}
          style={{
            background: `linear-gradient(to right, #0F172A 0%, #0F172A ${priceProgress}%, #E2E8F0 ${priceProgress}%, #E2E8F0 100%)`,
          }}
          className={cn(
            'h-1.5 w-full cursor-pointer appearance-none rounded-full',
            // The thumb has to be styled per engine; there is no shorthand.
            '[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4',
            '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full',
            '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white',
            '[&::-webkit-slider-thumb]:bg-slate-900',
            '[&::-webkit-slider-thumb]:shadow-[0_1px_4px_rgba(15,23,42,0.4)]',
            '[&::-webkit-slider-thumb]:transition-transform',
            'hover:[&::-webkit-slider-thumb]:scale-110',
            '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4',
            '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2',
            '[&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-slate-900',
          )}
        />

        <div className="mt-2 flex justify-between text-ui-xs tabular-nums text-slate-400">
          <span>{formatPkr(priceBounds.min)}</span>
          <span>{formatPkr(priceBounds.max)}</span>
        </div>
      </Section>

      <Section
        label="Brand"
        count={filters.brands.length}
        defaultOpen
        onClear={filters.brands.length === 0 ? undefined : () => onChange({ ...filters, brands: [] })}
      >
        {/* Capped and scrollable: fourteen rows unrolled pushes every section
            below it off the screen, and the list grows as cars are added. */}
        <div className="scrollbar-hide -mx-1 max-h-64 overflow-y-auto px-1">
          {brands.map((brand) => {
            const count = brandCounts[brand] ?? 0
            const checked = filters.brands.includes(brand)

            return (
              <label
                key={brand}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-2 text-ui-sm transition-colors',
                  checked
                    ? 'bg-slate-900 font-semibold text-white'
                    : 'text-slate-600 hover:bg-slate-100',
                  // Dimmed rather than hidden: a brand vanishing as you filter
                  // makes the list feel unstable under the cursor.
                  count === 0 && !checked && 'opacity-40',
                )}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onChange({ ...filters, brands: toggle(filters.brands, brand) })}
                    className="h-3.5 w-3.5 shrink-0 rounded border-slate-300 accent-plug-blue-600"
                  />
                  <span className="truncate">{brand}</span>
                </span>
                <span
                  className={cn(
                    'shrink-0 font-mono text-ui-xs tabular-nums',
                    checked ? 'text-white/60' : 'text-slate-400',
                  )}
                >
                  {count}
                </span>
              </label>
            )
          })}
        </div>
      </Section>

      <Section label="Battery" count={filters.minBattery === null ? 0 : 1}>
        <StepRow
          steps={BATTERY_STEPS}
          value={filters.minBattery}
          unit="kWh"
          onChange={(value) => onChange({ ...filters, minBattery: value })}
        />
      </Section>

      <Section label="Electric range" count={filters.minRange === null ? 0 : 1}>
        <StepRow
          steps={RANGE_STEPS}
          value={filters.minRange}
          unit="km"
          onChange={(value) => onChange({ ...filters, minRange: value })}
        />
      </Section>

      <Section label="Power" count={filters.minPower === null ? 0 : 1}>
        <StepRow
          steps={POWER_STEPS}
          value={filters.minPower}
          unit="hp"
          onChange={(value) => onChange({ ...filters, minPower: value })}
        />
      </Section>

      {connectors.length > 0 ? (
        <Section label="Charging connector" count={filters.connectors.length}>
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
          <p className="mt-3 text-ui-xs leading-relaxed text-slate-400">
            Only cars whose connector was published can match — most PHEVs here did
            not state one.
          </p>
        </Section>
      ) : null}
    </div>
  )
}

/**
 * A collapsible group.
 *
 * Open state is local to the section: which groups a user has expanded is not
 * something the results depend on, and lifting it would put presentation state
 * in the same object as the filters themselves.
 */
function Section({
  label,
  count,
  defaultOpen = false,
  onClear,
  children,
}: {
  label: string
  count: number
  defaultOpen?: boolean
  onClear?: () => void
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(defaultOpen)

  return (
    <div className="border-b border-slate-100 py-4 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="group/sec flex flex-1 items-center gap-2 text-left"
        >
          <span className="text-ui-sm font-bold text-slate-900">{label}</span>

          {count > 0 ? (
            <span className="rounded-full bg-plug-blue-600 px-1.5 py-0.5 font-mono text-[10px] font-bold leading-none text-white">
              {count}
            </span>
          ) : null}

          <TurnIcon
            active={open}
            className="ml-auto text-slate-400 transition-colors group-hover/sec:text-slate-700"
          >
            <ChevronDown size={16} aria-hidden="true" />
          </TurnIcon>
        </button>

        {/* Only rendered when there is something to clear, so the row does not
            carry a dead control most of the time. */}
        {onClear && count > 0 ? (
          <button
            type="button"
            onClick={onClear}
            aria-label={`Clear ${label.toLowerCase()}`}
            title={`Clear ${label.toLowerCase()}`}
            className="shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <RotateCcw size={13} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {open ? <div className="mt-3.5">{children}</div> : null}
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
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-ui-sm font-semibold transition-all duration-150',
        active
          ? 'border-slate-900 bg-slate-900 text-white shadow-[0_2px_8px_-2px_rgba(15,23,42,0.4)]'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900',
      )}
    >
      {children}
      {count !== undefined ? (
        <span
          className={cn(
            'font-mono text-[10px] tabular-nums',
            active ? 'text-white/60' : 'text-slate-400',
          )}
        >
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
