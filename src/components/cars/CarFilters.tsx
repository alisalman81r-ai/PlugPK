// src/components/cars/CarFilters.tsx
'use client'

import * as React from 'react'

import { ChipCount, FLABEL, chipClass } from '@/components/v2/ui'
import type { ConnectorStandard } from '@/data/cars'
import type { CarFilterState } from '@/lib/cars'
import { cn } from '@/lib/utils'

/**
 * The inline filter panel's contents (landing-v2's .fpanel): brand chips with
 * their counts, then the specification minimums and the charging connector.
 *
 * Presentational throughout: every value arrives as a prop and every change
 * leaves through onChange, which is what lets this panel, the hero and the
 * brand strip write into one filter object.
 *
 * Powertrain is not here: it is the chip row right above the grid. Maximum
 * price is gone too, and has no other home on the page — `priceMax` stays on
 * CarFilterState and in filterCars, but nothing sets it, and the `max` query
 * parameter is no longer read, because honouring it with no control on screen
 * meant a /cars?max=… link quietly cut the grid with no way to undo it.
 */

export interface CarFiltersProps {
  filters: CarFilterState
  onChange: (next: CarFilterState) => void
  brands: string[]
  /** How many cars each brand would show with the other filters kept. */
  brandCounts: Record<string, number>
  connectors: ConnectorStandard[]
  onClearAll: () => void
  canClear: boolean
}

/** Round steps a buyer thinks in, rather than the raw data's odd figures. */
const BATTERY_STEPS = [20, 40, 60, 80]
const RANGE_STEPS = [100, 300, 400, 500]
const POWER_STEPS = [150, 200, 300, 400]

const SMALL = 'h-[38px] px-3.5 text-[13.5px]'

export function CarFilters({ filters, onChange, brands, brandCounts, connectors, onClearAll, canClear }: CarFiltersProps) {
  /** Add or remove one value from a multi-select group. */
  const toggle = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value]

  return (
    <div className="grid gap-6">
      <div>
        <div className="mb-3.5 flex items-center justify-between gap-3">
          <span className={FLABEL}>Brand</span>
          {canClear ? (
            <button
              type="button"
              onClick={onClearAll}
              className="min-h-11 px-1 text-sm font-medium text-muted underline underline-offset-[3px] hover:text-ink"
            >
              Clear all filters
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {brands.map((brand) => {
            const on = filters.brands.includes(brand)
            const count = brandCounts[brand] ?? 0
            return (
              <button
                key={brand}
                type="button"
                aria-pressed={on}
                onClick={() => onChange({ ...filters, brands: toggle(filters.brands, brand) })}
                className={chipClass(on, cn(SMALL, count === 0 && !on && 'opacity-45'))}
              >
                {brand}
                <ChipCount on={on}>{count}</ChipCount>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-6 border-t border-ink/10 pt-5 sm:grid-cols-2 xl:grid-cols-4">
        <Group label="Battery">
          <StepRow
            steps={BATTERY_STEPS}
            value={filters.minBattery}
            unit="kWh"
            onChange={(value) => onChange({ ...filters, minBattery: value })}
          />
        </Group>

        <Group label="Electric range">
          <StepRow
            steps={RANGE_STEPS}
            value={filters.minRange}
            unit="km"
            onChange={(value) => onChange({ ...filters, minRange: value })}
          />
        </Group>

        <Group label="Power">
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
              {connectors.map((connector) => {
                const on = filters.connectors.includes(connector)
                return (
                  <button
                    key={connector}
                    type="button"
                    aria-pressed={on}
                    onClick={() => onChange({ ...filters, connectors: toggle(filters.connectors, connector) })}
                    className={chipClass(on, SMALL)}
                  >
                    {connector}
                  </button>
                )
              })}
            </div>
            <p className="mt-2.5 text-xs leading-relaxed text-muted">
              Only cars whose connector was published can match — most PHEVs here did not state one.
            </p>
          </Group>
        ) : null}
      </div>
    </div>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label}>
      <p className={cn(FLABEL, 'mb-3')}>{label}</p>
      {children}
    </div>
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
      <button type="button" aria-pressed={value === null} onClick={() => onChange(null)} className={chipClass(value === null, SMALL)}>
        Any
      </button>
      {steps.map((step) => (
        <button
          key={step}
          type="button"
          aria-pressed={value === step}
          onClick={() => onChange(step)}
          className={chipClass(value === step, SMALL)}
        >
          <span className="font-mono text-[12.5px]">
            {step}+ {unit}
          </span>
        </button>
      ))}
    </div>
  )
}
