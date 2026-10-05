// src/components/map/MapViewGoogle.tsx
'use client'

import { APIProvider, AdvancedMarker, Map, useMap } from '@vis.gl/react-google-maps'
import * as React from 'react'

import type { Coordinates, Station } from '@/lib/types'

import { PAKISTAN_BOUNDS } from './pakistan-bounds'
import { StationPin, UserLocationPin, pinTitle } from './StationPin'

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
  selectedStation,
  userLocation,
}: {
  selectedStation: Station | null
  userLocation: Coordinates | null
}) {
  const map = useMap()
  const hasFramed = React.useRef(false)

  /**
   * Frame Pakistan once the map exists — the same box the MapLibre engine
   * opens on (see pakistan-bounds.ts), so the two engines agree. A fixed
   * centre and zoom showed a sliver of the country on a phone; bounds fit any
   * card. Guarded by a ref so it never fights the selection pan below.
   */
  React.useEffect(() => {
    if (!map || hasFramed.current || selectedStation) return
    hasFramed.current = true
    const narrow = map.getDiv().clientWidth < 640
    map.fitBounds(PAKISTAN_BOUNDS, narrow ? 12 : 40)
  }, [map, selectedStation])

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
    // English labels, and borders as Google draws them for Pakistan (`region`
    // localises disputed boundaries). See the Kashmir note in pakistan-bounds.ts.
    <APIProvider apiKey={apiKey} language="en" region="PK">
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
          selectedStation={selectedStation}
          userLocation={userLocation}
        />

        {stations.map((station) => (
          <AdvancedMarker
            key={station.id}
            position={{ lat: station.coordinates.lat, lng: station.coordinates.lng }}
            title={pinTitle(station)}
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
