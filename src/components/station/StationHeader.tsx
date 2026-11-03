// src/components/station/StationHeader.tsx
import { ChevronLeft, Info, MapPin, Star, Zap } from '@/components/ui/icons'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { CONNECTOR_LABEL } from '@/components/map/filter-options'
import { SAMPLE_LISTING_LABEL, isSampleListing } from '@/lib/sample-listings'
import type { Station } from '@/lib/types'
import { cn, formatRating, getMaxPower, getPortAvailability } from '@/lib/utils'

export interface StationHeaderProps {
  station: Station
}

/**
 * The station page's ink header, in the language of the landing-v2 .phero:
 * a faint grid and a volt glow from above, a centred Power Grotesk title, the
 * facts underneath in mono, and a stats strip. It leaves room at the bottom
 * for the gallery and sidebar to lift into it, like the design's .lift sheets.
 *
 * Every figure is read from the listing. No "Verified" badge — plugpk has no
 * process that verifies a station — but a sample listing is flagged so a
 * driver does not set off for it.
 */
export function StationHeader({ station }: StationHeaderProps) {
  const maxPower = station.connectors.length > 0 ? getMaxPower(station) : 0
  const { total: ports } = getPortAvailability(station)
  const types = [...new Set(station.connectors.map((connector) => connector.type))]
  const example = isSampleListing(station.id)
  const where = [station.address.area, station.address.city].filter(Boolean).join(', ')

  const stats: { value: ReactNode; label: string }[] = []
  if (maxPower > 0) stats.push({ value: <>{maxPower}<small className="ml-1 text-[0.55em] text-white/50">kW</small></>, label: 'max power' })
  if (ports > 0) stats.push({ value: ports, label: ports === 1 ? 'port installed' : 'ports installed' })
  if (types.length > 0) stats.push({ value: types.length, label: types.length === 1 ? 'connector type' : 'connector types' })
  stats.push(
    station.reviewCount > 0
      ? { value: formatRating(station.rating), label: `${station.reviewCount} ${station.reviewCount === 1 ? 'review' : 'reviews'}` }
      : { value: '—', label: 'no reviews yet' },
  )

  return (
    <header
      data-theme="dark"
      className="relative isolate overflow-hidden rounded-b-[32px] bg-ink pb-[clamp(120px,12vw,168px)] pt-[clamp(28px,4vw,48px)] text-center text-white sm:rounded-b-[48px]"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-[2] bg-[linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] bg-[length:56px_56px] bg-top [mask-image:radial-gradient(ellipse_80%_70%_at_50%_30%,#000_30%,transparent_75%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-[260px] left-1/2 -z-[1] h-[700px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(212,255,58,.14),transparent_70%)] blur-[10px]"
      />

      <div className="mx-auto grid w-[min(1080px,calc(100%-2*clamp(16px,4vw,64px)))] justify-items-center">
        <nav aria-label="Breadcrumb" className="mb-7 flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-2 pr-4 text-sm">
          <Link
            href="/map"
            className="group/back inline-flex h-8 items-center gap-1 rounded-full bg-white/[0.08] px-3 font-medium text-white transition-colors duration-200 hover:bg-volt hover:text-ink"
          >
            <ChevronLeft size={16} className="transition-transform duration-200 group-hover/back:-translate-x-0.5" aria-hidden="true" />
            Map
          </Link>
          <span aria-hidden="true" className="text-white/25">/</span>
          <span aria-current="page" className="truncate text-white/55">{station.name}</span>
        </nav>

        <p className="mb-[18px] inline-flex items-center gap-2.5 font-mono text-xs font-semibold uppercase leading-none tracking-[0.16em] text-volt">
          <Zap size={14} className="fill-current" aria-hidden="true" />
          EV charging{station.address.city ? ` · ${station.address.city}` : ''}
        </p>

        <h1 className="m-0 text-balance font-display text-[clamp(38px,5vw,76px)] leading-none">{station.name}</h1>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[15px] text-white/70">
          {station.reviewCount > 0 ? (
            <span className="inline-flex items-center gap-1.5">
              <Star size={15} className="fill-[#F5A524] text-[#F5A524]" aria-hidden="true" />
              <b className="font-mono font-semibold text-white">{formatRating(station.rating)}</b>
              <span className="text-white/50">
                ({station.reviewCount} {station.reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </span>
          ) : (
            <span className="text-white/55">No reviews yet</span>
          )}
          {where ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={15} className="shrink-0 text-white/45" aria-hidden="true" />
              {where}
            </span>
          ) : null}
          {station.network ? <span className="text-white/55">{station.network}</span> : null}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {example ? (
            <span className="inline-flex h-[26px] items-center gap-[5px] rounded-full border border-[#FFE0A3] bg-[#FFF6E3] px-2.5 text-xs font-semibold text-[#8A5300]">
              <Info size={13} aria-hidden="true" />
              {SAMPLE_LISTING_LABEL}
            </span>
          ) : null}
          {types.map((type) => (
            <span
              key={type}
              className="inline-flex h-[26px] items-center rounded-full border border-white/20 px-2.5 text-xs font-semibold text-white"
            >
              {CONNECTOR_LABEL[type] ?? type}
            </span>
          ))}
          {maxPower > 0 ? (
            <span className="inline-flex h-[26px] items-center gap-[5px] rounded-full bg-volt px-2.5 font-mono text-xs font-semibold text-ink">
              <Zap size={12} className="fill-current" aria-hidden="true" />
              up to {maxPower} kW
            </span>
          ) : null}
        </div>

        <dl className="mt-9 grid w-full grid-cols-2 rounded-[22px] border border-white/[0.09] bg-white/[0.03] sm:flex sm:w-auto sm:justify-center">
          {stats.map((item, index) => (
            <div
              key={item.label}
              className={cn(
                'grid justify-items-center gap-1.5 border-white/[0.09] px-4 py-3 sm:px-[30px] sm:py-4',
                index % 2 === 1 && 'border-l',
                index >= 2 && 'border-t sm:border-t-0',
                index > 0 && 'sm:border-l',
                stats.length % 2 === 1 && index === stats.length - 1 && 'col-span-2',
              )}
            >
              <dt className="order-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/50 sm:text-[11px]">
                {item.label}
              </dt>
              <dd className="order-1 font-mono text-[22px] font-semibold leading-none tabular-nums text-white sm:text-[30px]">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </header>
  )
}
