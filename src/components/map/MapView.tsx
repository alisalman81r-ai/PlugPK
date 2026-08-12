// src/components/map/MapView.tsx
'use client'

import { APIProvider, AdvancedMarker, Map, useMap } from '@vis.gl/react-google-maps'
import { MapPinOff, Zap } from 'lucide-react'
import * as React from 'react'

import type { Coordinates, Station, StationStatus } from '@/lib/types'
import { cn, getMaxPower } from '@/lib/utils'

export interface MapViewProps {
  stations: Station[]
  selectedStation: Station | null
  onStationSelect: (station: Station) => void
  onMapClick: () => void
  userLocation: Coordinates | null
  className?: string
}

const PAKISTAN_CENTER = { lat: 30.3753, lng: 69.3451 }
const DEFAULT_ZOOM = 5

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

/**
 * Advanced Markers require a Map ID — without one Google silently renders no
 * markers at all. DEMO_MAP_ID works for development; create a real styled ID
 * in the Cloud console for production and set NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID.
 *
 * `||` not `??`: an env var declared but left empty is '', which is not
 * nullish, so `??` would pass the empty string straight through.
 */
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'

/** Reaches assistive tech and native tooltips via the marker's title. */
const STATUS_LABEL: Record<StationStatus, string> = {
  available: 'Available',
  limited: 'Limited availability',
  offline: 'Offline',
  unknown: 'Status unknown',
}

const PIN_COLOR: Record<StationStatus, string> = {
  available: 'bg-plug-blue-600',
  limited: 'bg-amber-500',
  offline: 'bg-slate-400',
  unknown: 'bg-slate-300',
}

/**
 * Shown when no API key is configured. The sidebar station list stays fully
 * usable either way, so a missing credential degrades one panel rather than
 * the whole page.
 */
function MapFallback({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex h-full w-full flex-col items-center justify-center gap-3 bg-slate-100 p-8 text-center',
        className,
      )}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-card">
        <MapPinOff size={24} className="text-slate-400" aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold text-slate-700">Map unavailable</p>
      <p className="max-w-xs text-xs leading-relaxed text-slate-500">
        No Google Maps API key is configured. Add one to .env.local and restart the dev server —
        the station list on the left still works.
      </p>
      <code className="rounded-lg bg-white px-3 py-1.5 font-mono text-[11px] text-slate-500">
        NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      </code>
    </div>
  )
}

/** Lives inside <Map> so it can reach the map instance via useMap(). */
function CameraController({
  selectedStation,
  userLocation,
}: {
  selectedStation: Station | null
  userLocation: Coordinates | null
}) {
  const map = useMap()

  React.useEffect(() => {
    if (!map || !selectedStation) return
    map.panTo({ lat: selectedStation.coordinates.lat, lng: selectedStation.coordinates.lng })
    map.setZoom(12)
  }, [map, selectedStation])

  React.useEffect(() => {
    if (!map || !userLocation) return
    map.panTo({ lat: userLocation.lat, lng: userLocation.lng })
    map.setZoom(11)
  }, [map, userLocation])

  return null
}

export function MapView({
  stations,
  selectedStation,
  onStationSelect,
  onMapClick,
  userLocation,
  className,
}: MapViewProps) {
  if (!API_KEY) {
    return <MapFallback className={className} />
  }

  return (
    <div className={cn('h-full w-full', className)}>
      <APIProvider apiKey={API_KEY}>
        <Map
          mapId={MAP_ID}
          defaultCenter={PAKISTAN_CENTER}
          defaultZoom={DEFAULT_ZOOM}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={false}
          onClick={onMapClick}
          style={{ width: '100%', height: '100%' }}
        >
          <CameraController selectedStation={selectedStation} userLocation={userLocation} />

          {stations.map((station) => {
            const isSelected = selectedStation?.id === station.id
            const maxPower = station.connectors.length > 0 ? getMaxPower(station) : 0

            return (
              <AdvancedMarker
                key={station.id}
                position={{ lat: station.coordinates.lat, lng: station.coordinates.lng }}
                title={`${station.name} — ${STATUS_LABEL[station.status]}`}
                // Selected pin rides above its neighbours rather than being
                // overlapped by whatever the map happens to draw later.
                zIndex={isSelected ? 20 : 1}
                onClick={() => onStationSelect(station)}
              >
                {/* A pin that carries the peak power reads at a glance, so the
                    map answers "how fast" without opening anything. */}
                <span className="relative flex cursor-pointer flex-col items-center">
                  {station.status === 'available' ? (
                    <span
                      aria-hidden="true"
                      className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 animate-pulse-ring rounded-full bg-plug-blue-600/25 motion-reduce:animate-none"
                    />
                  ) : null}

                  <span
                    className={cn(
                      'relative flex items-center gap-1 rounded-full border-2 py-1 pl-1.5 pr-2.5 shadow-[0_4px_14px_rgba(0,0,0,0.28)]',
                      'transition-transform duration-200 ease-spring motion-reduce:transition-none',
                      PIN_COLOR[station.status],
                      isSelected
                        ? 'scale-110 border-white ring-2 ring-plug-blue-500/60'
                        : 'border-white',
                    )}
                  >
                    <Zap size={13} className="shrink-0 fill-white text-white" aria-hidden="true" />
                    {maxPower > 0 ? (
                      <span className="font-mono text-[11px] font-bold leading-none text-white">
                        {maxPower}
                        <span className="ml-px text-[9px] font-semibold opacity-80">kW</span>
                      </span>
                    ) : null}
                  </span>

                  {/* Stem, so the pill points at its coordinate. */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'h-1.5 w-0.5 -translate-y-px rounded-b',
                      PIN_COLOR[station.status],
                    )}
                  />
                </span>
              </AdvancedMarker>
            )
          })}

          {userLocation ? (
            <AdvancedMarker
              position={{ lat: userLocation.lat, lng: userLocation.lng }}
              title="Your location"
            >
              <span className="relative flex h-6 w-6 items-center justify-center">
                <span
                  aria-hidden="true"
                  className="absolute inset-0 animate-ping rounded-full bg-blue-200 opacity-75"
                />
                <span className="relative h-3 w-3 rounded-full border-2 border-white bg-plug-blue-600" />
              </span>
            </AdvancedMarker>
          ) : null}
        </Map>
      </APIProvider>
    </div>
  )
}
