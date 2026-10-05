// src/components/admin/station-filters.ts
import type { VenueType } from '@/lib/types'

/*
  The station list's filter values, in a plain module rather than in
  StationTable. The stations page (a server component) validates the URL
  against them, and a value exported from a 'use client' file reaches a server
  component as a client reference, not as the array.
*/

export type StatusFilter = 'all' | 'available' | 'limited' | 'offline' | 'unknown'

/**
 * Where a charger sits, as a filter.
 *
 * Reads Station.venueType, a stored column — not guessed from amenities.
 * Amenities record what is NEAR a charger; a station listing a restaurant may
 * stand in a mall car park, and filing it under Restaurants on that basis
 * would put stations under headings nobody chose for them.
 *
 * Every station that predates the column reads `other`, which is why the Venue
 * not set control is there rather than hidden: that is where the unfiled
 * stations sit, and an operator needs to find them to set a venue.
 */
export type VenueFilter = 'all' | VenueType

export const VENUE_FILTERS: { value: VenueFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'standalone', label: 'Standalone' },
  { value: 'hotel', label: 'Hotels' },
  { value: 'restaurant', label: 'Restaurants' },
  { value: 'mall', label: 'Malls' },
  { value: 'office', label: 'Offices' },
  { value: 'dealership', label: 'Dealerships' },
  { value: 'service-center', label: 'Service centres' },
  { value: 'home', label: 'Homes' },
]

export const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'available', label: 'Available' },
  { value: 'limited', label: 'Limited' },
  { value: 'offline', label: 'Offline' },
  { value: 'unknown', label: 'Unknown' },
]
