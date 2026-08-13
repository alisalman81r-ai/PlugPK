// src/lib/utils.ts
// ═══════════════════════════════════════════════════
// PLUG.PK — UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type {
  ConnectorType,
  StationStatus,
  AmenityType,
  PostCategory
} from './types'

// ─── Class Name Utility ──────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Status Utilities ────────────────────────────────
export function getStatusConfig(status: StationStatus) {
  const configs = {
    available: {
      label: 'Available',
      color: '#22C55E',
      bgClass: 'bg-green-50',
      textClass: 'text-green-700',
      borderClass: 'border-green-200',
      pulse: true,
    },
    limited: {
      label: 'Limited',
      color: '#F59E0B',
      bgClass: 'bg-amber-50',
      textClass: 'text-amber-700',
      borderClass: 'border-amber-200',
      pulse: false,
    },
    offline: {
      label: 'Offline',
      color: '#EF4444',
      bgClass: 'bg-red-50',
      textClass: 'text-red-700',
      borderClass: 'border-red-200',
      pulse: false,
    },
    unknown: {
      label: 'Unknown',
      color: '#94A3B8',
      bgClass: 'bg-slate-50',
      textClass: 'text-slate-600',
      borderClass: 'border-slate-200',
      pulse: false,
    },
  }
  return configs[status]
}

// ─── Connector Utilities ─────────────────────────────
export function getConnectorConfig(type: ConnectorType) {
  const configs = {
    CCS2: {
      label: 'CCS2',
      bgClass: 'bg-blue-50',
      textClass: 'text-blue-700',
      borderClass: 'border-blue-200',
      description: 'DC Fast Charging',
    },
    CHAdeMO: {
      label: 'CHAdeMO',
      bgClass: 'bg-amber-50',
      textClass: 'text-amber-700',
      borderClass: 'border-amber-200',
      description: 'DC Fast Charging',
    },
    Type2: {
      label: 'Type 2',
      bgClass: 'bg-cyan-50',
      textClass: 'text-cyan-700',
      borderClass: 'border-cyan-200',
      description: 'AC Charging',
    },
    GBT: {
      label: 'GB/T',
      bgClass: 'bg-green-50',
      textClass: 'text-green-700',
      borderClass: 'border-green-200',
      description: 'DC/AC Charging',
    },
    Type1: {
      label: 'Type 1',
      bgClass: 'bg-slate-50',
      textClass: 'text-slate-700',
      borderClass: 'border-slate-200',
      description: 'AC Charging',
    },
  }
  return configs[type]
}

// ─── Speed Utilities ─────────────────────────────────
enum ChargingSpeedEnum {
  slow = 'slow',
  fast = 'fast',
  rapid = 'rapid',
  ultra = 'ultra',
}

export function getSpeedConfig(speedKw: number) {
  if (speedKw >= 150) {
    return {
      label: 'Ultra Rapid',
      speed: ChargingSpeedEnum.ultra,
      bgClass: 'bg-blue-50',
      textClass: 'text-blue-700',
    }
  }
  if (speedKw >= 50) {
    return {
      label: 'Rapid',
      speed: ChargingSpeedEnum.rapid,
      bgClass: 'bg-amber-50',
      textClass: 'text-amber-700',
    }
  }
  if (speedKw >= 7) {
    return {
      label: 'Fast',
      speed: ChargingSpeedEnum.fast,
      bgClass: 'bg-green-50',
      textClass: 'text-green-700',
    }
  }
  return {
    label: 'Slow',
    speed: ChargingSpeedEnum.slow,
    bgClass: 'bg-slate-50',
    textClass: 'text-slate-600',
  }
}

// ─── Format Utilities ────────────────────────────────
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)}km`
}

export function formatRating(rating: number): string {
  return rating.toFixed(1)
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

export function formatBattery(percent: number): string {
  return `${Math.round(percent)}%`
}

// ─── Date Utilities ──────────────────────────────────
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays < 7) return `${diffDays} days ago`
  return formatDate(dateString)
}

// ─── Station Utilities ───────────────────────────────
export function getMaxPower(station: { connectors: Array<{ maxPowerKw: number }> }): number {
  return Math.max(...station.connectors.map(c => c.maxPowerKw))
}

export function getAvailableConnectors(
  station: { connectors: Array<{ status: string }> }
): number {
  return station.connectors.filter(c => c.status === 'available').length
}

/**
 * Ports free right now, across every connector at the station. This is the
 * number a driver actually decides on — "2 of 6 free" says far more than a
 * status pill does.
 */
export function getPortAvailability(
  station: { connectors: Array<{ ports: number; availablePorts: number }> }
): { available: number; total: number } {
  return station.connectors.reduce(
    (totals, connector) => ({
      available: totals.available + connector.availablePorts,
      total: totals.total + connector.ports,
    }),
    { available: 0, total: 0 }
  )
}

/**
 * Bounding box around a set of stations, or null when there are none.
 *
 * Used to frame the map on what actually exists rather than on a fixed
 * country-wide zoom — with a handful of stations a static zoom leaves them
 * as specks in an empty frame, and the same call keeps working unchanged as
 * coverage grows.
 */
export function getStationBounds(
  stations: Array<{ coordinates: { lat: number; lng: number } }>
): { north: number; south: number; east: number; west: number } | null {
  const first = stations[0]
  if (!first) return null

  let north = first.coordinates.lat
  let south = first.coordinates.lat
  let east = first.coordinates.lng
  let west = first.coordinates.lng

  for (const station of stations) {
    const { lat, lng } = station.coordinates
    if (lat > north) north = lat
    if (lat < south) south = lat
    if (lng > east) east = lng
    if (lng < west) west = lng
  }

  return { north, south, east, west }
}


// ─── Amenity Utilities ───────────────────────────────
export function getAmenityConfig(type: AmenityType) {
  const configs: Record<AmenityType, { label: string; icon: string }> = {
    restaurant: { label: 'Restaurant', icon: 'utensils' },
    hotel:      { label: 'Hotel',      icon: 'bed' },
    parking:    { label: 'Parking',    icon: 'square-parking' },
    washroom:   { label: 'Washroom',   icon: 'door-open' },
    wifi:       { label: 'WiFi',       icon: 'wifi' },
    shopping:   { label: 'Shopping',   icon: 'shopping-bag' },
    prayer:     { label: 'Prayer',     icon: 'star' },
    cafe:       { label: 'Café',       icon: 'coffee' },
  }
  return configs[type]
}

// ─── Post Category Utilities ─────────────────────────
export function getPostCategoryConfig(category: PostCategory) {
  const configs: Record<PostCategory, { label: string; color: string }> = {
    'general':            { label: 'General EV Talk',       color: 'blue' },
    'charging-experience':{ label: 'Charging Experience',   color: 'green' },
    'trip-report':        { label: 'Trip Report',           color: 'purple' },
    'vehicle-review':     { label: 'Vehicle Review',        color: 'amber' },
    'buying-advice':      { label: 'Buying Advice',         color: 'cyan' },
    'ev-news':            { label: 'EV News Pakistan',      color: 'red' },
  }
  return configs[category]
}

// ─── Slug Utility ────────────────────────────────────
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// ─── Coordinate Utilities ────────────────────────────
export function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
