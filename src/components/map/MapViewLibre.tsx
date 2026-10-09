// src/components/map/MapViewLibre.tsx
'use client'

import 'maplibre-gl/dist/maplibre-gl.css'

import * as React from 'react'
import { AttributionControl, Map, Marker, type MapRef } from 'react-map-gl/maplibre'
import type { Map as MaplibreMap } from 'maplibre-gl'

import { Maximize2, Minus, Plus } from '@/components/ui/icons'
import type { Coordinates, Station } from '@/lib/types'
import { cn } from '@/lib/utils'

import { MAP_STYLE, PALETTE, brandMap } from './map-style'
import { PAKISTAN_BOUNDS } from './pakistan-bounds'
import { ClusterPin, StationPin, UserLocationPin, pinTitle } from './StationPin'

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
 * Bounds rather than a centre and zoom: on a 390px phone a fixed zoom showed a
 * strip from Afghanistan to India with half the country off either edge.
 * Bounds fit the country into any viewport. Nor does it frame the stations —
 * with listings in three cities that cropped out Balochistan, Gilgit-Baltistan
 * and most of KP, and a map that opens on a slice reads as a map of the slice.
 */
const PAKISTAN: [[number, number], [number, number]] = [
  [PAKISTAN_BOUNDS.west, PAKISTAN_BOUNDS.south],
  [PAKISTAN_BOUNDS.east, PAKISTAN_BOUNDS.north],
]
const INITIAL_VIEW = { bounds: PAKISTAN, fitBoundsOptions: { padding: 16 } }

/** Zoom and tilt when a station is chosen: close enough to see its street in 3D. */
const STATION_ZOOM = 15.6
const STATION_PITCH = 48
/** The tilt the 3D switch applies to wherever the map already is. */
const TILT = 55
/**
 * Where the chosen pin lands, as a shift from the centre (negative is up).
 * On a desktop the preview card floats over the lower half of the map, so the
 * pin rises well clear of it; on a phone the card docks below and a small lift
 * leaves room for the name label.
 */
function stationOffset(): [number, number] {
  const desktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
  return [0, desktop ? -150 : -40]
}

/** Pins closer than this on screen merge into one bubble with a count. */
const CLUSTER_PX = 54

/** Camera moves share one feel: the same length and the same arc. */
const FLY = { duration: 1250, curve: 1.25, essential: true } as const

interface PinGroup {
  key: string
  stations: Station[]
  lng: number
  lat: number
}

/**
 * Groups pins that would overlap at the current zoom. Greedy: each pin not yet
 * taken claims every free pin within CLUSTER_PX of it. The selected station is
 * never grouped, so the pin someone chose stays on screen.
 */
function groupStations(map: MaplibreMap, stations: Station[], selectedId: string | undefined): PinGroup[] {
  const items = stations.map((station) => ({
    station,
    point: map.project([station.coordinates.lng, station.coordinates.lat]),
  }))
  const used = new Set<string>()
  const groups: PinGroup[] = []
  for (const a of items) {
    if (used.has(a.station.id)) continue
    const members =
      a.station.id === selectedId
        ? [a]
        : items.filter(
            (b) =>
              !used.has(b.station.id) &&
              b.station.id !== selectedId &&
              Math.hypot(a.point.x - b.point.x, a.point.y - b.point.y) < CLUSTER_PX,
          )
    members.forEach((m) => used.add(m.station.id))
    groups.push({
      key: members.map((m) => m.station.id).join('|'),
      stations: members.map((m) => m.station),
      lng: members.reduce((sum, m) => sum + m.station.coordinates.lng, 0) / members.length,
      lat: members.reduce((sum, m) => sum + m.station.coordinates.lat, 0) / members.length,
    })
  }
  return groups
}

/** Before the map can project anything, every station stands alone. */
function ungrouped(stations: Station[]): PinGroup[] {
  return stations.map((station) => ({
    key: station.id,
    stations: [station],
    lng: station.coordinates.lng,
    lat: station.coordinates.lat,
  }))
}

/** One button in the floating control stack. */
function ControlButton({
  label,
  onClick,
  active = false,
  children,
}: {
  label: string
  onClick: () => void
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active || undefined}
      title={label}
      className={cn(
        'flex h-11 w-11 items-center justify-center text-slate-700 transition-colors duration-150',
        'hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-plug-blue-500',
        active && 'bg-plug-blue-600 text-plug-cyan-300 hover:bg-plug-blue-700',
      )}
    >
      {children}
    </button>
  )
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
  const [loaded, setLoaded] = React.useState(false)
  const [tilted, setTilted] = React.useState(false)
  const [groups, setGroups] = React.useState<PinGroup[]>(() => ungrouped(stations))
  const selectedId = selectedStation?.id

  /**
   * Frame Pakistan once, on first load, unless someone arrived with a station
   * already chosen. initialViewState asks for the same box, but it is solved
   * against the container's size at construction — and `onLoad` can fire before
   * the layout has given this element its real size. A box fitted to a 0x0
   * viewport clamps to minimum zoom and shows the globe, so it is fitted again
   * once the container has measured.
   */
  const framePakistan = React.useCallback(() => {
    const map = mapRef.current
    if (!map || hasFramed.current || selectedStation) return
    const container = map.getContainer()
    if (!container.clientWidth || !container.clientHeight) return
    hasFramed.current = true
    // Tighter on a phone, where every pixel of padding is a pixel of country.
    map.fitBounds(PAKISTAN, { padding: container.clientWidth < 640 ? 12 : 40, duration: 0 })
  }, [selectedStation])

  const regroup = React.useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map) return
    setGroups(groupStations(map, stations, selectedId))
  }, [stations, selectedId])

  // New filters or a new selection change what overlaps; a camera move is
  // handled by onMoveEnd.
  React.useEffect(() => {
    if (loaded) regroup()
    else setGroups(ungrouped(stations))
  }, [loaded, regroup, stations])

  /**
   * Choosing a station flies down to its street and tilts the camera, so the
   * buildings around it rise. Clearing the selection levels the camera again
   * (unless 3D is switched on) and leaves the zoom where it is.
   */
  const hadSelection = React.useRef(false)
  React.useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (selectedStation) {
      hadSelection.current = true
      map.flyTo({
        center: [selectedStation.coordinates.lng, selectedStation.coordinates.lat],
        zoom: Math.max(map.getZoom(), STATION_ZOOM),
        pitch: Math.max(map.getPitch(), STATION_PITCH),
        offset: stationOffset(),
        ...FLY,
      })
    } else if (hadSelection.current) {
      hadSelection.current = false
      if (!tilted) map.easeTo({ pitch: 0, duration: 600 })
    }
    // `tilted` is read, not reacted to: switching 3D has its own handler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStation])

  React.useEffect(() => {
    if (!userLocation) return
    mapRef.current?.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 13, ...FLY })
  }, [userLocation])

  const zoomToGroup = React.useCallback((group: PinGroup) => {
    const map = mapRef.current
    if (!map) return
    let west = Infinity
    let south = Infinity
    let east = -Infinity
    let north = -Infinity
    for (const { coordinates } of group.stations) {
      west = Math.min(west, coordinates.lng)
      east = Math.max(east, coordinates.lng)
      south = Math.min(south, coordinates.lat)
      north = Math.max(north, coordinates.lat)
    }
    map.fitBounds(
      [
        [west, south],
        [east, north],
      ],
      { padding: 96, maxZoom: 16, duration: 900 },
    )
  }, [])

  const toggleTilt = React.useCallback(() => {
    const map = mapRef.current
    if (!map) return
    const next = !tilted
    setTilted(next)
    // Buildings only stand up from zoom 15, so 3D also brings the camera down
    // to street level if it is above it.
    map.easeTo({
      pitch: next ? TILT : 0,
      zoom: next ? Math.max(map.getZoom(), 15.2) : map.getZoom(),
      duration: 900,
    })
  }, [tilted])

  const resetView = React.useCallback(() => {
    const map = mapRef.current
    if (!map) return
    setTilted(false)
    const container = map.getContainer()
    map.fitBounds(PAKISTAN, {
      padding: container.clientWidth < 640 ? 12 : 40,
      pitch: 0,
      bearing: 0,
      duration: 1100,
    })
  }, [])

  return (
    // The ground colour behind the canvas, so the map arrives on its own colour
    // rather than flashing grey.
    <div className="relative h-full w-full" style={{ backgroundColor: PALETTE.bg }}>
      <div
        className={cn(
          'h-full w-full transition-opacity duration-500 motion-reduce:transition-none',
          loaded ? 'opacity-100' : 'opacity-0',
        )}
      >
        <Map
          ref={mapRef}
          initialViewState={INITIAL_VIEW}
          mapStyle={MAP_STYLE}
          // No `reuseMaps`: with reactStrictMode the component mounts, unmounts
          // and remounts, and the reused instance keeps a canvas detached from
          // the new container — every Marker then projects to the same point.
          attributionControl={false}
          // A map of Pakistan: below about 3.5 the viewport is wider than the
          // world and only the low-zoom relief raster draws.
          minZoom={3.5}
          maxZoom={19}
          maxPitch={60}
          // Rotation and drag-to-tilt are off: the 3D switch does the tilting,
          // and a map knocked off north by a stray two-finger gesture is a map
          // people get lost in.
          dragRotate={false}
          touchPitch={false}
          pitchWithRotate={false}
          // Smoothness. A 3x phone screen drawn at 2x is indistinguishable on a
          // map and a little over half the pixels per frame; one copy of the
          // world is all Pakistan needs; labels fade in quicker as tiles land.
          pixelRatio={Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1, 2)}
          renderWorldCopies={false}
          fadeDuration={150}
          onClick={onMapClick}
          onMoveEnd={regroup}
          onLoad={(event) => {
            const map = event.target
            map.touchZoomRotate.disableRotation()
            brandMap(map)
            // MapLibre opens a compact attribution expanded and only folds it
            // on the first drag; start it folded to its (i).
            map
              .getContainer()
              .querySelector('.maplibregl-ctrl-attrib.maplibregl-compact-show')
              ?.classList.remove('maplibregl-compact-show')
            map.resize()
            // After layout, when the container reports its true size.
            requestAnimationFrame(() => {
              map.resize()
              framePakistan()
              setLoaded(true)
            })
          }}
          style={{ width: '100%', height: '100%' }}
        >
          {/* OpenStreetMap data is ODbL-licensed, so the credit is required. */}
          <AttributionControl compact position="bottom-left" />

          {groups.map((group) => {
            if (group.stations.length > 1) {
              return (
                <Marker
                  key={group.key}
                  latitude={group.lat}
                  longitude={group.lng}
                  anchor="center"
                  onClick={(event) => {
                    event.originalEvent.stopPropagation()
                    zoomToGroup(group)
                  }}
                >
                  <span role="button" aria-label={`${group.stations.length} stations here, zoom in`}>
                    <ClusterPin count={group.stations.length} />
                  </span>
                </Marker>
              )
            }
            const [station] = group.stations
            if (!station) return null
            const isSelected = station.id === selectedId
            return (
              <Marker
                key={station.id}
                latitude={station.coordinates.lat}
                longitude={station.coordinates.lng}
                anchor="bottom"
                // The chosen pin sits above its neighbours.
                style={{ zIndex: isSelected ? 2 : 1 }}
                onClick={(event) => {
                  // Without this the click reaches the map and immediately
                  // clears the selection this marker is setting.
                  event.originalEvent.stopPropagation()
                  onStationSelect(station)
                }}
              >
                <span title={pinTitle(station)}>
                  <StationPin station={station} isSelected={isSelected} />
                </span>
              </Marker>
            )
          })}

          {userLocation ? (
            <Marker latitude={userLocation.lat} longitude={userLocation.lng} anchor="center">
              <UserLocationPin />
            </Marker>
          ) : null}
        </Map>
      </div>

      {/* Zoom, 3D and reset. Solid white rather than frosted: a backdrop blur
          over a live map is re-blurred on every frame. On a phone they sit
          under the locate button, clear of the station card that docks at the
          bottom; from md up, bottom-right. */}
      <div className="absolute right-4 top-[8.75rem] z-10 flex flex-col gap-2 md:bottom-8 md:top-auto">
        <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-e3">
          <ControlButton label="Zoom in" onClick={() => mapRef.current?.zoomIn({ duration: 300 })}>
            <Plus size={18} aria-hidden="true" />
          </ControlButton>
          <span aria-hidden="true" className="mx-2.5 h-px bg-slate-200" />
          <ControlButton label="Zoom out" onClick={() => mapRef.current?.zoomOut({ duration: 300 })}>
            <Minus size={18} aria-hidden="true" />
          </ControlButton>
        </div>
        <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-e3">
          <ControlButton label={tilted ? 'Flat view' : '3D view'} onClick={toggleTilt} active={tilted}>
            <span className="text-ui-xs font-bold tracking-wide">3D</span>
          </ControlButton>
          <span aria-hidden="true" className="mx-2.5 h-px bg-slate-200" />
          <ControlButton label="Show all of Pakistan" onClick={resetView}>
            <Maximize2 size={17} aria-hidden="true" />
          </ControlButton>
        </div>
      </div>

      {!loaded ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-3 rounded-full bg-white/95 px-4 py-2.5 shadow-e3">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-plug-blue-600 border-t-transparent motion-reduce:animate-none" />
            <span className="text-ui-sm font-semibold text-slate-700">Loading the map…</span>
          </div>
        </div>
      ) : null}
    </div>
  )
}
