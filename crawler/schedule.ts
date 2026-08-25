// crawler/schedule.ts

/**
 * Cadences, in one place.
 *
 * The interval a source is crawled at is written down exactly once, here. It was
 * tempting to leave `crawlIntervalMinutes` as the source of truth and let each
 * caller do its own arithmetic, and that is how a system ends up with "daily"
 * meaning 1440 minutes in the runner, 24 hours in the dashboard, and "since
 * midnight" in the scheduler — three definitions that agree until a clock change.
 *
 * A source stores a named cadence. Everything else derives from this table.
 */

export type Cadence = 'daily' | 'every-3-days' | 'weekly' | 'monthly' | 'manual'

export const CADENCES: Record<Cadence, { minutes: number; label: string }> = {
  daily: { minutes: 24 * 60, label: 'Daily' },
  'every-3-days': { minutes: 3 * 24 * 60, label: 'Every 3 days' },
  weekly: { minutes: 7 * 24 * 60, label: 'Weekly' },
  monthly: { minutes: 30 * 24 * 60, label: 'Monthly' },
  /** Never runs on a schedule; only a manual trigger reaches it. */
  manual: { minutes: Number.POSITIVE_INFINITY, label: 'Manual only' },
}

export function isCadence(value: string): value is Cadence {
  return value in CADENCES
}

/** A stored string to a cadence, defaulting safely rather than throwing. */
export function toCadence(value: string | null | undefined): Cadence {
  /*
    An unrecognised value falls back to `manual`, not `daily`.

    If somebody misspells a cadence, the failure should be that a source stops
    being crawled — visible on the dashboard as "never run" — rather than that it
    quietly starts being crawled every day. The conservative default is the one
    that cannot surprise a site owner.
  */
  return value && isCadence(value) ? value : 'manual'
}

export function intervalMinutes(cadence: Cadence): number {
  return CADENCES[cadence].minutes
}

export interface DueInput {
  schedule: string
  isEnabled: boolean
  robotsStatus: string
  lastCrawledAt: Date | null
  consecutiveFailures: number
  /** For tests; defaults to now. */
  now?: Date
}

export interface DueVerdict {
  due: boolean
  /** Why, in words the dashboard can print. */
  reason: string
  /** When it will next be eligible, when it is not due now. */
  nextDueAt?: Date
}

/**
 * Exponential backoff after repeated failure.
 *
 * A source that is down does not become available faster for being asked more
 * often, and a crawler that keeps hammering a failing host is the behaviour that
 * gets an IP blocked. The interval doubles per consecutive failure, capped at
 * eight times the normal cadence — so a daily source that has failed five times
 * is tried every eight days rather than every day, and recovers to daily the
 * moment one attempt succeeds.
 */
export function backoffMultiplier(consecutiveFailures: number): number {
  if (consecutiveFailures <= 0) return 1
  return Math.min(8, 2 ** Math.min(consecutiveFailures, 3))
}

/**
 * Whether a source may run right now.
 *
 * Three gates before the clock is even consulted: enabled, robots-permitted, and
 * on a real schedule. Each returns its own reason, because "not due" and "not
 * allowed" are different problems and a dashboard that conflates them sends an
 * operator looking in the wrong place.
 */
export function isDue(input: DueInput): DueVerdict {
  const now = input.now ?? new Date()

  if (!input.isEnabled) {
    return { due: false, reason: 'the source is switched off' }
  }

  if (input.robotsStatus !== 'allowed') {
    return {
      due: false,
      reason: `robots status is "${input.robotsStatus}" — only "allowed" may be crawled`,
    }
  }

  const cadence = toCadence(input.schedule)
  if (cadence === 'manual') {
    return { due: false, reason: 'set to manual only' }
  }

  if (input.lastCrawledAt === null) {
    return { due: true, reason: 'never crawled' }
  }

  const wait = intervalMinutes(cadence) * backoffMultiplier(input.consecutiveFailures)
  const nextDueAt = new Date(input.lastCrawledAt.getTime() + wait * 60_000)

  if (now >= nextDueAt) {
    const backoff = backoffMultiplier(input.consecutiveFailures)
    return {
      due: true,
      reason:
        backoff > 1
          ? `due — ${CADENCES[cadence].label.toLowerCase()} interval, extended ${backoff}x after ${input.consecutiveFailures} failure(s)`
          : `due — ${CADENCES[cadence].label.toLowerCase()}`,
    }
  }

  return {
    due: false,
    reason: `next due ${nextDueAt.toISOString()}`,
    nextDueAt,
  }
}

export interface StaleInput {
  lastSuccessAt: Date | null
  staleAfterDays: number
  now?: Date
}

/**
 * Whether a source's data should be treated as stale.
 *
 * Measured from the last *success*, never from the last attempt. A source that
 * has been failing every morning for a week has a fresh `lastCrawledAt` and
 * week-old data, and only the success timestamp tells the difference.
 *
 * Staleness never removes anything. It is a label on the source, so the
 * dashboard can say "this figure is a week old" — the alternative, dropping the
 * data, would mean an outage silently emptying the catalogue.
 */
export function isStale(input: StaleInput): { stale: boolean; days: number | null; reason: string } {
  const now = input.now ?? new Date()

  if (input.lastSuccessAt === null) {
    return { stale: true, days: null, reason: 'has never succeeded' }
  }

  const days = Math.floor((now.getTime() - input.lastSuccessAt.getTime()) / 86_400_000)

  return days >= input.staleAfterDays
    ? { stale: true, days, reason: `no successful crawl for ${days} day(s)` }
    : { stale: false, days, reason: `last success ${days} day(s) ago` }
}
