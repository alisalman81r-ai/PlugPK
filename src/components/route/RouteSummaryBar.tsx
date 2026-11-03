// src/components/route/RouteSummaryBar.tsx
import type { PlannedTrip } from '@/hooks/useRoutePlanner'
import { formatDuration as formatChargeDuration } from '@/lib/charging-time'
import { formatDuration } from '@/lib/utils'

export interface RouteSummaryBarProps {
  trip: PlannedTrip
}

/**
 * The trip in numbers, every one from the plan (landing-v2 .rplan__sum and
 * .rplan__total): four tiles, then the total on an ink bar.
 *
 * Charge time uses the calculator's formatter, which rounds to what a charge
 * estimate can support, so the total here and the per-stop figures read the
 * same way.
 */
export function RouteSummaryBar({ trip }: RouteSummaryBarProps) {
  const { plan } = trip
  const unreachable = plan.status === 'unreachable'
  const charging = trip.totalChargingTimeMinutes

  const tiles = [
    { value: `${trip.totalDistanceKm.toLocaleString('en-PK')} km`, label: 'Distance' },
    { value: `~${formatDuration(trip.estimatedDriveTimeMinutes)}`, label: 'Drive time' },
    { value: String(plan.stops.length), label: plan.stops.length === 1 ? 'Stop' : 'Stops' },
    { value: charging > 0 ? `~${formatChargeDuration(charging)}` : 'None', label: 'Charging' },
  ]

  const total = unreachable
    ? 'Not possible'
    : `~${formatDuration(Math.round(trip.estimatedDriveTimeMinutes + charging))}`

  return (
    <div className="mt-[22px]">
      <dl className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="flex flex-col-reverse rounded-[18px] border border-ink/10 bg-paper p-4">
            <dt className="mt-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">
              {tile.label}
            </dt>
            <dd className="font-mono text-[22px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-ink">
              {tile.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-[18px] bg-ink px-[18px] py-3.5 text-white">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
          Total trip time
        </span>
        <span className="flex items-baseline gap-3">
          <b className="font-mono text-[19px] font-semibold text-volt sm:text-[22px]">{total}</b>
          <span className="font-mono text-xs text-white/60">
            {plan.arrivalPercent !== null ? `arrive on ~${plan.arrivalPercent}%` : 'destination not reached'}
          </span>
        </span>
      </div>
    </div>
  )
}
