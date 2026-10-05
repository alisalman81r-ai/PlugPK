// src/components/route/RouteSummaryBar.tsx
import { BatteryCharging, BatteryLow, Clock, Route, Zap, type IconType } from '@/components/ui/icons'

import type { PlannedTrip } from '@/hooks/useRoutePlanner'
import { formatDuration as formatChargeDuration } from '@/lib/charging-time'
import { formatDuration } from '@/lib/utils'

export interface RouteSummaryBarProps {
  trip: PlannedTrip
}

interface SummaryStat {
  icon: IconType
  value: string
  label: string
}

/**
 * The trip in five numbers, every one from the plan.
 *
 * Charge time uses the calculator's formatter, which rounds to what a charge
 * estimate can support (to five minutes past a quarter hour), so the total
 * here and the per-stop figures read the same way.
 */
export function RouteSummaryBar({ trip }: RouteSummaryBarProps) {
  const { plan } = trip
  const stats: SummaryStat[] = [
    {
      icon: Route,
      value: `${trip.totalDistanceKm.toLocaleString('en-PK')} km`,
      label: 'Total Distance',
    },
    { icon: Clock, value: formatDuration(trip.estimatedDriveTimeMinutes), label: 'Drive Time' },
    {
      icon: Zap,
      value: `${plan.stops.length} Stop${plan.stops.length === 1 ? '' : 's'}`,
      label: 'Charging Stops',
    },
    {
      icon: BatteryCharging,
      value: trip.totalChargingTimeMinutes > 0 ? formatChargeDuration(trip.totalChargingTimeMinutes) : '—',
      label: 'Charge Time',
    },
    {
      icon: BatteryLow,
      value: plan.arrivalPercent !== null ? `~${plan.arrivalPercent}%` : 'Not reached',
      label: 'On Arrival',
    },
  ]

  return (
    <div className="-mx-4 rounded-none bg-plug-navy-900 px-8 py-5 sm:mx-0 sm:rounded-2xl">
      <div className="grid grid-cols-2 items-center gap-6 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat, index) => {
          const Icon = stat.icon

          return (
            <div key={stat.label} className="relative flex flex-col items-center gap-1 text-center">
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute -left-3 top-1/2 hidden h-12 w-px -translate-y-1/2 bg-white/10 lg:block"
                />
              ) : null}

              <Icon size={20} className="text-plug-cyan-400" aria-hidden="true" />
              <p className="font-mono text-2xl font-bold tracking-[-0.02em] text-white">
                {stat.value}
              </p>
              <p className="text-ui-xs font-medium uppercase tracking-widest text-white/40">
                {stat.label}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
