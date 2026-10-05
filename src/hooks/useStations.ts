// src/hooks/useStations.ts
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import type { Coordinates, Station, StationFilters } from '@/lib/types'
import { calculateDistance, getMaxPower } from '@/lib/utils'

const defaultFilters: StationFilters = {
  connectorTypes: [],
  chargingSpeed: null,
  // Kept in the shared type but never offered: there is no live feed from the
  // hardware, so "available now" was a filter on a guess. See FilterRail.
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
  /**
   * Asks the browser for a position and, if given, sorts by it. The "find
   * chargers near me" button used to ask and then throw the answer away.
   * `onSettled` runs either way, so a spinner can stop.
   */
  locate: (onSettled?: () => void) => void
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
  /**
   * Every listing the map can show — database stations and approved business
   * listings — loaded by the /map server page and passed down.
   */
  stations: Station[]
  /** Seeds the search box from the URL, so a /map?q=... link lands filtered. */
  initialQuery?: string
}

export function useStations(options: UseStationsOptions): UseStationsReturn {
  const [filters, setFilters] = useState<StationFilters>(defaultFilters)
  const [selectedStation, setSelectedStation] = useState<Station | null>(null)
  const [searchQuery, setSearchQuery] = useState(options.initialQuery ?? '')
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null)
  /*
    The map's listings arrive as a prop from the server page.

    They used to be `[...MOCK_STATIONS, ...partnerStations]`: six fixtures
    compiled into the browser bundle, plus approved businesses fetched from
    /api/businesses after mount. So the map never showed a station an operator
    had added or edited, the fixtures shipped to every visitor, and the pins
    arrived a round trip after the page. Reading the database on the server
    fixes all three, and there is nothing left to load here.
  */
  const stations = options.stations
  const isLoading = false

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

  const locate = useCallback((onSettled?: () => void) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      onSettled?.()
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude })
        onSettled?.()
      },
      () => onSettled?.(),
      { enableHighAccuracy: true, timeout: 8000 },
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
    locate,
    stationsWithDistance,
  }
}
