// src/components/dashboard/SavedStations.tsx
'use client'

import { Bookmark, Search } from 'lucide-react'
import * as React from 'react'

import { StationCard } from '@/components/home/StationCard'
import { Button, SearchInput } from '@/components/ui'
import type { Station } from '@/lib/types'

export interface SavedStationsProps {
  stations: Station[]
  onUnsave: (stationId: string) => void
}

type SortKey = 'name' | 'rating' | 'recent'

export function SavedStations({ stations, onUnsave }: SavedStationsProps) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [sortBy, setSortBy] = React.useState<SortKey>('recent')

  const visible = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    const matched = stations.filter((station) => {
      if (query.length === 0) return true
      return [station.name, station.address.city, station.address.area]
        .join(' ')
        .toLowerCase()
        .includes(query)
    })

    const sorted = [...matched]
    if (sortBy === 'name') return sorted.sort((a, b) => a.name.localeCompare(b.name))
    if (sortBy === 'rating') return sorted.sort((a, b) => b.rating - a.rating)
    return sorted.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
  }, [stations, searchQuery, sortBy])

  if (stations.length === 0) {
    return (
      <div className="py-20 text-center">
        <Bookmark size={64} className="mx-auto text-slate-200" aria-hidden="true" />
        <p className="mb-3 mt-6 text-2xl font-bold text-slate-900">No saved stations</p>
        <p className="text-slate-500">Stations you save will appear here</p>
        <div className="mt-6">
          <Button href="/map">Find Stations</Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-slate-500">
          {stations.length} saved station{stations.length === 1 ? '' : 's'}
        </p>

        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as SortKey)}
          aria-label="Sort saved stations"
          className="h-10 cursor-pointer rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <option value="recent">Recently updated</option>
          <option value="name">A to Z</option>
          <option value="rating">Top rated</option>
        </select>
      </div>

      <div className="mb-6">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search saved stations..."
        />
      </div>

      {visible.length === 0 ? (
        <div className="py-16 text-center">
          <Search size={48} className="mx-auto text-slate-200" aria-hidden="true" />
          <p className="mt-4 text-slate-500">No stations match your search</p>
          <div className="mt-4">
            <Button variant="ghost" onClick={() => setSearchQuery('')}>
              Clear search
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((station, index) => (
            <StationCard
              key={station.id}
              station={station}
              isSaved
              onSave={onUnsave}
              animationDelay={index * 60}
              className="animate-fade-up opacity-0"
            />
          ))}
        </div>
      )}
    </div>
  )
}
