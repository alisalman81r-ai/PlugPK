// src/lib/db/membership.ts
import 'server-only'

import { prisma } from './client'

/**
 * Who has paid to join what.
 *
 * ── One place that decides what "a member" means ──────────────────────
 *
 * Everything that asks the question goes through here: the club cards, the
 * member counts, and later the checkout route that has to refuse a second
 * purchase. The definition is deliberately narrow and written once — a row
 * with status 'active' — because the alternative is what this codebase has
 * had to unpick twice: a check copied into seven modules, and two screens
 * counting the same thing differently.
 *
 * A 'pending' row is not a member. It is a checkout that was opened and may
 * never be paid, and treating it as access would hand out memberships to
 * anyone who reached the Stripe page and closed the tab.
 *
 * ── Phase 1 reads only ────────────────────────────────────────────────
 *
 * Nothing here writes. Creating a membership belongs to the Stripe webhook,
 * which is the only thing that can say a payment was verified, and that lands
 * in a later phase. Until then these helpers will honestly report that nobody
 * is a member of anything, which is true.
 */

/** What can be joined. `community` has nothing to point at yet. */
export type MembershipScope = 'club' | 'community'

/**
 * A membership's life.
 *
 *   pending   checkout opened, payment not confirmed — NOT access
 *   active    a verified payment, access granted
 *   refunded  the payment record stands, the access does not
 *
 * Stored as a string rather than a Postgres enum to match every other status
 * column in this schema, and so a new state does not need a migration on a
 * type that other tables share.
 */
export type MembershipStatus = 'pending' | 'active' | 'refunded'

/** The only status that grants anything. */
const ACTIVE: MembershipStatus = 'active'

/**
 * Whether this user may use this club.
 *
 * The question the Join button asks, and the one the checkout route will ask
 * before it opens a second payment for something already owned.
 */
export async function hasActiveMembership(
  userId: string,
  scope: MembershipScope,
  scopeId: string,
): Promise<boolean> {
  const row = await prisma.membership.findUnique({
    // The compound unique index, so this is a single indexed lookup rather
    // than a scan of everything the user has ever bought.
    where: { userId_scope_scopeId: { userId, scope, scopeId } },
    select: { status: true },
  })

  return row?.status === ACTIVE
}

/**
 * Every scopeId this user is an active member of, as a Set.
 *
 * One query for a page of club cards instead of one per card. A directory of
 * eight clubs asking `hasActiveMembership` each would be eight round trips to
 * a database in another region, and would get slower as clubs are added —
 * the shape of problem this product has already had to fix once on the
 * homepage.
 *
 * Returns an empty Set for a signed-out reader, so callers need no null check
 * and a signed-out page renders as "joined nothing" rather than crashing.
 */
export async function listActiveMembershipIds(
  userId: string | undefined,
  scope: MembershipScope,
): Promise<Set<string>> {
  if (!userId) return new Set()

  const rows = await prisma.membership.findMany({
    where: { userId, scope, status: ACTIVE },
    select: { scopeId: true },
  })

  return new Set(rows.map((row) => row.scopeId))
}

/**
 * How many active members each scopeId has, as a Map.
 *
 * Grouped in the database rather than counted in memory, and keyed by scopeId
 * so a caller can look up a club it already has without a second query.
 * Anything with no members is absent from the Map rather than present as 0 —
 * callers should read it with `?? 0`.
 */
export async function countActiveMembers(
  scope: MembershipScope,
): Promise<Map<string, number>> {
  const rows = await prisma.membership.groupBy({
    by: ['scopeId'],
    where: { scope, status: ACTIVE },
    _count: { _all: true },
  })

  return new Map(rows.map((row) => [row.scopeId, row._count._all]))
}
