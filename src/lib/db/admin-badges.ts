// src/lib/db/admin-badges.ts
import { prisma } from './client'

/**
 * What is waiting for an operator, per nav entry.
 *
 * A badge here means "there is work on this page that nobody has dealt with
 * yet" — not "something changed". That distinction is the whole design:
 *
 *   - Every count below is a queue with an explicit unresolved state already
 *     in the schema: a business awaiting approval, a meeting nobody has
 *     answered, a proposed change nobody has accepted or rejected. Acting on
 *     the item is what clears the badge, because the same row the page writes
 *     is the row this counts. There is no separate "seen" flag to drift out of
 *     step with reality, and nothing to mark as read.
 *   - Pages with no queue — Stations, Connectors, Members, Services,
 *     Community, Cars, Sources — get no badge. A counter that showed
 *     "12 stations" would be decoration dressed as an alert, and once a badge can
 *     mean "there are things here" the operator stops believing the ones that
 *     mean "act on this".
 *
 *     Sources was counted here and has been removed, because it failed the test
 *     above rather than because the number was unwanted. It counted
 *     `CarSourceRecord` rows with `reviewStatus: 'pending'`, which is every row
 *     a crawl has ever staged: the writer in crawler/propose.ts sets 'pending'
 *     and, while car-source-store.ts exports setReviewStatus, **nothing in the
 *     portal calls it**. So no action on the Sources page could clear the badge.
 *     It read 24 of 24 records, and each crawl would only push it higher — a
 *     permanent alert for work that has no clearing action, which is exactly the
 *     kind of badge this file exists to keep out of the sidebar. Staged records
 *     are inventory; the queue an operator does act on is the proposals one, at
 *     /admin/cars/review, which is still badged.
 *
 * Keyed by href so AdminNav can look each entry up without a second mapping
 * table that could disagree with the nav itself.
 */
export type AdminBadgeCounts = Record<string, number>

/**
 * The queues, each paired with the page that clears it.
 *
 * Kept as data rather than a hand-written Promise.all so that adding a queue
 * is one line, and so the href is written beside the query it belongs to
 * rather than in a separate lookup that can fall out of step.
 */
interface Queue {
  href: string
  /** Singular and plural, so the dashboard never prints "1 items". */
  one: string
  many: string
  count: () => Promise<number>
}

const QUEUES: Queue[] = [
  {
    // Applications from the public "list your business" form.
    href: '/admin/businesses',
    one: 'business awaiting approval',
    many: 'businesses awaiting approval',
    count: () => prisma.business.count({ where: { status: 'pending' } }),
  },
  {
    // Meeting requests nobody has opened. 'new' rather than 'pending': that is
    // the default the schema gives a fresh request.
    href: '/admin/meetings',
    one: 'meeting request unanswered',
    many: 'meeting requests unanswered',
    count: () => prisma.meetingRequest.count({ where: { status: 'new' } }),
  },
  {
    // Businesses applying to be listed in the EV services directory. Same
    // shape as the charger-host queue above: submitted by the public, invisible
    // on the site until a person approves it.
    href: '/admin/services',
    one: 'service application to review',
    many: 'service applications to review',
    count: () => prisma.eVService.count({ where: { status: 'pending' } }),
  },
  {
    // Field changes the crawler proposed against the car catalogue.
    href: '/admin/cars/review',
    one: 'proposed change to review',
    many: 'proposed changes to review',
    count: () => prisma.carFieldChange.count({ where: { status: 'pending' } }),
  },
  {
    // Cars a source has seen that the catalogue does not hold yet.
    href: '/admin/cars/updates',
    one: 'possible new car to confirm',
    many: 'possible new cars to confirm',
    count: () => prisma.carCandidate.count({ where: { status: 'pending' } }),
  },
]

export interface PendingQueue {
  href: string
  count: number
  /** Already pluralised against the count. */
  label: string
}

/**
 * The same queues the badges count, described in words for the dashboard.
 *
 * Shares one source with getAdminBadgeCounts deliberately: a dashboard that
 * said "nothing waiting" while a sidebar badge showed 5 would make both
 * untrustworthy, and two separate lists is how that happens.
 */
export async function listPendingQueues(): Promise<PendingQueue[]> {
  const counts = await getAdminBadgeCounts()

  return QUEUES.filter((queue) => (counts[queue.href] ?? 0) > 0).map((queue) => {
    const count = counts[queue.href] as number
    return { href: queue.href, count, label: count === 1 ? queue.one : queue.many }
  })
}

/**
 * Counts every queue in one round trip's worth of parallel COUNT(*)s.
 *
 * A failing query resolves to zero rather than rejecting. This runs in the
 * admin layout, which wraps every admin page: if one count threw — a table
 * missing because a migration has not been applied on some machine, say — an
 * unhandled rejection here would take down the entire portal rather than
 * losing one badge. Losing a badge is recoverable by opening the page; losing
 * the portal is not.
 */
export async function getAdminBadgeCounts(): Promise<AdminBadgeCounts> {
  const results = await Promise.all(
    QUEUES.map(async (queue) => {
      try {
        return [queue.href, await queue.count()] as const
      } catch {
        return [queue.href, 0] as const
      }
    }),
  )

  const counts: AdminBadgeCounts = {}
  for (const [href, value] of results) {
    // Zero is left out entirely rather than stored, so the nav's check is a
    // plain truthiness test and a badge can never render as "0".
    if (value > 0) counts[href] = value
  }
  return counts
}
