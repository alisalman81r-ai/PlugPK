// src/components/map/MapView.tsx
'use client'

import dynamic from 'next/dynamic'

import type { Coordinates, Station } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface MapViewProps {
  stations: Station[]
  selectedStation: Station | null
  onStationSelect: (station: Station) => void
  onMapClick: () => void
  userLocation: Coordinates | null
  className?: string
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

function EngineLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-100">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-plug-blue-600 border-t-transparent motion-reduce:animate-none" />
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
 * Picks a map engine at runtime.
 *
 * Google Maps has no keyless tier and needs a billing-enabled Cloud project,
 * so requiring it would leave the core page of the product blank for anyone
 * who has not set that up — including on a fresh clone. When a key is
 * present the map renders on Google; when it is not, it falls back to
 * MapLibre against OpenFreeMap's keyless OpenStreetMap tiles.
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
  className,
}: MapViewProps) {
  const shared = { stations, selectedStation, onStationSelect, onMapClick, userLocation }

  return (
    <div className={cn('h-full w-full', className)}>
      {API_KEY ? <GoogleEngine {...shared} apiKey={API_KEY} /> : <LibreEngine {...shared} />}
    </div>
  )
}
