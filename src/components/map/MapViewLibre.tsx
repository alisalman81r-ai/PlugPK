// src/components/map/MapViewLibre.tsx
'use client'

import 'maplibre-gl/dist/maplibre-gl.css'

import * as React from 'react'
import {
  AttributionControl,
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

/**
 * Framing used before the camera is fitted to the stations — and the framing
 * that stands when a filter matches nothing, so an empty result still shows a
 * recognisable Pakistan rather than a blank region.
 */
const PAKISTAN_CENTER = { latitude: 30.3753, longitude: 69.3451, zoom: 5.2 }

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
   *
   * The container check matters: `onLoad` fires when the STYLE finishes
   * loading, which can be before the surrounding flex layout has given this
   * element a size. Fitting a bounding box against a 0x0 viewport has no
   * solution, so MapLibre clamps to minimum zoom and you get the whole globe
   * instead of Pakistan. Bailing out leaves initialViewState in place, which
   * is already correct.
   */
  const frameStations = React.useCallback(() => {
    const map = mapRef.current
    if (!map || hasFramed.current || selectedStation) return

    const container = map.getContainer()
    if (!container.clientWidth || !container.clientHeight) return

    const bounds = getStationBounds(stations)
    if (!bounds) return

    hasFramed.current = true

    // A single result gives a zero-area box, which fitBounds cannot solve
    // either. Centre on it at a sensible zoom instead.
    if (bounds.north === bounds.south && bounds.east === bounds.west) {
      map.jumpTo({ center: [bounds.west, bounds.south], zoom: 12 })
      return
    }

    map.fitBounds(
      [
        [bounds.west, bounds.south],
        [bounds.east, bounds.north],
      ],
      // Padding keeps pins clear of the filter panel and the floating mobile
      // controls; maxZoom stops a tight cluster from slamming the camera to
      // street level.
      { padding: 88, maxZoom: 11, duration: 0 },
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
      // This is a map of Pakistan. Below about zoom 3.5 the viewport is wider
      // than the world, so the map wraps and renders only the low-zoom relief
      // raster — no roads, no labels, no country detail. There is no reason
      // for this product to ever show that, and the floor means no camera bug
      // can put a user there.
      minZoom={3.5}
      maxZoom={18}
      onClick={onMapClick}
      // Two passes on purpose. The first resize handles the common case; the
      // rAF pass runs after the browser has laid the flex row out, which is
      // when the container finally reports its true size — and only then is
      // it safe to fit the camera to the stations.
      onLoad={(event) => {
        const map = event.target
        map.resize()
        requestAnimationFrame(() => {
          map.resize()
          frameStations()
        })
      }}
      style={{ width: '100%', height: '100%' }}
    >
      {/* OpenStreetMap data is ODbL-licensed, so the credit is required.
          `compact` collapses it to an (i) that expands on click. */}
      <AttributionControl compact position="bottom-left" />
      {/* Zoom only. The page already renders its own "locate me" button in
          MapControls, and shipping the SDK's as well put two of them on
          screen at once. */}
      <NavigationControl position="bottom-right" showCompass={false} />

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
