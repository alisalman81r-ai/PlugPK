// src/lib/db/admin-badges.ts
import { cache } from 'react'

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
  /** The queue's name, for the dashboard's list of everything checked. */
  title: string
  /** Singular and plural, so the dashboard never prints "1 items". */
  one: string
  many: string
  count: () => Promise<number>
}

const QUEUES: Queue[] = [
  {
    // A community post is a notification until the admin opens Community.
    href: '/admin/community',
    title: 'Community posts',
    one: 'community post not yet reviewed',
    many: 'community posts not yet reviewed',
    count: () =>
      prisma.communityPost.count({ where: { adminViewedAt: null } }),
  },
  {
    // Applications from the public "list your business" form.
    href: '/admin/businesses',
    title: 'Businesses and photos',
    one: 'business or charger photo item to review',
    many: 'businesses or charger photo items to review',
    count: async () => {
      const [businesses, reports] = await Promise.all([
        prisma.business.count({ where: { status: 'pending' } }),
        prisma.businessPhotoReport.count({ where: { status: 'new' } }),
      ])
      return businesses + reports
    },
  },
  {
    // Meeting requests nobody has opened. 'new' rather than 'pending': that is
    // the default the schema gives a fresh request.
    href: '/admin/meetings',
    title: 'Meeting requests',
    one: 'meeting request unanswered',
    many: 'meeting requests unanswered',
    count: () => prisma.meetingRequest.count({ where: { status: 'new' } }),
  },
  {
    // Businesses applying to be listed in the EV services directory. Same
    // shape as the charger-host queue above: submitted by the public, invisible
    // on the site until a person approves it.
    href: '/admin/services',
    title: 'Service applications',
    one: 'service application to review',
    many: 'service applications to review',
    count: () => prisma.eVService.count({ where: { status: 'pending' } }),
  },
  /*
    The two car queues are gone with the crawler.

    They counted CarFieldChange and CarCandidate rows staged by the crawl, and
    both were cleared on /admin/cars/review and /admin/cars/updates — screens
    that no longer exist. A badge whose page has been deleted is an alert with
    nowhere to go, which is the exact failure this file's own notes describe.

    The tables are still in the schema and still hold their rows; nothing reads
    them now. If a review workflow ever returns, its queue belongs here.
  */
]

export interface PendingQueue {
  href: string
  count: number
  /** Already pluralised against the count. */
  label: string
  /** True when the count could not be read, so 0 must not be shown as "clear". */
  failed?: boolean
}

/**
 * Every count, and which ones could not be read.
 *
 * Wrapped in React's cache() so one request counts once. The layout and the
 * dashboard both ask, and they used to run every COUNT(*) twice per page view.
 */
export interface AdminQueueState {
  counts: AdminBadgeCounts
  /** Hrefs whose count failed. Empty when everything was read. */
  failed: string[]
}

/**
 * Counts every queue in one round trip's worth of parallel COUNT(*)s.
 *
 * A failing query does not reject the whole set. This runs in the admin
 * layout, which wraps every admin page: if one count threw — a table missing
 * because a migration has not been applied on some machine, say — an
 * unhandled rejection here would take down the entire portal rather than
 * losing one badge.
 *
 * It used to resolve a failure to zero, though, and zero is what "all clear"
 * looks like: a broken database read as a quiet day. Failures are now reported
 * by href, and the sidebar and dashboard say the count is unavailable.
 */
export const getAdminQueueState = cache(async (): Promise<AdminQueueState> => {
  const results = await Promise.all(
    QUEUES.map(async (queue) => {
      try {
        return { href: queue.href, value: await queue.count(), failed: false }
      } catch (error) {
        console.error('[admin-badges] could not count', queue.href, error)
        return { href: queue.href, value: 0, failed: true }
      }
    }),
  )

  const counts: AdminBadgeCounts = {}
  const failed: string[] = []
  for (const result of results) {
    if (result.failed) failed.push(result.href)
    // Zero is left out entirely rather than stored, so the nav's check is a
    // plain truthiness test and a badge can never render as "0".
    else if (result.value > 0) counts[result.href] = result.value
  }
  return { counts, failed }
})

/**
 * The same queues the badges count, described in words for the dashboard.
 *
 * Shares one source with the badges deliberately: a dashboard that said
 * "nothing waiting" while a sidebar badge showed 5 would make both
 * untrustworthy, and two separate lists is how that happens.
 *
 * Every queue, including the empty ones, so an admin can see at a glance that
 * each one was checked and is clear — or that it could not be checked.
 */
export async function listAllQueues(): Promise<(PendingQueue & { title: string })[]> {
  const { counts, failed } = await getAdminQueueState()
  return QUEUES.map((queue) => {
    const count = counts[queue.href] ?? 0
    return {
      href: queue.href,
      title: queue.title,
      count,
      label: count === 1 ? queue.one : queue.many,
      failed: failed.includes(queue.href),
    }
  })
}

export async function listPendingQueues(): Promise<PendingQueue[]> {
  const { counts } = await getAdminQueueState()

  return QUEUES.filter((queue) => (counts[queue.href] ?? 0) > 0).map((queue) => {
    const count = counts[queue.href] as number
    return { href: queue.href, count, label: count === 1 ? queue.one : queue.many }
  })
}

/** The counts alone, for callers that only draw badges. */
export async function getAdminBadgeCounts(): Promise<AdminBadgeCounts> {
  return (await getAdminQueueState()).counts
}
