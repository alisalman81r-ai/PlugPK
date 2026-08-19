// src/lib/db/business-to-station.ts
import type { ConnectorType, OperatingHours, Station } from '@/lib/types'

import type { BusinessRow } from './queries'

/**
 * Turns a business listing into the Station shape the rest of the app renders.
 *
 * Listings arrive from two tables — stations entered by an operator and
 * businesses that applied through the public form — but every card, pin, filter
 * and detail page speaks Station. Mapping here means none of them need to know
 * about the second table.
 *
 * This lives in its own module because both the map feed and the public listing
 * page need it. Keeping two copies is how a listing ends up looking like one
 * thing on the map and another when you open it.
 */

const KNOWN_CONNECTORS: ConnectorType[] = ['CCS2', 'CHAdeMO', 'Type2', 'GBT', 'Type1']

/**
 * Opening times are not collected from businesses yet, and OperatingHours has
 * no optional members. Rather than assert an empty object through the type,
 * every day is marked closed and is24Hours false — visibly "not stated"
 * instead of an accidental claim that somewhere is open around the clock.
 */
export const HOURS_UNKNOWN: OperatingHours = {
  is24Hours: false,
  monday: { open: '', close: '', isClosed: true },
  tuesday: { open: '', close: '', isClosed: true },
  wednesday: { open: '', close: '', isClosed: true },
  thursday: { open: '', close: '', isClosed: true },
  friday: { open: '', close: '', isClosed: true },
  saturday: { open: '', close: '', isClosed: true },
  sunday: { open: '', close: '', isClosed: true },
}

export interface BusinessRating {
  rating: number
  reviewCount: number
}

export function businessToStation(
  business: BusinessRow,
  rating: BusinessRating = { rating: 0, reviewCount: 0 },
): Station {
  const photos = business.chargers
    .map((charger) => charger.photo)
    .filter((photo): photo is string => typeof photo === 'string' && photo.length > 0)

  const connectors = business.chargers.map((charger, index) => {
    const type = KNOWN_CONNECTORS.includes(charger.connectorType as ConnectorType)
      ? (charger.connectorType as ConnectorType)
      : 'Type2'
    const ports = Math.max(1, charger.ports || 1)

    return {
      id: `${business.id}-c${index}`,
      stationId: business.id,
      type,
      maxPowerKw: charger.maxPowerKw || 0,
      ports,
      // This feed carries no live occupancy. Showing every port free is a
      // claim; showing the count it has is a fact, so availability mirrors
      // the installed total until an operator says otherwise.
      availablePorts: ports,
      status: 'available' as const,
      compatibleVehicles: [],
    }
  })

  return {
    id: business.id,
    slug: business.id,
    name: business.businessName,
    description: business.description ?? undefined,
    address: {
      street: business.address ?? '',
      area: business.city,
      city: business.city,
      province: '',
      country: 'Pakistan',
    },
    coordinates: { lat: business.lat as number, lng: business.lng as number },
    connectors,
    amenities: [],
    operatingHours: HOURS_UNKNOWN,
    // Whatever the owner uploaded against their chargers. Without this the
    // upload would be a picture nobody outside the dashboard ever sees, which
    // is not what somebody photographing their charger is trying to do.
    photos,
    coverPhoto: photos[0],
    // Earned from reviews on this listing. A newly approved one has none, so it
    // starts at zero rather than borrowing a score.
    rating: rating.rating,
    reviewCount: rating.reviewCount,
    status: 'available',
    isVerified: true,
    // The network label is what the map shows under the name, so a home charger
    // says so rather than being presented as a commercial site. Someone
    // deciding whether to drive there should know it is a driveway.
    network: business.businessType === 'home' ? 'Home charger' : 'Partner business',
    phone: business.phone ?? undefined,
    website: business.website ?? undefined,
    businessId: business.id,
    createdAt: business.createdAt,
    updatedAt: business.createdAt,
  }
}
