// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

import type { ConnectorStatus, ConnectorType, StationStatus } from './types'

/**
 * Merge conditional class names and de-duplicate conflicting Tailwind utilities.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Format a raw distance in metres for display.
 *
 * Under 1 km resolves to whole metres, under 10 km keeps one decimal,
 * and anything beyond rounds to whole kilometres.
 */
export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return '—'

  if (meters < 1000) {
    return `${Math.round(meters)} m`
  }

  const km = meters / 1000

  if (km < 10) {
    return `${km.toFixed(1).replace(/\.0$/, '')} km`
  }

  return `${Math.round(km).toLocaleString('en-PK')} km`
}

/**
 * Format a 0–5 rating to a single decimal place, e.g. `4` -> `"4.0"`.
 * Unrated stations return an em dash so cards never render `0.0`.
 */
export function formatRating(rating: number): string {
  if (!Number.isFinite(rating) || rating <= 0) return '—'

  return Math.min(rating, 5).toFixed(1)
}

const STATUS_COLORS: Record<StationStatus | ConnectorStatus, string> = {
  available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  limited: 'bg-amber-50 text-amber-700 border-amber-200',
  'in-use': 'bg-plug-blue-50 text-plug-blue-700 border-plug-blue-200',
  offline: 'bg-red-50 text-red-700 border-red-200',
  unknown: 'bg-plug-slate-100 text-plug-slate-600 border-plug-slate-200',
}

/**
 * Badge classes (background, text, border) for a station or connector status.
 */
export function getStatusColor(status: StationStatus | ConnectorStatus): string {
  return STATUS_COLORS[status] ?? STATUS_COLORS.unknown
}

const CONNECTOR_COLORS: Record<ConnectorType, string> = {
  CCS2: 'bg-plug-blue-50 text-plug-blue-700 border-plug-blue-200',
  CHAdeMO: 'bg-plug-cyan-50 text-plug-cyan-700 border-plug-cyan-200',
  Type2: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Type1: 'bg-amber-50 text-amber-700 border-amber-200',
  GBT: 'bg-violet-50 text-violet-700 border-violet-200',
}

/**
 * Badge classes for a connector type, keeping each standard visually distinct
 * across maps, filters and station cards.
 */
export function getConnectorColor(type: ConnectorType): string {
  return CONNECTOR_COLORS[type] ?? CONNECTOR_COLORS.CCS2
}

/**
 * Format an amount in Pakistani rupees.
 *
 * Fractional amounts (per-kWh tariffs) keep two decimals; whole amounts
 * (session totals) stay clean. Pass `withDecimals` to force either behaviour.
 */
export function formatPrice(amount: number, withDecimals?: boolean): string {
  if (!Number.isFinite(amount)) return '—'

  const showDecimals = withDecimals ?? !Number.isInteger(amount)

  const value = amount.toLocaleString('en-PK', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  })

  return `Rs ${value}`
}
