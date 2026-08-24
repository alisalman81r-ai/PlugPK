// src/components/cars/CarFilters.tsx
'use client'

import { ChevronDown, RotateCcw } from 'lucide-react'
import * as React from 'react'

import { TurnIcon } from '@/components/ui'
import type { ConnectorStandard } from '@/data/cars'
import type { CarFilterState } from '@/lib/cars'
import { cn } from '@/lib/utils'

/**
 * The filter panel, shared by the desktop sidebar and the mobile drawer.
 *
 * One component for both, so a filter added here appears in both places and
 * cannot drift between them. Presentational throughout: every value arrives as
 * a prop and every change leaves through onChange, which is what lets this panel
 * and the controls above the grid write into one filter object.
 *
 * Structured as collapsible sections rather than one long stack. Each header
 * carries a count of its own selections, so a collapsed section can still say it
 * is doing something; a closed section silently filtering the grid is how a
 * filter panel starts feeling broken.
 *
 * ── What is deliberately not here ─────────────────────────────────────
 *
 * Powertrain and Brand used to head this panel, and both were the second copy
 * of a control the page already had above the grid: powertrain is the segmented
 * strip in CarsBrowser, brand is the BrandRail and the hero's select. All of
 * them wrote into the same two arrays, so the panel was offering a slower route
 * to a choice already one tap away, and pushing the specification filters — the
 * ones with nowhere else to live — below the fold.
 *
 * Maximum price is gone too, and unlike those two it had no other home on the
 * page — so price filtering is genuinely gone, not relocated. `priceMax` stays
 * on CarFilterState and in filterCars, but nothing sets it: the `max` query
 * parameter is no longer read either, because honouring it with no control on
 * screen meant a /cars?max=… link quietly cut the grid with no way to undo it.
 * Restoring price filtering means adding a control here and restoring that one
 * line in lib/cars.
 */

export interface CarFiltersProps {
  filters: CarFilterState
  onChange: (next: CarFilterState) => void
  connectors: ConnectorStandard[]
}

/** Round steps a buyer thinks in, rather than the raw data's odd figures. */
const BATTERY_STEPS = [20, 40, 60, 80]
const RANGE_STEPS = [100, 300, 400, 500]
const POWER_STEPS = [150, 200, 300, 400]

export function CarFilters({ filters, onChange, connectors }: CarFiltersProps) {
  /** Add or remove one value from a multi-select group. */
  const toggle = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value]

  return (
    <div className="flex flex-col">
      <Section label="Battery" count={filters.minBattery === null ? 0 : 1} defaultOpen>
        <StepRow
          steps={BATTERY_STEPS}
          value={filters.minBattery}
          unit="kWh"
          onChange={(value) => onChange({ ...filters, minBattery: value })}
        />
      </Section>

      <Section label="Electric range" count={filters.minRange === null ? 0 : 1} defaultOpen>
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
  children,
}: {
  active: boolean
  onClick: () => void
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
