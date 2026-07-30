// src/components/map/MapView.tsx
'use client'

import { MapPinOff, Zap } from 'lucide-react'
import * as React from 'react'
import { GeolocateControl, Map, Marker, NavigationControl, type MapRef } from 'react-map-gl/mapbox'

import type { Coordinates, Station, StationStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

import 'mapbox-gl/dist/mapbox-gl.css'

export interface MapViewProps {
  stations: Station[]
  selectedStation: Station | null
  onStationSelect: (station: Station) => void
  onMapClick: () => void
  userLocation: Coordinates | null
  className?: string
}

const PAKISTAN_CENTER = { longitude: 69.3451, latitude: 30.3753, zoom: 5 }

const PIN_COLOR: Record<StationStatus, string> = {
  available: 'bg-plug-blue-600',
  limited: 'bg-amber-500',
  offline: 'bg-slate-400',
  unknown: 'bg-slate-300',
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

/**
 * Shown when the map cannot render — no token configured, or Mapbox rejected
 * the one supplied. The sidebar station list stays fully usable either way, so
 * a bad credential degrades one panel rather than the whole page.
 */
function MapFallback({ reason, className }: { reason: string; className?: string }) {
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
      <p className="max-w-xs text-xs leading-relaxed text-slate-500">{reason}</p>
      <code className="rounded-lg bg-white px-3 py-1.5 font-mono text-[11px] text-slate-500">
        NEXT_PUBLIC_MAPBOX_TOKEN
      </code>
    </div>
  )
}

export function MapView({
  stations,
  selectedStation,
  onStationSelect,
  onMapClick,
  userLocation,
  className,
}: MapViewProps) {
  const mapRef = React.useRef<MapRef>(null)
  const [hasMapError, setHasMapError] = React.useState(false)

  // Recentre when a station is picked from the list or a pin is tapped.
  React.useEffect(() => {
    if (!selectedStation || !mapRef.current) return
    mapRef.current.flyTo({
      center: [selectedStation.coordinates.lng, selectedStation.coordinates.lat],
      zoom: 12,
      duration: 900,
    })
  }, [selectedStation])

  React.useEffect(() => {
    if (!userLocation || !mapRef.current) return
    mapRef.current.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 11,
      duration: 900,
    })
  }, [userLocation])

  if (!MAPBOX_TOKEN) {
    return (
      <MapFallback
        className={className}
        reason="No Mapbox access token is configured. Add a public token to .env.local and restart the dev server."
      />
    )
  }

  if (hasMapError) {
    return (
      <MapFallback
        className={className}
        reason="Mapbox rejected the access token. Replace it with a valid public token from account.mapbox.com and restart the dev server."
      />
    )
  }

  return (
    <div className={cn('h-full w-full', className)}>
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={PAKISTAN_CENTER}
        mapStyle="mapbox://styles/mapbox/light-v11"
        reuseMaps
        attributionControl={false}
        onClick={onMapClick}
        onError={() => setHasMapError(true)}
        style={{ width: '100%', height: '100%' }}
      >
        <GeolocateControl position="bottom-right" trackUserLocation />
        <NavigationControl position="bottom-right" showCompass={false} />

        {stations.map((station) => {
          const isSelected = selectedStation?.id === station.id

          return (
            <Marker
              key={station.id}
              longitude={station.coordinates.lng}
              latitude={station.coordinates.lat}
              anchor="bottom"
              onClick={(event) => {
                // Keep the click from reaching the map and clearing selection.
                event.originalEvent.stopPropagation()
                onStationSelect(station)
              }}
            >
              <span
                className={cn(
                  'relative flex cursor-pointer items-center justify-center transition-transform duration-200 ease-spring',
                  isSelected ? 'h-11 w-11 scale-125 rounded-full bg-plug-blue-600/15' : 'h-9 w-9',
                )}
              >
                {station.status === 'available' ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 animate-pulse-ring rounded-full bg-plug-blue-600/30"
                  />
                ) : null}

                <span
                  className={cn(
                    'relative flex h-9 w-9 items-center justify-center rounded-full border-2 shadow-[0_4px_12px_rgba(0,0,0,0.20)]',
                    PIN_COLOR[station.status],
                    isSelected
                      ? 'border-blue-300 shadow-[0_8px_25px_rgba(37,99,235,0.40)]'
                      : 'border-white',
                  )}
                >
                  <Zap size={16} className="fill-white text-white" aria-hidden="true" />
                </span>
              </span>
            </Marker>
          )
        })}

        {userLocation ? (
          <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
            <span className="relative flex h-6 w-6 items-center justify-center">
              <span
                aria-hidden="true"
                className="absolute inset-0 animate-ping rounded-full bg-blue-200 opacity-75"
              />
              <span className="relative h-3 w-3 rounded-full border-2 border-white bg-plug-blue-600" />
            </span>
          </Marker>
        ) : null}
      </Map>
    </div>
  )
}
