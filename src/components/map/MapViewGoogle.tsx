// src/components/map/MapViewGoogle.tsx
'use client'

import { APIProvider, AdvancedMarker, Map, useMap } from '@vis.gl/react-google-maps'
import * as React from 'react'

import type { Coordinates, Station } from '@/lib/types'
import { getStationBounds } from '@/lib/utils'

import { STATUS_LABEL, StationPin, UserLocationPin } from './StationPin'

export interface MapViewGoogleProps {
  stations: Station[]
  selectedStation: Station | null
  onStationSelect: (station: Station) => void
  onMapClick: () => void
  userLocation: Coordinates | null
  apiKey: string
}

const PAKISTAN_CENTER = { lat: 30.3753, lng: 69.3451 }
const DEFAULT_ZOOM = 5.2

/** Matches the MapLibre engine: never let the camera reach world zoom. */
const MIN_ZOOM = 3.5

/**
 * Advanced Markers require a Map ID — without one Google silently renders no
 * markers at all. DEMO_MAP_ID works for development; create a real styled ID
 * in the Cloud console for production and set NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID.
 *
 * `||` not `??`: an env var declared but left empty is '', which is not
 * nullish, so `??` would pass the empty string straight through.
 */
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'

/** Lives inside <Map> so it can reach the map instance via useMap(). */
function CameraController({
  stations,
  selectedStation,
  userLocation,
}: {
  stations: Station[]
  selectedStation: Station | null
  userLocation: Coordinates | null
}) {
  const map = useMap()
  const hasFramed = React.useRef(false)

  /**
   * Frame the stations once the map exists, so a small catalogue fills the
   * view instead of sitting as specks inside a country-wide zoom. Guarded by
   * a ref so it never fights the selection pan below.
   */
  React.useEffect(() => {
    if (!map || hasFramed.current || selectedStation) return
    const bounds = getStationBounds(stations)
    if (!bounds) return

    hasFramed.current = true
    map.fitBounds(
      { north: bounds.north, south: bounds.south, east: bounds.east, west: bounds.west },
      96,
    )
  }, [map, stations, selectedStation])

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

export function MapViewGoogle({
  stations,
  selectedStation,
  onStationSelect,
  onMapClick,
  userLocation,
  apiKey,
}: MapViewGoogleProps) {
  return (
    <APIProvider apiKey={apiKey}>
      <Map
        mapId={MAP_ID}
        defaultCenter={PAKISTAN_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        minZoom={MIN_ZOOM}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={false}
        onClick={onMapClick}
        style={{ width: '100%', height: '100%' }}
      >
        <CameraController
          stations={stations}
          selectedStation={selectedStation}
          userLocation={userLocation}
        />

        {stations.map((station) => (
          <AdvancedMarker
            key={station.id}
            position={{ lat: station.coordinates.lat, lng: station.coordinates.lng }}
            title={`${station.name} — ${STATUS_LABEL[station.status]}`}
            // Selected pin rides above its neighbours rather than being
            // overlapped by whatever the map happens to draw later.
            zIndex={selectedStation?.id === station.id ? 20 : 1}
            onClick={() => onStationSelect(station)}
          >
            <StationPin station={station} isSelected={selectedStation?.id === station.id} />
          </AdvancedMarker>
        ))}

        {userLocation ? (
          <AdvancedMarker
            position={{ lat: userLocation.lat, lng: userLocation.lng }}
            title="Your location"
          >
            <UserLocationPin />
          </AdvancedMarker>
        ) : null}
      </Map>
    </APIProvider>
  )
}
