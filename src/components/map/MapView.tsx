// src/components/map/MapView.tsx
'use client'

import { MapPinOff, Zap } from 'lucide-react'
import * as React from 'react'
import {
  AttributionControl,
  GeolocateControl,
  Map,
  Marker,
  NavigationControl,
  type MapRef,
} from 'react-map-gl/maplibre'

import type { Coordinates, Station, StationStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

import 'maplibre-gl/dist/maplibre-gl.css'

export interface MapViewProps {
  stations: Station[]
  selectedStation: Station | null
  onStationSelect: (station: Station) => void
  onMapClick: () => void
  userLocation: Coordinates | null
  className?: string
}

const PAKISTAN_CENTER = { longitude: 69.3451, latitude: 30.3753, zoom: 5 }

/**
 * OpenFreeMap serves OpenStreetMap-based vector tiles with no API key, no
 * account and no usage cap. `positron` is the light, low-contrast style, which
 * keeps the station pins as the loudest thing on the map.
 */
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron'

const PIN_COLOR: Record<StationStatus, string> = {
  available: 'bg-plug-blue-600',
  limited: 'bg-amber-500',
  offline: 'bg-slate-400',
  unknown: 'bg-slate-300',
}

/**
 * Shown only if the tile server cannot be reached. The sidebar station list
 * stays fully usable either way, so a network failure degrades one panel
 * rather than the whole page.
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
        The map tiles could not be loaded. Check your connection — the station list on the left
        still works.
      </p>
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

  if (hasMapError) {
    return <MapFallback className={className} />
  }

  return (
    <div className={cn('h-full w-full', className)}>
      <Map
        ref={mapRef}
        initialViewState={PAKISTAN_CENTER}
        mapStyle={MAP_STYLE}
        reuseMaps
        attributionControl={false}
        onClick={onMapClick}
        onError={() => setHasMapError(true)}
        style={{ width: '100%', height: '100%' }}
      >
        {/* OpenStreetMap data is ODbL-licensed, so the credit is required.
            `compact` collapses it to an (i) that expands on click. */}
        <AttributionControl compact position="bottom-left" />
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
