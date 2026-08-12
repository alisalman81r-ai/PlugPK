// src/components/route/RouteSummaryBar.tsx
import { BatteryCharging, Clock, Route, Zap, type LucideIcon } from 'lucide-react'

import type { PlannedRoute } from '@/lib/types'
import { formatDuration } from '@/lib/utils'

export interface RouteSummaryBarProps {
  route: PlannedRoute
}

interface SummaryStat {
  icon: LucideIcon
  value: string
  label: string
}

export function RouteSummaryBar({ route }: RouteSummaryBarProps) {
  const stats: SummaryStat[] = [
    {
      icon: Route,
      value: `${route.totalDistanceKm.toLocaleString('en-PK')} km`,
      label: 'Total Distance',
    },
    { icon: Clock, value: formatDuration(route.estimatedDriveTimeMinutes), label: 'Drive Time' },
    {
      icon: Zap,
      value: `${route.stops.length} Stop${route.stops.length === 1 ? '' : 's'}`,
      label: 'Charging Stops',
    },
    {
      icon: BatteryCharging,
      value: formatDuration(route.totalChargingTimeMinutes),
      label: 'Charge Time',
    },
  ]

  return (
    <div className="-mx-4 rounded-none bg-slate-900 px-8 py-5 sm:mx-0 sm:rounded-2xl">
      <div className="grid grid-cols-2 items-center gap-6 lg:grid-cols-4">
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
