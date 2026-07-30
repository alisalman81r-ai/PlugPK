// src/components/map/MobileStationSheet.tsx
'use client'

import type { Station } from '@/lib/types'
import { cn } from '@/lib/utils'
import { StationListItem, StationListSkeleton } from './StationList'
import { StationPreviewCard } from './StationPreviewCard'

export interface MobileStationSheetProps {
  stations: (Station & { distanceKm?: number })[]
  selectedStation: Station | null
  onStationSelect: (station: Station) => void
  onClearSelection: () => void
  isLoading: boolean
  onViewDetails: (station: Station) => void
  onNavigate: (station: Station) => void
}

export function MobileStationSheet({
  stations,
  selectedStation,
  onStationSelect,
  onClearSelection,
  isLoading,
  onViewDetails,
  onNavigate,
}: MobileStationSheetProps) {
  // Sits above the 64px BottomTabBar plus the device safe area.
  const offset = 'bottom-[calc(4rem+env(safe-area-inset-bottom))]'

  if (selectedStation) {
    const withDistance = stations.find((item) => item.id === selectedStation.id)

    return (
      <div
        className={cn(
          'fixed inset-x-0 z-30 animate-slide-up px-3 pb-3 lg:hidden',
          offset,
        )}
      >
        <StationPreviewCard
          station={selectedStation}
          distanceKm={withDistance?.distanceKm}
          onClose={onClearSelection}
          onViewDetails={onViewDetails}
          onNavigate={onNavigate}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'fixed inset-x-0 z-30 rounded-t-3xl bg-white shadow-[0_-4px_40px_rgba(0,0,0,0.10)] lg:hidden',
        offset,
      )}
    >
      <span aria-hidden="true" className="mx-auto mb-1 mt-3 block h-1 w-10 rounded-full bg-slate-200" />

      <p className="px-4 py-3 text-sm font-semibold text-slate-700">
        {stations.length} station{stations.length === 1 ? '' : 's'} nearby
      </p>

      <div className="scrollbar-hide flex max-h-[280px] flex-col gap-3 overflow-y-auto px-4 pb-4">
        {isLoading ? (
          <StationListSkeleton count={3} />
        ) : stations.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No stations match these filters.</p>
        ) : (
          stations.map((station) => (
            <StationListItem
              key={station.id}
              station={station}
              isSelected={false}
              onClick={onStationSelect}
              distanceKm={station.distanceKm}
            />
          ))
        )}
      </div>
    </div>
  )
}
