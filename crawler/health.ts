// crawler/health.ts

import { backoffMultiplier, isStale, toCadence, CADENCES } from './schedule'

/**
 * What a source's health becomes after a run, computed as a pure function.
 *
 * Separated from the write so it can be tested without a database. The
 * interesting cases here are all about ordering and arithmetic — does a success
 * clear the failure count, does a partial run count as a success, what does the
 * average response time do when the first measurement arrives — and none of them
 * need Prisma to be wrong in an interesting way.
 */

export interface HealthState {
  lastSuccessAt: Date | null
  lastFailureAt: Date | null
  lastError: string | null
  consecutiveFailures: number
  avgResponseMs: number | null
  lastChangedAt: Date | null
  lastCrawledAt: Date | null
}

export type RunOutcome = 'success' | 'partial' | 'failure' | 'blocked'

export interface OutcomeInput {
  outcome: RunOutcome
  /** Wall time of the run's requests, when it made any. */
  responseMs?: number | null
  /** True when this run produced at least one value that differed from before. */
  changed?: boolean
  /** Already redacted by the logger before it reaches here. */
  error?: string | null
  at: Date
}

/**
 * The weight given to the newest measurement in the rolling mean.
 *
 * An exponential mean rather than a stored history: the question this answers is
 * "is this source getting slower", and for that a decaying average over the last
 * handful of runs is both enough and cheap. 0.3 makes roughly the last ten runs
 * matter, so one slow morning moves it without redefining it.
 */
const RESPONSE_SMOOTHING = 0.3

export function applyOutcome(current: HealthState, input: OutcomeInput): HealthState {
  const next: HealthState = { ...current, lastCrawledAt: input.at }

  if (input.responseMs != null && Number.isFinite(input.responseMs)) {
    next.avgResponseMs =
      current.avgResponseMs === null
        ? Math.round(input.responseMs)
        : Math.round(
            current.avgResponseMs * (1 - RESPONSE_SMOOTHING) + input.responseMs * RESPONSE_SMOOTHING,
          )
  }

  if (input.changed) next.lastChangedAt = input.at

  switch (input.outcome) {
    /*
      A partial run counts as a success.

      Four of five records arriving means the source is up and reachable; calling
      that a failure would put a working source into backoff and eventually mark
      its data stale, which is the opposite of what the operator needs to see.
      The missing record is a record-level problem, and the log has it.
    */
    case 'success':
    case 'partial':
      next.lastSuccessAt = input.at
      next.consecutiveFailures = 0
      next.lastError = null
      break

    case 'failure':
      next.lastFailureAt = input.at
      next.consecutiveFailures = current.consecutiveFailures + 1
      next.lastError = input.error ?? 'unknown failure'
      break

    /*
      Blocked is not a failure.

      A source that robots.txt disallows has not broken — we have correctly
      declined to fetch it. Counting that as a failure would grow a backoff
      against a decision we made ourselves, and would eventually report the
      source as unhealthy when the only thing wrong is that we are not allowed to
      read it. It is recorded, and the reason is kept.
    */
    case 'blocked':
      next.lastError = input.error ?? 'access not permitted'
      break
  }

  return next
}

export type HealthGrade = 'healthy' | 'degraded' | 'failing' | 'stale' | 'blocked' | 'never-run'

export interface HealthReport {
  grade: HealthGrade
  /** One line, safe to print on the dashboard. */
  summary: string
  /** Longer detail, when there is any. */
  detail: string | null
  staleDays: number | null
  /** How much the failure count is currently stretching the interval. */
  backoff: number
}

export interface GradeInput extends HealthState {
  schedule: string
  isEnabled: boolean
  robotsStatus: string
  staleAfterDays: number
  now?: Date
}

/**
 * Grades a source for the dashboard.
 *
 * Worst-first, because an operator scanning a list needs the one line that tells
 * them where to look. A source that is both slow and stale is stale: the older
 * problem is the one that is affecting the catalogue.
 */
export function grade(input: GradeInput): HealthReport {
  const now = input.now ?? new Date()
  const backoff = backoffMultiplier(input.consecutiveFailures)
  const stale = isStale({
    lastSuccessAt: input.lastSuccessAt,
    staleAfterDays: input.staleAfterDays,
    now,
  })

  if (input.robotsStatus === 'disallowed' || input.robotsStatus === 'unreachable') {
    return {
      grade: 'blocked',
      summary:
        input.robotsStatus === 'disallowed'
          ? 'not permitted by robots.txt'
          : 'robots.txt could not be read, so crawling is refused',
      detail: input.lastError,
      staleDays: stale.days,
      backoff,
    }
  }

  if (input.lastCrawledAt === null) {
    return {
      grade: 'never-run',
      summary: 'never crawled',
      detail: input.isEnabled ? null : 'the source is switched off',
      staleDays: null,
      backoff,
    }
  }

  /*
    Three consecutive failures is the line.

    One failure is a network; two is bad luck; three in a row on a daily schedule
    means three days without an update and something that needs a person. Below
    that, "degraded" says the same thing quietly rather than crying wolf every
    time a request times out.
  */
  if (input.consecutiveFailures >= 3) {
    return {
      grade: 'failing',
      summary: `${input.consecutiveFailures} consecutive failures`,
      detail: input.lastError,
      staleDays: stale.days,
      backoff,
    }
  }

  if (stale.stale) {
    return {
      grade: 'stale',
      summary: stale.reason,
      detail:
        toCadence(input.schedule) === 'manual'
          ? 'set to manual only, so nothing will refresh it on a schedule'
          : `expected every ${CADENCES[toCadence(input.schedule)].label.toLowerCase()}`,
      staleDays: stale.days,
      backoff,
    }
  }

  if (input.consecutiveFailures > 0) {
    return {
      grade: 'degraded',
      summary: `${input.consecutiveFailures} failure(s) since the last success`,
      detail: input.lastError,
      staleDays: stale.days,
      backoff,
    }
  }

  return {
    grade: 'healthy',
    summary: stale.reason,
    detail: input.avgResponseMs === null ? null : `${input.avgResponseMs}ms average response`,
    staleDays: stale.days,
    backoff,
  }
}
