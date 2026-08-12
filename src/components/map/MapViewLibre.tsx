// src/components/map/MapViewLibre.tsx
'use client'

import 'maplibre-gl/dist/maplibre-gl.css'

import * as React from 'react'
import {
  AttributionControl,
  GeolocateControl,
  Map,
  Marker,
  NavigationControl,
  type MapRef,
} from 'react-map-gl/maplibre'

import type { Coordinates, Station } from '@/lib/types'
import { getStationBounds } from '@/lib/utils'

import { STATUS_LABEL, StationPin, UserLocationPin } from './StationPin'

export interface MapViewLibreProps {
  stations: Station[]
  selectedStation: Station | null
  onStationSelect: (station: Station) => void
  onMapClick: () => void
  userLocation: Coordinates | null
}

const PAKISTAN_CENTER = { latitude: 30.3753, longitude: 69.3451, zoom: 4.6 }

/**
 * OpenFreeMap serves OpenStreetMap vector tiles with no key and no account.
 * That is the whole reason this engine exists: the product stays usable
 * before anyone has set up a Google Cloud project.
 *
 * `liberty` rather than `positron`. Positron is a deliberately desaturated
 * cartographic base — grey land, grey water — designed to sit behind heavy
 * data overlays. With only a handful of pins on screen it just reads as
 * washed out. Liberty is the familiar full-colour road map: blue water,
 * green landcover, classified roads, ~111 layers against positron's 55.
 */
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

export function MapViewLibre({
  stations,
  selectedStation,
  onStationSelect,
  onMapClick,
  userLocation,
}: MapViewLibreProps) {
  const mapRef = React.useRef<MapRef | null>(null)
  const hasFramed = React.useRef(false)

  /**
   * Frame the stations once, on first load. Runs only once so it never
   * fights the flyTo below when a pin is selected, and it is skipped
   * entirely if the user arrived with a station already selected.
   */
  const frameStations = React.useCallback(() => {
    if (hasFramed.current || selectedStation) return
    const bounds = getStationBounds(stations)
    if (!bounds) return

    hasFramed.current = true
    mapRef.current?.fitBounds(
      [
        [bounds.west, bounds.south],
        [bounds.east, bounds.north],
      ],
      // Generous padding keeps pins clear of the filter panel and the
      // floating mobile controls; maxZoom stops a single station from
      // slamming the camera down to street level.
      { padding: 96, maxZoom: 11, duration: 0 },
    )
  }, [stations, selectedStation])

  React.useEffect(() => {
    if (!selectedStation) return
    mapRef.current?.flyTo({
      center: [selectedStation.coordinates.lng, selectedStation.coordinates.lat],
      zoom: 12,
      duration: 900,
    })
  }, [selectedStation])

  React.useEffect(() => {
    if (!userLocation) return
    mapRef.current?.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 11,
      duration: 900,
    })
  }, [userLocation])

  return (
    <Map
      ref={mapRef}
      initialViewState={PAKISTAN_CENTER}
      mapStyle={MAP_STYLE}
      // No `reuseMaps`: with reactStrictMode the component mounts, unmounts
      // and remounts, and the reused instance keeps a canvas detached from
      // the new container — the map then reports a 0x0 viewport, so tiles
      // never paint and every Marker projects to the same point.
      attributionControl={false}
      onClick={onMapClick}
      // The filter panel beside it settles after the map mounts, so resizing
      // on load makes sure the canvas matches its final size.
      onLoad={(event) => {
        event.target.resize()
        frameStations()
      }}
      style={{ width: '100%', height: '100%' }}
    >
      {/* OpenStreetMap data is ODbL-licensed, so the credit is required.
          `compact` collapses it to an (i) that expands on click. */}
      <AttributionControl compact position="bottom-left" />
      <NavigationControl position="bottom-right" showCompass={false} />
      <GeolocateControl position="bottom-right" trackUserLocation />

      {stations.map((station) => (
        <Marker
          key={station.id}
          latitude={station.coordinates.lat}
          longitude={station.coordinates.lng}
          anchor="bottom"
          onClick={(event) => {
            // Without this the click reaches the map and immediately clears
            // the selection this marker is trying to set.
            event.originalEvent.stopPropagation()
            onStationSelect(station)
          }}
        >
          <span title={`${station.name} — ${STATUS_LABEL[station.status]}`}>
            <StationPin station={station} isSelected={selectedStation?.id === station.id} />
          </span>
        </Marker>
      ))}

      {userLocation ? (
        <Marker latitude={userLocation.lat} longitude={userLocation.lng} anchor="center">
          <UserLocationPin />
        </Marker>
      ) : null}
    </Map>
  )
}
