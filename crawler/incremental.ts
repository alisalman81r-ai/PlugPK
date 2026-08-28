// crawler/incremental.ts

/**
 * What a run should look at first, and where it should stop.
 *
 * "Crawl everything every day" is the default a pipeline arrives at by accident
 * and the one it should not keep. A dataset of 1,300 records against a catalogue
 * of 36 cars means the great majority of every run is spent hashing vehicles
 * nobody here sells, and the records that actually matter — a price that moved, a
 * car we have never seen — are somewhere in the middle of the file with no
 * particular reason to be reached before the process is killed.
 *
 * Two mechanisms, both about our own work rather than about requests:
 *
 *   ordering  the records most likely to carry news are processed first;
 *   budget    a run may stop early, and if it does it stops having done the
 *             valuable part.
 *
 * Neither is a substitute for a conditional request. The cheapest run is the one
 * whose source answered 304 and did no work at all — see the ETag handling in
 * sources/openev.ts. This module governs what happens when there *is* a payload.
 */

/** Ranked worst-news-first. Lower sorts earlier. */
export type Priority =
  /** Never seen from this source. Either genuinely new, or changed identity. */
  | 'unseen'
  /** Seen before, and its payload differs from every hash we hold. */
  | 'changed'
  /** Matches a car whose data is older than the source's staleness window. */
  | 'stale'
  /** Byte-identical to something already stored. */
  | 'unchanged'

const ORDER: Record<Priority, number> = {
  unseen: 0,
  changed: 1,
  stale: 2,
  unchanged: 3,
}

export interface Classifiable {
  /** Stable hash of the record's data, volatile provenance already stripped. */
  hash: string
  /** The source's own modification timestamp, when it publishes one. */
  modifiedAt?: Date | null
  /** True when this record's identity has never been stored from this source. */
  everSeen?: boolean
  /** True when the car this record concerns has not been refreshed recently. */
  staleTarget?: boolean
}

export interface Classified<T> {
  item: T
  priority: Priority
  /** Why it landed where it did, for the run log. */
  reason: string
}

export interface PrioritiseInput<T extends Classifiable> {
  items: T[]
  /** Every payload hash this source has ever produced. */
  knownHashes: Set<string>
  /**
   * Cap on items returned, 0 for no cap.
   *
   * Applied after ordering, never before. A budget applied to an unordered list
   * is just truncation, and truncation of a file whose order is the maintainer's
   * business means the same tail is never reached.
   */
  budget?: number
}

export interface PrioritiseResult<T extends Classifiable> {
  /** In the order they should be processed. */
  selected: Classified<T>[]
  /**
   * Dropped by the budget, so a capped run can say what it did not do.
   *
   * Reported rather than silently discarded. A run that covered 200 of 1,300
   * records and printed nothing about the other 1,100 reads as complete
   * coverage, which is the most misleading thing a capped crawl can do.
   */
  deferred: Classified<T>[]
  counts: Record<Priority, number>
}

/**
 * Classifies one record against what is already stored.
 *
 * `unchanged` is decided by the hash alone and nothing else can override it: if
 * the payload is byte-identical to something already held, there is by definition
 * no news in it, whatever its timestamp claims. Sources do move a `updated_at`
 * without changing any data, and believing that over the bytes would undo the
 * whole point of the fingerprint.
 */
export function classifyRecord<T extends Classifiable>(
  item: T,
  knownHashes: Set<string>,
): Classified<T> {
  if (knownHashes.has(item.hash)) {
    return { item, priority: 'unchanged', reason: 'payload identical to one already stored' }
  }

  if (item.everSeen === false) {
    return { item, priority: 'unseen', reason: 'this identity has never been stored' }
  }

  if (item.staleTarget) {
    return { item, priority: 'stale', reason: 'the car it concerns is past its refresh window' }
  }

  return { item, priority: 'changed', reason: 'payload differs from every stored hash' }
}

/**
 * Orders records and applies the budget.
 *
 * A stable sort within each priority band, so a source that publishes its records
 * in a meaningful order keeps it among equals — this reorders bands, not the file.
 */
export function prioritise<T extends Classifiable>(
  input: PrioritiseInput<T>,
): PrioritiseResult<T> {
  const classified = input.items.map((item) => classifyRecord(item, input.knownHashes))

  const counts: Record<Priority, number> = { unseen: 0, changed: 0, stale: 0, unchanged: 0 }
  for (const entry of classified) counts[entry.priority] += 1

  const ordered = classified
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => {
      const band = ORDER[a.entry.priority] - ORDER[b.entry.priority]
      if (band !== 0) return band

      /*
        Within a band, newer source timestamps first — but only when both records
        carry one. A record with no timestamp is not old; it is unknown, and
        sorting it as though it were ancient would push a source that publishes no
        timestamps to the back of its own band forever.
      */
      const left = a.entry.item.modifiedAt?.getTime() ?? null
      const right = b.entry.item.modifiedAt?.getTime() ?? null
      if (left !== null && right !== null && left !== right) return right - left

      return a.index - b.index
    })
    .map(({ entry }) => entry)

  const budget = input.budget ?? 0
  if (budget <= 0 || ordered.length <= budget) {
    return { selected: ordered, deferred: [], counts }
  }

  return {
    selected: ordered.slice(0, budget),
    deferred: ordered.slice(budget),
    counts,
  }
}

/**
 * One line describing what a budget left out.
 *
 * Written here rather than at the call site so every runner says it the same way,
 * and so it cannot be omitted by whoever adds the next one.
 */
export function deferralNote<T extends Classifiable>(result: PrioritiseResult<T>): string | null {
  if (result.deferred.length === 0) return null

  const byPriority = new Map<Priority, number>()
  for (const entry of result.deferred) {
    byPriority.set(entry.priority, (byPriority.get(entry.priority) ?? 0) + 1)
  }

  const parts = [...byPriority.entries()]
    .sort((a, b) => ORDER[a[0]] - ORDER[b[0]])
    .map(([priority, count]) => `${count} ${priority}`)

  return `budget reached — ${result.deferred.length} record(s) deferred to the next run (${parts.join(', ')})`
}
