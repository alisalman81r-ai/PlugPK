// src/components/business/portal-mode.ts

/**
 * The two sides of one business portal. One account, one sign-in; an account
 * that lists only chargers or only services never sees the other side, and one
 * that lists both switches between them.
 *
 * In a plain module rather than the 'use client' sidebar, for the same reason
 * as listing-state.ts: the /business front door is a Server Component, and a
 * value imported from a client module arrives there as a reference, not the
 * string.
 */
export type PortalMode = 'chargers' | 'services'

/** Remembers the side last opened, so /business reopens it. Read on the server. */
export const PORTAL_COOKIE = 'plugpk_portal'
