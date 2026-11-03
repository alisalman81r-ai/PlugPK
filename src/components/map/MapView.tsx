// src/components/map/MapView.tsx
'use client'

import dynamic from 'next/dynamic'

import type { Coordinates, Station } from '@/lib/types'
import { cn } from '@/lib/utils'

import { MapLoadingMark } from './MapLoadingMark'

export interface MapViewProps {
  stations: Station[]
  selectedStation: Station | null
  onStationSelect: (station: Station) => void
  onMapClick: () => void
  userLocation: Coordinates | null
  /** Open on the stations shown (the page arrived filtered); MapLibre only. */
  fitOnLoad?: boolean
  className?: string
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

/**
 * MapLibre is the default: the same detailed, brand-coloured map as the app,
 * with 3D buildings and grouped pins. Google stays available as an opt-in —
 * set NEXT_PUBLIC_MAP_ENGINE=google (with the key) to switch back.
 */
const USE_GOOGLE = process.env.NEXT_PUBLIC_MAP_ENGINE === 'google' && Boolean(API_KEY)

/** While the engine's chunk lands: the design's one loading state, not a spinner. */
function EngineLoading() {
  return (
    <div className="relative h-full w-full bg-[#ECEAE3]">
      <MapLoadingMark />
    </div>
  )
}

/**
 * Each engine is loaded on demand so only the one actually in use is
 * downloaded — a visitor without a Google key never pays for the Google SDK,
 * and a visitor with one never pays for MapLibre.
 */
const GoogleEngine = dynamic(
  () => import('./MapViewGoogle').then((mod) => mod.MapViewGoogle),
  { ssr: false, loading: EngineLoading },
)

const LibreEngine = dynamic(
  () => import('./MapViewLibre').then((mod) => mod.MapViewLibre),
  { ssr: false, loading: EngineLoading },
)

/**
 * Picks a map engine: MapLibre on OpenFreeMap's keyless OpenStreetMap tiles,
 * unless Google has been opted into (see USE_GOOGLE).
 *
 * Both engines take the same props and draw the same pins, so nothing
 * downstream — the list, the preview card, the sheets — knows or cares which
 * one is running.
 */
export function MapView({
  stations,
  selectedStation,
  onStationSelect,
  onMapClick,
  userLocation,
  fitOnLoad = false,
  className,
}: MapViewProps) {
  const shared = { stations, selectedStation, onStationSelect, onMapClick, userLocation }

  return (
    <div className={cn('h-full w-full', className)}>
      {USE_GOOGLE && API_KEY ? (
        <GoogleEngine {...shared} apiKey={API_KEY} />
      ) : (
        <LibreEngine {...shared} fitOnLoad={fitOnLoad} />
      )}
    </div>
  )
}
