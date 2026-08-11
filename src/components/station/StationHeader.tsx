// src/components/station/StationHeader.tsx
import { ChevronLeft, MapPin, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

import { ConnectorBadgeGroup, RatingStars, SpeedBadge, StatusBadge } from '@/components/ui'
import type { Station } from '@/lib/types'
import { getMaxPower } from '@/lib/utils'

export interface StationHeaderProps {
  station: Station
}

export function StationHeader({ station }: StationHeaderProps) {
  const maxPower = station.connectors.length > 0 ? getMaxPower(station) : 0

  return (
    <header>
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2">
        <Link
          href="/map"
          className="group/back flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-all duration-150 hover:text-slate-900"
        >
          <ChevronLeft
            size={16}
            className="transition-transform duration-150 group-hover/back:-translate-x-0.5"
            aria-hidden="true"
          />
          Map
        </Link>
        <span aria-hidden="true" className="text-slate-300">
          /
        </span>
        <span className="line-clamp-1 max-w-[200px] text-sm text-slate-400">{station.name}</span>
      </nav>

      <div className="mb-3 flex flex-wrap items-start gap-3">
        <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-900 lg:text-4xl">
          {station.name}
        </h1>

        {station.isVerified ? (
          <span className="mt-2 flex shrink-0 items-center gap-1.5 self-start rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-plug-blue-600">
            <ShieldCheck size={14} aria-hidden="true" />
            Verified
          </span>
        ) : null}
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-5">
        <RatingStars
          rating={station.rating}
          reviewCount={station.reviewCount}
          size="md"
          showNumber
          showCount
        />

        <span aria-hidden="true" className="text-slate-300">
          ·
        </span>

        <span className="flex items-center gap-1.5">
          <MapPin size={15} className="shrink-0 text-slate-400" aria-hidden="true" />
          <span className="text-sm text-slate-600">
            {station.address.area}, {station.address.city}
          </span>
        </span>

        <span aria-hidden="true" className="text-slate-300">
          ·
        </span>

        <span className="text-sm text-slate-500">{station.network}</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={station.status} />
        <ConnectorBadgeGroup connectors={station.connectors} max={5} size="md" />
        {maxPower > 0 ? <SpeedBadge speedKw={maxPower} size="md" /> : null}
      </div>
    </header>
  )
}
