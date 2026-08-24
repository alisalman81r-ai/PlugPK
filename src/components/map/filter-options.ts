// src/components/map/filter-options.ts
import {
  Bed,
  Coffee,
  DoorOpen,
  ParkingSquare,
  ShoppingBag,
  Star,
  Utensils,
  Wifi,
  type LucideIcon,
} from 'lucide-react'

import type { AmenityType, ChargingSpeed, ConnectorType } from '@/lib/types'

/**
 * The filter vocabulary, in one place.
 *
 * The speed buckets, the amenity labels and the connector display names were
 * each written out twice — once in the desktop panel and once in the hero band
 * — with the two copies already disagreeing about how to name a Type 2 socket.
 * Two surfaces offering the same filter under different names reads as two
 * different filters, so the lists live here and every surface imports them.
 */

export interface SpeedOption {
  value: ChargingSpeed | null
  label: string
  /** The kW range, shown wherever there is room for it. */
  range: string
}

export const SPEED_OPTIONS: SpeedOption[] = [
  { value: null, label: 'Any', range: 'All speeds' },
  { value: 'slow', label: 'Slow', range: 'Up to 7 kW' },
  { value: 'fast', label: 'Fast', range: '7 – 50 kW' },
  { value: 'rapid', label: 'Rapid', range: '50 – 150 kW' },
  { value: 'ultra', label: 'Ultra', range: '150 kW+' },
]

export interface AmenityOption {
  type: AmenityType
  label: string
  icon: LucideIcon
}

export const AMENITY_OPTIONS: AmenityOption[] = [
  { type: 'restaurant', label: 'Restaurant', icon: Utensils },
  { type: 'hotel', label: 'Hotel', icon: Bed },
  { type: 'parking', label: 'Parking', icon: ParkingSquare },
  { type: 'washroom', label: 'Washroom', icon: DoorOpen },
  { type: 'wifi', label: 'WiFi', icon: Wifi },
  { type: 'shopping', label: 'Shopping', icon: ShoppingBag },
  { type: 'prayer', label: 'Prayer', icon: Star },
  { type: 'cafe', label: 'Café', icon: Coffee },
]

/** How a driver reads the socket off the charger, not how the data spells it. */
export const CONNECTOR_LABEL: Record<ConnectorType, string> = {
  CCS2: 'CCS2',
  CHAdeMO: 'CHAdeMO',
  Type2: 'Type 2',
  Type1: 'Type 1',
  GBT: 'GB/T',
}

export type SortKey = 'nearest' | 'rating' | 'recent'

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'nearest', label: 'Nearest first' },
  { value: 'rating', label: 'Top rated' },
  { value: 'recent', label: 'Recently added' },
]
