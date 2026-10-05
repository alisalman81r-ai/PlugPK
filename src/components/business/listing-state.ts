// src/components/business/listing-state.ts

/**
 * Small helpers the business portal uses on both sides of the server/client
 * line.
 *
 * Not in BusinessDashboardSidebar.tsx, which is a 'use client' module: a
 * Server Component importing a plain function from one of those receives a
 * client reference rather than the function, and calling it fails at render.
 */

/**
 * The three states a listing can be in, worded for the owner.
 *
 * This used to be two: anything not approved read "Under Review", so a
 * rejected listing sat looking as if a decision were still coming.
 */
export const LISTING_STATE = {
  pending: {
    label: 'Under review',
    pill: 'border-amber-200 bg-amber-50 text-amber-700',
    dot: 'bg-amber-500',
  },
  approved: {
    label: 'Live on Plug.pk',
    pill: 'border-green-200 bg-green-50 text-green-700',
    dot: 'bg-green-500',
  },
  rejected: {
    label: 'Not approved',
    pill: 'border-red-200 bg-red-50 text-red-700',
    dot: 'bg-red-500',
  },
} as const

export function listingState(status: string | undefined) {
  return LISTING_STATE[(status ?? 'pending') as keyof typeof LISTING_STATE] ?? LISTING_STATE.pending
}

/** A portal link that keeps the chosen listing when the account has several. */
export function listingHref(href: string, listingId: string | undefined, listingCount: number): string {
  return listingId && listingCount > 1 ? `${href}?listing=${encodeURIComponent(listingId)}` : href
}
