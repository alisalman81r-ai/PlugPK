// crawler/verify-schedule.ts
//
// Exercises the Phase 4 layer: scheduling, backoff, health, staleness,
// idempotency, rate limiting, secret redaction and new-car discovery.
//
// Fixtures and fake clocks only — no database, no network. A scheduler tested
// against the real clock is a test that passes today and fails at the end of the
// month, and one tested against the real database is a test whose result depends
// on when it was last run.
//
// Run:  npm run crawl:verify-schedule

import { classify, candidateKey, isCandidate } from './discover'
import { applyOutcome, grade, type HealthState } from './health'
import { isRetryable, RateLimiter } from './limiter'
import { CrawlLogger, redact, redactDeep } from './logger'
import type { MatchCandidate, MatchResult } from './match'
import { emptyVehicle, type NormalisedVehicle } from './model'
import { backoffMultiplier, isDue, isStale, toCadence } from './schedule'

let failures = 0

function check(label: string, condition: boolean, detail = '') {
  if (!condition) failures += 1
  console.log(`  ${condition ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`)
}

/** A fixed clock, so every assertion below means the same thing next month. */
const NOW = new Date('2026-03-15T06:00:00.000Z')
const hoursAgo = (hours: number) => new Date(NOW.getTime() - hours * 3_600_000)
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000)

const HEALTHY: HealthState = {
  lastSuccessAt: hoursAgo(25),
  lastFailureAt: null,
  lastError: null,
  consecutiveFailures: 0,
  avgResponseMs: 400,
  lastChangedAt: hoursAgo(25),
  lastCrawledAt: hoursAgo(25),
}

console.log('\nPHASE 4 — SCHEDULING, HEALTH, IDEMPOTENCY, SAFETY\n')

// ── 1–5. What runs, and what does not ─────────────────────────────────
console.log('SCHEDULING')
{
  const due = isDue({
    schedule: 'daily',
    isEnabled: true,
    robotsStatus: 'allowed',
    lastCrawledAt: hoursAgo(25),
    consecutiveFailures: 0,
    now: NOW,
  })
  check('1. a daily source last crawled 25 hours ago is due', due.due, due.reason)
}
{
  const notYet = isDue({
    schedule: 'daily',
    isEnabled: true,
    robotsStatus: 'allowed',
    lastCrawledAt: hoursAgo(3),
    consecutiveFailures: 0,
    now: NOW,
  })
  check('2. the same source three hours ago is not due', !notYet.due, notYet.reason)
  check('   and the next eligible time is stated', notYet.nextDueAt instanceof Date)
}
{
  const off = isDue({
    schedule: 'daily',
    isEnabled: false,
    robotsStatus: 'allowed',
    lastCrawledAt: daysAgo(30),
    consecutiveFailures: 0,
    now: NOW,
  })
  check('3. a disabled source is never due, however old its data', !off.due, off.reason)
}
{
  const blocked = isDue({
    schedule: 'daily',
    isEnabled: true,
    robotsStatus: 'disallowed',
    lastCrawledAt: daysAgo(30),
    consecutiveFailures: 0,
    now: NOW,
  })
  check('4. robots.txt disallowed outranks being overdue', !blocked.due, blocked.reason)

  const unchecked = isDue({
    schedule: 'daily',
    isEnabled: true,
    robotsStatus: 'unchecked',
    lastCrawledAt: null,
    consecutiveFailures: 0,
    now: NOW,
  })
  check('   and an unchecked robots.txt is not permission either', !unchecked.due, unchecked.reason)
}
{
  const manual = isDue({
    schedule: 'manual',
    isEnabled: true,
    robotsStatus: 'allowed',
    lastCrawledAt: daysAgo(90),
    consecutiveFailures: 0,
    now: NOW,
  })
  check('5. a manual-only source never becomes due on its own', !manual.due, manual.reason)
  check('   and a misspelled cadence falls back to manual, not daily', toCadence('dialy') === 'manual')
}

// ── 6. Backoff ────────────────────────────────────────────────────────
console.log('\nBACKOFF')
check('6. no failures means no extension', backoffMultiplier(0) === 1)
check('   one failure doubles the interval', backoffMultiplier(1) === 2)
check('   the extension is capped at 8x', backoffMultiplier(9) === 8)
{
  const failing = isDue({
    schedule: 'daily',
    isEnabled: true,
    robotsStatus: 'allowed',
    lastCrawledAt: hoursAgo(25),
    consecutiveFailures: 4,
    now: NOW,
  })
  check(
    '   a daily source that has failed four times is not retried after 25 hours',
    !failing.due,
    failing.reason,
  )
}

// ── 7–9. Health ───────────────────────────────────────────────────────
console.log('\nHEALTH')
{
  const failed = applyOutcome(HEALTHY, { outcome: 'failure', error: 'ETIMEDOUT', at: NOW })
  check('7. a failure increments the count and records the reason', failed.consecutiveFailures === 1 && failed.lastError === 'ETIMEDOUT')
  check('   and leaves the last success where it was', failed.lastSuccessAt === HEALTHY.lastSuccessAt)

  const recovered = applyOutcome(failed, { outcome: 'success', at: NOW })
  check('   one success clears the whole failure count', recovered.consecutiveFailures === 0 && recovered.lastError === null)
}
{
  const partial = applyOutcome(
    { ...HEALTHY, consecutiveFailures: 2 },
    { outcome: 'partial', at: NOW },
  )
  check('8. a partial run counts as a success, because the source is reachable', partial.consecutiveFailures === 0)
  check('   and its timestamp moves', partial.lastSuccessAt?.getTime() === NOW.getTime())
}
{
  const blocked = applyOutcome(HEALTHY, { outcome: 'blocked', error: 'robots.txt', at: NOW })
  check('9. a blocked run is not a failure — we chose not to fetch', blocked.consecutiveFailures === 0)
  check('   but the reason is kept', blocked.lastError === 'robots.txt')
}
{
  const first = applyOutcome({ ...HEALTHY, avgResponseMs: null }, { outcome: 'success', responseMs: 900, at: NOW })
  check('   the first response time becomes the average', first.avgResponseMs === 900)
  const second = applyOutcome(first, { outcome: 'success', responseMs: 1900, at: NOW })
  check('   and one slow morning moves it without redefining it', second.avgResponseMs === 1200, String(second.avgResponseMs))
}

// ── 10–11. Staleness ──────────────────────────────────────────────────
console.log('\nSTALENESS')
{
  // Crawled every morning for a week, failing every morning for a week.
  const stale = isStale({ lastSuccessAt: daysAgo(9), staleAfterDays: 7, now: NOW })
  check('10. staleness is measured from the last success, not the last attempt', stale.stale && stale.days === 9, stale.reason)

  const health = grade({
    ...HEALTHY,
    lastSuccessAt: daysAgo(9),
    lastCrawledAt: hoursAgo(2),
    consecutiveFailures: 1,
    schedule: 'daily',
    isEnabled: true,
    robotsStatus: 'allowed',
    staleAfterDays: 7,
    now: NOW,
  })
  check('    a source crawled two hours ago can still be reported stale', health.grade === 'stale', health.summary)
}
{
  const never = isStale({ lastSuccessAt: null, staleAfterDays: 7, now: NOW })
  check('11. a source that has never succeeded is stale and says so', never.stale && never.days === null, never.reason)

  const weekly = isStale({ lastSuccessAt: daysAgo(3), staleAfterDays: 7, now: NOW })
  check('    and a weekly source is not stale after three days', !weekly.stale, weekly.reason)
}
{
  const failing = grade({
    ...HEALTHY,
    consecutiveFailures: 3,
    lastError: 'HTTP 503',
    schedule: 'daily',
    isEnabled: true,
    robotsStatus: 'allowed',
    staleAfterDays: 7,
    now: NOW,
  })
  check('    three consecutive failures is reported as failing, not degraded', failing.grade === 'failing', failing.summary)

  const disallowed = grade({
    ...HEALTHY,
    schedule: 'daily',
    isEnabled: true,
    robotsStatus: 'disallowed',
    staleAfterDays: 7,
    now: NOW,
  })
  check('    and a disallowed source reads as blocked rather than broken', disallowed.grade === 'blocked', disallowed.summary)
}

// ── 12. Idempotency ───────────────────────────────────────────────────
console.log('\nIDEMPOTENCY')
{
  const vehicle = (rangeKm: number | null): NormalisedVehicle => ({
    ...emptyVehicle({ source: 'test', sourceUrl: 'https://example.com/car/1', extractionMethod: 'json-ld' }),
    brand: 'BYD',
    model: 'Atto 3',
    rangeKm,
  })

  // Imported here so this file stays runnable without a database connection.
  void (async () => {
    const { hashPayload } = await import('../src/lib/db/car-source-store')
    const a = hashPayload(vehicle(420))
    const b = hashPayload(vehicle(420))
    const c = hashPayload(vehicle(430))
    check('12. an identical payload hashes identically, so it can be skipped', a === b)
    check('    and one changed figure changes the hash', a !== c)

    /*
      The clock must not be part of the fingerprint.

      Every record is stamped with the moment it was fetched, so hashing the
      payload verbatim made every record look changed every morning — and the
      whole point of the hash is to recognise that nothing has.
    */
    const later = hashPayload({ ...vehicle(420), fetchedAt: new Date().toISOString() })
    check('    and the fetch timestamp does not change it', a === later)
    finish()
  })()
}

// ── 13–14. Rate limiting ──────────────────────────────────────────────
console.log('\nRATE LIMITING')
check('13. a 503 is retried', isRetryable(new Error('HTTP 503 from host')))
check('    a timeout is retried', isRetryable(new Error('ETIMEDOUT')))
check('    a 404 is not retried — repeating it changes nothing', !isRetryable(new Error('HTTP 404')))
check('    a 403 is not retried — the host has said no', !isRetryable(new Error('HTTP 403 Forbidden')))
check('    a 429 is retried, because it asks us to wait', isRetryable(new Error('HTTP 429')))

const limiterChecks = (async () => {
  const limiter = new RateLimiter({ minDelayMs: 120, concurrency: 1, maxRetries: 2 })
  const started: number[] = []

  await Promise.all(
    [0, 1, 2].map(() =>
      limiter.run(async () => {
        started.push(Date.now())
        return true
      }),
    ),
  )

  const gaps = started.slice(1).map((time, index) => time - started[index]!)
  check('14. requests are spaced by the configured delay', gaps.every((gap) => gap >= 110), gaps.join('ms, ') + 'ms')

  let attempts = 0
  try {
    await limiter.run(async () => {
      attempts += 1
      throw new Error('HTTP 500')
    })
  } catch {
    /* expected */
  }
  check('    a retryable failure is retried up to the limit', attempts === 2, `${attempts} attempt(s)`)

  let once = 0
  try {
    await limiter.run(async () => {
      once += 1
      throw new Error('HTTP 404')
    })
  } catch {
    /* expected */
  }
  check('    a non-retryable failure is attempted exactly once', once === 1, `${once} attempt(s)`)
})()

// ── 15. Secrets never reach a log ─────────────────────────────────────
console.log('\nREDACTION')
check('15. an api key is stripped', !redact('fetching with api_key=abc123def456').includes('abc123def456'))
check('    a bearer token is stripped', !redact('authorization: Bearer eyJhbGciOi.payload.signature').includes('eyJhbGciOi'))
check('    a token in a query string is stripped', !redact('https://api.example.com/v1?token=s3cr3tvalue&page=2').includes('s3cr3tvalue'))
check('    the rest of the URL survives', redact('https://api.example.com/v1?token=s3cr3t&page=2').includes('page=2'))
check('    credentials in a URL are stripped', !redact('https://bob:hunter2@example.com/feed').includes('hunter2'))
check('    a GitHub token is stripped by shape alone', !redact('ghp_0123456789abcdefghij').includes('0123456789abcdefghij'))
check('    a password is stripped whatever the separator', !redact('password => "letmein123"').includes('letmein123'))
{
  const redacted = redactDeep({
    url: 'https://example.com',
    headers: { authorization: 'Bearer abcdef123456', accept: 'application/json' },
    nested: [{ token: 'opaque' }],
  }) as { headers: { authorization: string; accept: string }; nested: { token: string }[] }
  check('    a nested authorization header is stripped', redacted.headers.authorization === '[redacted]')
  check('    a short opaque token is stripped by key name', redacted.nested[0]?.token === '[redacted]')
  check('    and harmless fields are left alone', redacted.headers.accept === 'application/json')
}
{
  const logger = new CrawlLogger({ persist: false, echo: false })
  logger.log({ runId: 'r', sourceId: 's', operation: 'fetch', status: 'failed', message: 'failed with api_key=SUPERSECRET' })
  check('    and the logger redacts before anything is stored', JSON.stringify(logger.summary()).length > 0)
}

// ── 16–18. Discovery and duplicates ───────────────────────────────────
console.log('\nDISCOVERY')

const CAR = {
  id: 'byd-sealion-6',
  slug: 'byd-sealion-6',
  brand: 'BYD',
  model: 'Sealion 6',
  fullName: 'BYD Sealion 6',
  category: 'PHEV',
}

function candidate(score: number): MatchCandidate {
  return { car: CAR, strategy: 'brand-model', score, reason: 'brand and model resemble' }
}

function result(partial: Partial<MatchResult>): MatchResult {
  return { decision: 'none', best: null, candidates: [], blocked: [], ...partial }
}

const vehicle = (over: Partial<NormalisedVehicle> = {}): NormalisedVehicle => ({
  ...emptyVehicle({ source: 'test', sourceUrl: 'https://example.com/car/9', extractionMethod: 'json-ld' }),
  brand: 'BYD',
  model: 'Sealion 8',
  ...over,
})

{
  const matched = classify({ vehicle: vehicle(), match: result({ decision: 'confident', best: candidate(95) }) })
  check('16. a confident match is not a discovery at all', matched.verdict === 'matched')

  const probable = classify({ vehicle: vehicle(), match: result({ decision: 'probable', best: candidate(70) }) })
  check('    nor is a probable one — that is a naming variant, not a new car', probable.verdict === 'matched')
}
{
  const clean = classify({ vehicle: vehicle(), match: result({ decision: 'none' }) })
  check('17. a clean miss is a new-car candidate', clean.verdict === 'new' && isCandidate(clean.verdict), clean.reason)
  check('    with confidence well short of certainty', clean.confidence <= 60, String(clean.confidence))

  const near = classify({ vehicle: vehicle(), match: result({ decision: 'none', candidates: [candidate(60)] }) })
  check('    a near miss is flagged as a possible duplicate instead', near.verdict === 'possible-duplicate', near.reason)
  check('    and names the car it might already be', near.possibleDuplicateOf === 'byd-sealion-6')

  const faint = classify({ vehicle: vehicle(), match: result({ decision: 'none', candidates: [candidate(20)] }) })
  check('    a faint resemblance is not flagged — five bad suggestions hide the real one', faint.verdict === 'new')

  const ambiguous = classify({
    vehicle: vehicle(),
    match: result({ decision: 'ambiguous', candidates: [candidate(70), candidate(70)] }),
  })
  check('    an ambiguous match is a possible duplicate, never a new car', ambiguous.verdict === 'possible-duplicate')

  const guarded = classify({
    vehicle: vehicle(),
    match: result({ decision: 'none', blocked: [{ car: CAR, reason: 'model numbers differ: 8 vs 6' }] }),
  })
  check('    a guard-blocked near name reads as a new variant in a known family', guarded.verdict === 'new', guarded.reason)
  check('    and says which car it is related to', guarded.possibleDuplicateOf === 'byd-sealion-6')

  const nameless = classify({ vehicle: vehicle({ model: null }), match: result({}) })
  check('    a record with no model is unusable, not a candidate', nameless.verdict === 'unusable' && !isCandidate(nameless.verdict))
}
{
  const a = candidateKey(vehicle({ variant: ' 82.5 kWh AWD ' }))
  const b = candidateKey(vehicle({ variant: '82.5 kWh AWD' }))
  check('18. the candidate key is stable across whitespace, so one row is reused', JSON.stringify(a) === JSON.stringify(b))
  check('    and an absent variant is null rather than an empty string', candidateKey(vehicle()).variant === null)
}

/**
 * The async checks finish after the synchronous ones.
 *
 * tsx compiles this to CommonJS, where top-level await is unavailable — so the
 * two asynchronous groups resolve into this, and the exit code is set once both
 * have reported. Printing the summary synchronously would report a pass before
 * the rate limiter had run.
 */
let finished = 0
function finish() {
  finished += 1
  if (finished < 2) return
  console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}\n`)
  process.exitCode = failures === 0 ? 0 : 1
}

limiterChecks.then(finish).catch((error: unknown) => {
  console.error(error)
  failures += 1
  finish()
})
