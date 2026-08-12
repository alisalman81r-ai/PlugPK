// src/hooks/useStations.ts
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { MOCK_STATIONS } from '@/lib/mock-data'
import type { Coordinates, Station, StationFilters } from '@/lib/types'
import { calculateDistance, getMaxPower } from '@/lib/utils'

const defaultFilters: StationFilters = {
  connectorTypes: [],
  chargingSpeed: null,
  availableOnly: false,
  minRating: 0,
  amenities: [],
  network: null,
  maxDistanceKm: null,
}

export type StationWithDistance = Station & { distanceKm?: number }

export interface UseStationsReturn {
  stations: Station[]
  filteredStations: Station[]
  filters: StationFilters
  isLoading: boolean
  selectedStation: Station | null
  setSelectedStation: (station: Station | null) => void
  updateFilter: <K extends keyof StationFilters>(key: K, value: StationFilters[K]) => void
  resetFilters: () => void
  activeFilterCount: number
  searchQuery: string
  setSearchQuery: (query: string) => void
  userLocation: Coordinates | null
  stationsWithDistance: StationWithDistance[]
}

/** Speed buckets mirror the thresholds documented on StationFilters. */
function matchesSpeed(maxPowerKw: number, speed: NonNullable<StationFilters['chargingSpeed']>) {
  switch (speed) {
    case 'slow':
      return maxPowerKw < 7
    case 'fast':
      return maxPowerKw >= 7 && maxPowerKw < 50
    case 'rapid':
      return maxPowerKw >= 50 && maxPowerKw < 150
    case 'ultra':
      return maxPowerKw >= 150
  }
}

export interface UseStationsOptions {
  /** Seeds the search box from the URL, so a /map?q=... link lands filtered. */
  initialQuery?: string
}

export function useStations(options: UseStationsOptions = {}): UseStationsReturn {
  const [filters, setFilters] = useState<StationFilters>(defaultFilters)
  const [selectedStation, setSelectedStation] = useState<Station | null>(null)
  const [searchQuery, setSearchQuery] = useState(options.initialQuery ?? '')
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const stations = MOCK_STATIONS

  // Mock data is synchronous; the flag exists so the list can show skeletons
  // for one paint and so swapping in a real fetch changes nothing else.
  useEffect(() => {
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      // Denied or unavailable is a normal outcome, not an error state.
      () => setUserLocation(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
    )
  }, [])

  const updateFilter = useCallback(
    <K extends keyof StationFilters>(key: K, value: StationFilters[K]) => {
      setFilters((current) => ({ ...current, [key]: value }))
    },
    [],
  )

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters)
  }, [])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.connectorTypes.length > 0) count += 1
    if (filters.chargingSpeed !== null) count += 1
    if (filters.availableOnly) count += 1
    if (filters.minRating > 0) count += 1
    if (filters.amenities.length > 0) count += 1
    if (filters.network !== null) count += 1
    if (filters.maxDistanceKm !== null) count += 1
    return count
  }, [filters])

  const filteredStations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return stations.filter((station) => {
      if (filters.connectorTypes.length > 0) {
        const hasConnector = station.connectors.some((connector) =>
          filters.connectorTypes.includes(connector.type),
        )
        if (!hasConnector) return false
      }

      if (filters.chargingSpeed !== null) {
        const maxPower = station.connectors.length > 0 ? getMaxPower(station) : 0
        if (!matchesSpeed(maxPower, filters.chargingSpeed)) return false
      }

      if (filters.availableOnly && station.status !== 'available') return false

      if (station.rating < filters.minRating) return false

      if (filters.amenities.length > 0) {
        const hasAll = filters.amenities.every((type) =>
          station.amenities.some((amenity) => amenity.type === type && amenity.available),
        )
        if (!hasAll) return false
      }

      if (filters.network !== null && station.network !== filters.network) return false

      if (query.length > 0) {
        const haystack = [station.name, station.address.city, station.address.area]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(query)) return false
      }

      return true
    })
  }, [stations, filters, searchQuery])

  const stationsWithDistance = useMemo<StationWithDistance[]>(() => {
    if (!userLocation) return filteredStations

    return filteredStations
      .map((station) => ({
        ...station,
        distanceKm: calculateDistance(
          userLocation.lat,
          userLocation.lng,
          station.coordinates.lat,
          station.coordinates.lng,
        ),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
  }, [filteredStations, userLocation])

  return {
    stations,
    filteredStations,
    filters,
    isLoading,
    selectedStation,
    setSelectedStation,
    updateFilter,
    resetFilters,
    activeFilterCount,
    searchQuery,
    setSearchQuery,
    userLocation,
    stationsWithDistance,
  }
}
