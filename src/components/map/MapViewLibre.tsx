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
import type { ExpressionSpecification, Map as MaplibreMap } from 'maplibre-gl'

import type { Coordinates, Station } from '@/lib/types'

import { PAKISTAN_BOUNDS } from './pakistan-bounds'
import { StationPin, UserLocationPin, pinTitle } from './StationPin'

export interface MapViewLibreProps {
  stations: Station[]
  selectedStation: Station | null
  onStationSelect: (station: Station) => void
  onMapClick: () => void
  userLocation: Coordinates | null
}

/**
 * The opening frame: the whole of Pakistan, fitted to whatever size the card is.
 *
 * It used to be a fixed centre and zoom (30.4, 69.3 at z5.2). On a desktop that
 * was roughly right; on a 390px phone the same zoom showed a strip from
 * Afghanistan to India with half the country off either edge. Bounds fit the
 * country into any viewport, which a centre-and-zoom cannot.
 *
 * It also no longer frames the stations. With the sample data in three cities
 * that cropped out Balochistan, Gilgit-Baltistan and most of KP, and a map that
 * opens on a slice of the country reads as a map of that slice.
 */
const INITIAL_VIEW = {
  bounds: [
    [PAKISTAN_BOUNDS.west, PAKISTAN_BOUNDS.south],
    [PAKISTAN_BOUNDS.east, PAKISTAN_BOUNDS.north],
  ] as [[number, number], [number, number]],
  fitBoundsOptions: { padding: 16 },
}

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

/**
 * Labels in English.
 *
 * Liberty draws each place as "latin name / local-script name", taking the
 * second line from `name:nonlatin`. Across the border that is Devanagari, so
 * the eastern half of the frame was labelled in Hindi on a map for Pakistan,
 * while Pakistani places got Urdu under English. OpenFreeMap's tiles carry
 * `name:en` and `name:latin` for this, so every symbol layer whose text comes
 * from a name is rewritten to use them, falling back to the plain name only
 * where neither exists. Layers labelled from something else — road shields
 * use `ref`, buildings a house number — are left alone.
 */
const ENGLISH_NAME: ExpressionSpecification = ['coalesce', ['get', 'name:en'], ['get', 'name:latin'], ['get', 'name']]

function applyEnglishLabels(map: MaplibreMap) {
  const layers = map.getStyle()?.layers ?? []
  for (const layer of layers) {
    if (layer.type !== 'symbol') continue
    const field = map.getLayoutProperty(layer.id, 'text-field') as unknown
    if (field === undefined || field === null) continue
    const text = JSON.stringify(field)
    if (!/"name|\{name/.test(text)) continue
    try {
      map.setLayoutProperty(layer.id, 'text-field', ENGLISH_NAME)
    } catch {
      // A layer the style does not let us restyle keeps its own labels.
    }
  }
}

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
   * Frame Pakistan once, on first load. Runs only once so it never fights the
   * flyTo below when a pin is selected, and it is skipped entirely if the user
   * arrived with a station already selected.
   *
   * initialViewState already asks for the same box, but it is solved against
   * whatever size the container had at construction — and `onLoad` can fire
   * before the surrounding layout has given this element its real size. A box
   * fitted against a 0x0 viewport has no solution, so MapLibre clamps to
   * minimum zoom and shows the globe. Fitting again after the resize below is
   * what makes a phone open on the country rather than on a strip of it.
   */
  const framePakistan = React.useCallback(() => {
    const map = mapRef.current
    if (!map || hasFramed.current || selectedStation) return

    const container = map.getContainer()
    if (!container.clientWidth || !container.clientHeight) return

    hasFramed.current = true
    // Tighter on a phone, where every pixel of padding is a pixel of country.
    const pad = container.clientWidth < 640 ? 12 : 40
    map.fitBounds(INITIAL_VIEW.bounds, { padding: pad, duration: 0 })
  }, [selectedStation])

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
      initialViewState={INITIAL_VIEW}
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
      // rAF pass runs after the browser has laid the page out, which is when
      // the container finally reports its true size — and only then is it
      // safe to fit the camera to the country.
      onLoad={(event) => {
        const map = event.target
        applyEnglishLabels(map)
        // MapLibre opens a compact attribution expanded and only folds it on
        // the first drag. On a phone the open credit is two lines across the
        // whole map, under the zoom buttons; start it folded to its (i).
        map
          .getContainer()
          .querySelector('.maplibregl-ctrl-attrib.maplibregl-compact-show')
          ?.classList.remove('maplibregl-compact-show')
        map.resize()
        requestAnimationFrame(() => {
          map.resize()
          framePakistan()
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
          <span title={pinTitle(station)}>
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
