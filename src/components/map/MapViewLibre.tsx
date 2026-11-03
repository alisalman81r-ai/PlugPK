// src/components/map/MapViewLibre.tsx
'use client'

import 'maplibre-gl/dist/maplibre-gl.css'

import * as React from 'react'
import { AttributionControl, Map, Marker, type MapRef } from 'react-map-gl/maplibre'
import type { Map as MaplibreMap } from 'maplibre-gl'

import { Maximize2, Minus, Plus } from '@/components/ui/icons'
import { prefersReduced } from '@/lib/gsap'
import type { Coordinates, Station } from '@/lib/types'
import { calculateDistance, cn } from '@/lib/utils'

import { MAP_PALETTE, MAP_STYLE, brandMap } from './map-style'
import { PAKISTAN_BOUNDS } from './pakistan-bounds'
import { MapLoadingMark } from './MapLoadingMark'
import { ClusterPin, StationPin, UserLocationPin, pinTitle } from './StationPin'

export interface MapViewLibreProps {
  stations: Station[]
  selectedStation: Station | null
  onStationSelect: (station: Station) => void
  onMapClick: () => void
  userLocation: Coordinates | null
  /**
   * Open on the stations shown rather than the whole country — set when the
   * page arrived already filtered (a ?q= link), as page-map.js opens a
   * ?city= link on that city.
   */
  fitOnLoad?: boolean
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

/** page-map.js select(): flyTo at speed 1.3 on a 1.5 curve; instant under reduced motion. */
const fly = () => ({ speed: 1.3, curve: 1.5, essential: true, ...(prefersReduced() ? { duration: 0 } : {}) })
/** A camera move's length, or none under reduced motion (page-map.js `reduce ? 0 : ms`). */
const ms = (duration: number) => (prefersReduced() ? 0 : duration)

/** page-map.js pad(): room around fitted bounds for the legend and the controls. */
function pad() {
  return window.innerWidth < 640
    ? { top: 70, bottom: 50, left: 40, right: 60 }
    : { top: 90, bottom: 70, left: 90, right: 100 }
}

/** Straight-line km between two points (page-map.js hav). */
const km = (a: Coordinates, b: Coordinates) => calculateDistance(a.lat, a.lng, b.lat, b.lng)

/** [[west, south], [east, north]] around a set of stations. */
function boundsOf(list: readonly Station[]): [[number, number], [number, number]] {
  let west = Infinity
  let south = Infinity
  let east = -Infinity
  let north = -Infinity
  for (const { coordinates } of list) {
    west = Math.min(west, coordinates.lng)
    east = Math.max(east, coordinates.lng)
    south = Math.min(south, coordinates.lat)
    north = Math.max(north, coordinates.lat)
  }
  return [
    [west, south],
    [east, north],
  ]
}

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
        'grid h-11 w-11 place-items-center rounded-[14px] border border-ink/10 font-mono text-xs font-bold shadow-e1',
        // .mapbox__btn: background .25s, color .25s, transform .3s spring; :active scale(.92).
        '[transition:background-color_.25s,color_.25s,transform_.3s_cubic-bezier(.34,1.56,.64,1)] active:scale-[0.92]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2',
        active ? 'bg-ink text-volt' : 'bg-paper/95 text-ink hover:bg-ink hover:text-white',
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
  fitOnLoad = false,
}: MapViewLibreProps) {
  const mapRef = React.useRef<MapRef | null>(null)
  const hasFramed = React.useRef(false)
  const [loaded, setLoaded] = React.useState(false)
  const [tilted, setTilted] = React.useState(false)
  const [groups, setGroups] = React.useState<PinGroup[]>(() => ungrouped(stations))
  const selectedId = selectedStation?.id
  /**
   * Whether the pins about to mount came with new data (load, a filter) —
   * they pop in after a random 0–0.15s — or with a camera move, at once.
   */
  const pinsForced = React.useRef(true)

  /**
   * page-map.js fitToVisible: frame what the filters left. One station is
   * flown to at zoom 13; stations more than 600 km apart show the country;
   * otherwise their bounds, up to zoom 13. 1.2s, or instant when reduced.
   */
  const fitToVisible = React.useCallback(
    (instant = false) => {
      const map = mapRef.current
      if (!map || stations.length === 0) return
      const [first] = stations
      if (stations.length === 1 && first) {
        map.flyTo({
          center: [first.coordinates.lng, first.coordinates.lat],
          zoom: 13,
          essential: true,
          ...(instant || prefersReduced() ? { duration: 0 } : {}),
        })
        return
      }
      const box = boundsOf(stations)
      const span = km({ lat: box[0][1], lng: box[0][0] }, { lat: box[1][1], lng: box[1][0] })
      const duration = instant ? 0 : ms(1200)
      if (span > 600) map.fitBounds(PAKISTAN, { padding: pad(), duration })
      else map.fitBounds(box, { padding: pad(), maxZoom: 13, duration })
    },
    [stations],
  )

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
    if (fitOnLoad && stations.length > 0) {
      fitToVisible(true)
      return
    }
    // Tighter on a phone, where every pixel of padding is a pixel of country.
    map.fitBounds(PAKISTAN, { padding: container.clientWidth < 640 ? 12 : 40, duration: 0 })
  }, [selectedStation, fitOnLoad, stations.length, fitToVisible])

  const regroup = React.useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map) return
    setGroups(groupStations(map, stations, selectedId))
  }, [stations, selectedId])

  // New filters or a new selection change what overlaps; a camera move is
  // handled by onMoveEnd.
  React.useEffect(() => {
    pinsForced.current = true
    if (loaded) regroup()
    else setGroups(ungrouped(stations))
  }, [loaded, regroup, stations])

  /**
   * page-map.js fitSoon: a changed filter or search reframes the map 380ms
   * later, so typing does not send the camera after every keystroke.
   */
  const lastStations = React.useRef(stations)
  React.useEffect(() => {
    if (!loaded || lastStations.current === stations) {
      lastStations.current = stations
      return
    }
    lastStations.current = stations
    const timer = window.setTimeout(() => fitToVisible(), 380)
    return () => window.clearTimeout(timer)
  }, [loaded, stations, fitToVisible])

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
        ...fly(),
      })
    } else if (hadSelection.current) {
      hadSelection.current = false
      if (!tilted) map.easeTo({ pitch: 0, duration: ms(600) })
    }
    // `tilted` is read, not reacted to: switching 3D has its own handler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStation])

  /**
   * page-map.js geolocation: when the nearest station is within 700 km, frame
   * you and the two nearest stations (up to zoom 13, 1.6s); further away the
   * camera stays where it is and only the dot appears.
   */
  React.useEffect(() => {
    const map = mapRef.current
    if (!userLocation || !map || !loaded) return
    const pool = [...stations].sort((a, b) => km(userLocation, a.coordinates) - km(userLocation, b.coordinates))
    const [near] = pool
    if (!near || km(userLocation, near.coordinates) >= 700) return
    const box = boundsOf(pool.slice(0, 2))
    map.fitBounds(
      [
        [Math.min(box[0][0], userLocation.lng), Math.min(box[0][1], userLocation.lat)],
        [Math.max(box[1][0], userLocation.lng), Math.max(box[1][1], userLocation.lat)],
      ],
      { padding: pad(), maxZoom: 13, duration: ms(1600) },
    )
    // Once per new position, against the stations shown at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, loaded])

  /**
   * page-map.js cluster click: stations within half a kilometre are flown to
   * at zoom 15; a wider group is fitted (up to zoom 14, 1.2s).
   */
  const zoomToGroup = React.useCallback((group: PinGroup) => {
    const map = mapRef.current
    if (!map) return
    const box = boundsOf(group.stations)
    const span = km({ lat: box[0][1], lng: box[0][0] }, { lat: box[1][1], lng: box[1][0] })
    if (span < 0.5) {
      map.flyTo({ center: [(box[0][0] + box[1][0]) / 2, (box[0][1] + box[1][1]) / 2], zoom: 15, essential: true })
    } else {
      map.fitBounds(box, { padding: pad(), maxZoom: 14, duration: ms(1200) })
    }
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
      duration: ms(900),
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
      duration: ms(1100),
    })
  }, [])

  /** A camera move regroups the pins; the ones it creates pop in at once. */
  const regroupAfterMove = React.useCallback(() => {
    pinsForced.current = false
    regroup()
  }, [regroup])

  return (
    // The ground colour behind the canvas, so the map arrives on its own colour
    // rather than flashing grey. The loading layer above it fades away once the
    // map has loaded (page-map.css .mapbox__loading.is-done).
    <div className="relative h-full w-full" style={{ backgroundColor: MAP_PALETTE.bg }}>
      <div className="h-full w-full">
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
          onMoveEnd={regroupAfterMove}
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

          {/* Pins arrive with the loaded map, as page-map.js renders them on "load". */}
          {loaded && groups.map((group) => {
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
                    <ClusterPin count={group.stations.length} force={pinsForced.current} />
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
                  <StationPin station={station} isSelected={isSelected} force={pinsForced.current} />
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
      <div className="absolute bottom-10 right-3 z-10 grid gap-1.5 sm:right-4">
        <div className="contents">
          <ControlButton label="Zoom in" onClick={() => mapRef.current?.zoomIn()}>
            <Plus size={18} aria-hidden="true" />
          </ControlButton>
          <ControlButton label="Zoom out" onClick={() => mapRef.current?.zoomOut()}>
            <Minus size={18} aria-hidden="true" />
          </ControlButton>
        </div>
        <div className="contents">
          <ControlButton label={tilted ? 'Flat view' : '3D view'} onClick={toggleTilt} active={tilted}>
            <span>3D</span>
          </ControlButton>
          <ControlButton label="Show all of Pakistan" onClick={resetView}>
            <Maximize2 size={17} aria-hidden="true" />
          </ControlButton>
        </div>
      </div>

      <MapLoadingMark done={loaded} />
    </div>
  )
}
