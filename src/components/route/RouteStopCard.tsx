// src/components/route/RouteStopCard.tsx
import {
  ArrowRight,
  Battery,
  BatteryLow,
  Bed,
  Coffee,
  MapPin,
  ParkingSquare,
  ShieldCheck,
  Utensils,
  Wifi,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'

import { ConnectorBadgeGroup, RatingStars, SpeedBadge } from '@/components/ui'
import type { AmenityType, RouteStop } from '@/lib/types'
import { cn, getMaxPower } from '@/lib/utils'

export interface RouteStopCardProps {
  stop: RouteStop
  isFirst?: boolean
  isLast?: boolean
  totalStops: number
}

const AMENITY_ICON: Record<AmenityType, LucideIcon> = {
  restaurant: Utensils,
  hotel: Bed,
  parking: ParkingSquare,
  washroom: Zap,
  wifi: Wifi,
  shopping: Zap,
  prayer: Zap,
  cafe: Coffee,
}

const AMENITY_LABEL: Record<AmenityType, string> = {
  restaurant: 'Food',
  hotel: 'Hotel',
  parking: 'Parking',
  washroom: 'Washroom',
  wifi: 'WiFi',
  shopping: 'Shops',
  prayer: 'Prayer',
  cafe: 'Café',
}

const MAX_AMENITIES = 4

export function RouteStopCard({ stop, totalStops }: RouteStopCardProps) {
  const { station } = stop
  const maxPower = station.connectors.length > 0 ? getMaxPower(station) : 0

  const available = station.amenities.filter((amenity) => amenity.available)
  const shown = available.slice(0, MAX_AMENITIES)
  const extra = available.length - shown.length

  const arrivalIsLow = stop.arrivalBatteryPercent < 20
  const ArrivalIcon = arrivalIsLow ? BatteryLow : Battery

  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-shadow duration-200 hover:shadow-card-hover">
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-0 top-0 w-1 bg-gradient-brand"
      />

      <span
        aria-label={`Stop ${stop.order} of ${totalStops}`}
        className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-plug-blue-600 font-mono text-sm font-bold text-white"
      >
        {String(stop.order).padStart(2, '0')}
      </span>

      <div className="mb-5 pr-12">
        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          {station.name}
          {station.isVerified ? (
            <ShieldCheck
              size={16}
              className="shrink-0 text-plug-blue-600"
              aria-label="Verified station"
            />
          ) : null}
        </h3>

        <p className="mt-1 flex items-center gap-1.5">
          <MapPin size={13} className="shrink-0 text-slate-400" aria-hidden="true" />
          <span className="text-sm text-slate-500">
            {station.address.area}, {station.address.city}
          </span>
        </p>
      </div>

      {/* Battery journey */}
      <div className="mb-5 flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
        <div className="flex shrink-0 flex-col items-center">
          <span className="mb-1 text-[10px] uppercase tracking-wider text-slate-400">Arrive at</span>
          <span className="flex items-center gap-1">
            <ArrivalIcon
              size={16}
              className={arrivalIsLow ? 'text-red-600' : 'text-amber-600'}
              aria-hidden="true"
            />
            <span
              className={cn(
                'font-mono text-2xl font-bold',
                arrivalIsLow ? 'text-red-600' : 'text-amber-600',
              )}
            >
              {stop.arrivalBatteryPercent}%
            </span>
          </span>
        </div>

        <div className="relative flex flex-1 flex-col items-center">
          <span aria-hidden="true" className="w-full border-t-2 border-dashed border-slate-300" />
          <span className="mt-1 flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1">
            <Zap size={14} className="text-plug-blue-600" aria-hidden="true" />
            <span className="font-mono text-xs font-medium text-plug-blue-600">
              {stop.chargingTimeMinutes} min
            </span>
          </span>
        </div>

        <div className="flex shrink-0 flex-col items-center">
          <span className="mb-1 text-[10px] uppercase tracking-wider text-slate-400">Depart at</span>
          <span className="flex items-center gap-1">
            <Battery size={16} className="text-green-600" aria-hidden="true" />
            <span className="font-mono text-2xl font-bold text-green-600">
              {stop.departureBatteryPercent}%
            </span>
          </span>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <ConnectorBadgeGroup connectors={station.connectors} max={2} size="sm" />
        {maxPower > 0 ? <SpeedBadge speedKw={maxPower} size="sm" /> : null}
      </div>

      {shown.length > 0 ? (
        <div className="mb-5 flex flex-wrap items-center gap-3">
          {shown.map((amenity) => {
            const Icon = AMENITY_ICON[amenity.type]

            return (
              <span key={amenity.type} className="flex items-center gap-1.5 text-slate-500">
                <Icon size={16} className="shrink-0" aria-hidden="true" />
                <span className="text-xs">{AMENITY_LABEL[amenity.type]}</span>
              </span>
            )
          })}
          {extra > 0 ? <span className="text-xs text-slate-400">+{extra} more</span> : null}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-4">
        <RatingStars rating={station.rating} size="sm" showNumber />

        <Link
          href={`/station/${station.slug}`}
          className="group/link flex items-center gap-1 text-sm font-medium text-plug-blue-600 hover:gap-2"
        >
          View Station
          <ArrowRight
            size={14}
            className="transition-transform duration-150 group-hover/link:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </div>
    </article>
  )
}
