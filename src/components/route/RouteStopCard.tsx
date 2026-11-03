// src/components/route/RouteStopCard.tsx
import {
  ArrowRight,
  Bed,
  Coffee,
  MapPin,
  ParkingSquare,
  Utensils,
  Wifi,
  Zap,
  type IconType,
} from '@/components/ui/icons'
import Link from 'next/link'

import { ConnectorBadgeGroup, RatingStars } from '@/components/ui'
import { ExampleBadge, Tag } from '@/components/v2/ui'
import { formatDuration as formatChargeDuration } from '@/lib/charging-time'
import type { PlanStop } from '@/lib/route-plan'
import { SAMPLE_LISTING_LABEL, isSampleListing } from '@/lib/sample-listings'
import type { AmenityType, Station } from '@/lib/types'
import { getMaxPower } from '@/lib/utils'

export interface RouteStopCardProps {
  stop: PlanStop<Station>
  totalStops: number
}

const AMENITY_ICON: Record<AmenityType, IconType> = {
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

/** A charge figure as a pill (.tl__soc em): ember when low, volt-tint on departure. */
export function SocPill({ value, tone = 'plain' }: { value: number; tone?: 'plain' | 'to' }) {
  const low = value < 15
  return (
    <em
      className={
        'inline-block rounded-full px-[9px] py-[3px] not-italic ' +
        (low ? 'bg-[#FFECE6] text-[#B42E05]' : tone === 'to' ? 'bg-[#F1FFD0] text-volt-ink' : 'bg-chalk text-ink')
      }
    >
      {Math.round(value)}%
    </em>
  )
}

/**
 * One charging stop, as a node on the plan's timeline (landing-v2 .tl__node):
 * the station, the charge it arrives and leaves on, how long it takes, and
 * the station's own details below.
 */
export function RouteStopCard({ stop, totalStops }: RouteStopCardProps) {
  const { station } = stop
  const maxPower = station.connectors.length > 0 ? getMaxPower(station) : 0

  const available = station.amenities.filter((amenity) => amenity.available)
  const shown = available.slice(0, MAX_AMENITIES)
  const extra = available.length - shown.length

  return (
    <article aria-label={`Stop ${stop.order} of ${totalStops}: ${station.name}`} className="min-w-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-base font-semibold leading-[1.35] text-ink">
          Stop {stop.order} · {station.name}
          {/* No "verified" shield: nothing verifies a station. */}
          {isSampleListing(station.id) ? (
            <ExampleBadge className="ml-2 align-middle">{SAMPLE_LISTING_LABEL}</ExampleBadge>
          ) : null}
        </h3>
        <span className="whitespace-nowrap font-mono text-sm font-semibold tabular-nums">
          <span className="sr-only">Arrive on {stop.arrivalBatteryPercent}%, leave on {stop.departureBatteryPercent}%</span>
          <span aria-hidden="true">
            <SocPill value={stop.arrivalBatteryPercent} /> → <SocPill value={stop.departureBatteryPercent} tone="to" />
          </span>
        </span>
      </div>

      <p className="mt-[3px] flex items-center gap-1.5 text-[13.5px] text-muted">
        <MapPin size={13} className="shrink-0" aria-hidden="true" />
        {station.address.area}, {station.address.city}
        {stop.distanceFromPreviousKm <= 0.5 ? ' · top up before you set off' : ''}
      </p>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <Tag className="font-mono text-[11.5px]">
          {stop.chargingTimeMinutes !== null
            ? `~${formatChargeDuration(stop.chargingTimeMinutes)} charging`
            : 'Charge time unknown'}
        </Tag>
        <Tag className="font-mono text-[11.5px]">
          {stop.chargeKw} kW {stop.mode.toUpperCase()}
        </Tag>
        {maxPower > 0 && maxPower !== stop.chargeKw ? (
          <Tag className="font-mono text-[11.5px]">Charger up to {maxPower} kW</Tag>
        ) : null}
        <ConnectorBadgeGroup connectors={station.connectors} max={2} size="sm" />
      </div>

      {/* Why this stop charges the way it does — AC on a car that cannot DC
          charge, or a socket we could not confirm fits. */}
      {stop.note ? (
        <p className="mt-2.5 rounded-xl border border-[#FFE0A3] bg-[#FFF6E3] px-3 py-2 text-[13px] leading-[1.5] text-[#8A5300]">
          {stop.note}
        </p>
      ) : null}

      {shown.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {shown.map((amenity) => {
            const Icon = AMENITY_ICON[amenity.type]

            return (
              <span key={amenity.type} className="flex items-center gap-1.5 text-muted">
                <Icon size={15} className="shrink-0" aria-hidden="true" />
                <span className="text-xs">{AMENITY_LABEL[amenity.type]}</span>
              </span>
            )
          })}
          {extra > 0 ? <span className="text-xs text-muted">+{extra} more</span> : null}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        {station.reviewCount > 0 ? (
          <RatingStars rating={station.rating} size="sm" showNumber />
        ) : (
          <span className="text-xs text-muted">No reviews yet</span>
        )}

        <Link
          href={`/station/${station.slug}`}
          className="group/link inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-ink underline-offset-4 hover:underline"
        >
          View station
          <ArrowRight
            size={14}
            className="transition-transform duration-200 group-hover/link:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </div>
    </article>
  )
}
