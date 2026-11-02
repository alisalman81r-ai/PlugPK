// src/lib/db/business-queries.ts
import 'server-only'

import { redirect } from 'next/navigation'

import { parseChargers } from './business-listing'
import { prisma } from './client'
import type { BusinessRow } from './queries'
import { getCurrentUser } from './session-actions'

/**
 * Reads for the business owner's portal.
 *
 * Every portal page used to take `businesses[0]` and stop there, so an owner
 * with two listings could never manage the second. Pages now take a
 * `?listing=<id>` parameter, and this module is the one place that decides
 * which listing it names — only ever one of the signed-in account's own, with
 * the newest as the default when the parameter is missing or not theirs.
 */

export interface OwnerListing extends BusinessRow {
  /** The operator's reason, shown when the listing was not approved. */
  reviewNote: string | null
  reviewedAt: string | null
}

export async function getOwnerListings(userId: string): Promise<OwnerListing[]> {
  const rows = await prisma.business.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  return rows.map((row) => ({
    id: row.id,
    ownerName: row.ownerName,
    email: row.email,
    phone: row.phone,
    businessName: row.businessName,
    businessType: row.businessType,
    city: row.city,
    address: row.address,
    website: row.website,
    description: row.description,
    lat: row.lat,
    lng: row.lng,
    chargers: parseChargers(row.chargers),
    status: row.status,
    userId: row.userId,
    reviewNote: row.reviewNote,
    // Dates cannot cross into a Client Component payload unserialised.
    reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  }))
}

export interface OwnerPortal {
  user: { id: string; name: string; email: string }
  listings: OwnerListing[]
  listing: OwnerListing
  /** The account also lists services, so the portal offers the switch. */
  hasServices: boolean
}

/**
 * Gate and loader for every charger page under /business except sign-up.
 *
 * Signed out goes to sign-in and back. An account with no charger listing goes
 * to the portal's front door, which sends a service provider to their side of
 * the portal and offers anyone else both ways to list.
 */
export async function requireOwnerPortal(
  path: string,
  requested?: string | string[],
): Promise<OwnerPortal> {
  const user = await getCurrentUser()
  if (!user) redirect(`/login?redirect=${encodeURIComponent(path)}`)

  const [listings, services] = await Promise.all([
    getOwnerListings(user.id),
    prisma.eVService.count({ where: { userId: user.id } }),
  ])
  const first = listings[0]
  if (!first) redirect('/business')

  const wanted = Array.isArray(requested) ? requested[0] : requested
  const listing = listings.find((item) => item.id === wanted) ?? first

  return { user, listings, listing, hasServices: services > 0 }
}

/** The shape the portal layout and sidebar take. */
export function portalListings(portal: OwnerPortal) {
  return {
    listing: {
      id: portal.listing.id,
      name: portal.listing.businessName,
      type: portal.listing.businessType,
      city: portal.listing.city,
      status: portal.listing.status,
    },
    listings: portal.listings.map((item) => ({
      id: item.id,
      name: item.businessName,
      status: item.status,
    })),
    mode: 'chargers' as const,
    canSwitch: portal.hasServices,
  }
}
