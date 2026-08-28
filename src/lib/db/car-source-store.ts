// src/lib/db/car-source-store.ts
import { createHash, randomUUID } from 'node:crypto'

import { prisma } from './client'

/**
 * The staging layer's data access — the implementation.
 *
 * Deliberately WITHOUT `server-only`, so the crawler can use it. The crawler is
 * a Node script, not a React Server Component, and `server-only` throws the
 * moment such a script imports it — which is correct behaviour for an app module
 * and useless for a CLI one.
 *
 * The guard still exists: car-source-queries.ts re-exports every function here
 * behind `import 'server-only'`, and that is what application code imports. So a
 * component that tried to pull this into a client bundle still fails, while
 * `npm run crawl:source` works, and there is one implementation rather than two
 * that can drift.
 *
 * Everything the crawler stores goes through here, and nothing here writes to
 * `Car`. That is the boundary the whole design rests on: a crawled figure is
 * evidence, not a fact, and the only path from evidence to catalogue runs
 * through a human and the existing validated write path in car-actions.ts.
 *
 * If a function in this file ever calls `prisma.car.update`, the separation has
 * been lost.
 */

/** Allowed values for the string columns, kept here so callers cannot drift. */
export const EXTRACTION_STATUS = ['ok', 'partial', 'failed'] as const
export const REVIEW_STATUS = ['pending', 'approved', 'rejected', 'superseded', 'duplicate'] as const
export const ROBOTS_STATUS = ['unchecked', 'allowed', 'disallowed', 'unreachable'] as const

export type ExtractionStatus = (typeof EXTRACTION_STATUS)[number]
export type ReviewStatus = (typeof REVIEW_STATUS)[number]
export type RobotsStatusValue = (typeof ROBOTS_STATUS)[number]

// ─── Sources ──────────────────────────────────────────────────────────

export interface SourceInput {
  id: string
  name: string
  baseUrl: string
  trustRank?: number
  crawlIntervalMinutes?: number
  requestDelayMs?: number
  isEnabled?: boolean
}

/**
 * Registers a source, or updates its settings.
 *
 * `isEnabled` defaults to false on create and is left alone on update unless
 * explicitly passed. Turning a source on is a decision about somebody else's
 * terms of service, and it should never be a side effect of editing a name.
 */
export async function upsertSource(input: SourceInput) {
  const settings = {
    name: input.name,
    baseUrl: input.baseUrl,
    ...(input.trustRank !== undefined ? { trustRank: input.trustRank } : {}),
    ...(input.crawlIntervalMinutes !== undefined
      ? { crawlIntervalMinutes: input.crawlIntervalMinutes }
      : {}),
    ...(input.requestDelayMs !== undefined ? { requestDelayMs: input.requestDelayMs } : {}),
    ...(input.isEnabled !== undefined ? { isEnabled: input.isEnabled } : {}),
  }

  return prisma.carSource.upsert({
    where: { id: input.id },
    create: { id: input.id, isEnabled: false, ...settings },
    update: settings,
  })
}

export async function listSources() {
  return prisma.carSource.findMany({ orderBy: [{ trustRank: 'desc' }, { name: 'asc' }] })
}

export async function getSource(id: string) {
  return prisma.carSource.findUnique({ where: { id } })
}

/**
 * Records what robots.txt said.
 *
 * Stored rather than only checked, so a refusal can be justified months later
 * and so the crawler can be stopped by policy without re-fetching.
 */
export async function recordRobotsCheck(
  sourceId: string,
  status: RobotsStatusValue,
  note: string | null,
) {
  return prisma.carSource.update({
    where: { id: sourceId },
    data: { robotsStatus: status, robotsCheckedAt: new Date(), robotsNote: note },
  })
}

/**
 * Sources a crawl may actually visit.
 *
 * Two conditions, both required: switched on, and last told by robots.txt that
 * crawling is allowed. A source whose robots status is 'unchecked' is not
 * eligible — the check is a precondition, not a formality.
 */
export async function listCrawlableSources() {
  return prisma.carSource.findMany({
    where: { isEnabled: true, robotsStatus: 'allowed' },
    orderBy: { trustRank: 'desc' },
  })
}

export async function markSourceCrawled(sourceId: string) {
  return prisma.carSource.update({
    where: { id: sourceId },
    data: { lastCrawledAt: new Date() },
  })
}

// ─── Records ──────────────────────────────────────────────────────────

export interface RecordInput {
  sourceId: string
  sourceUrl: string
  externalId?: string | null
  runId: string
  fetchedAt?: Date
  httpStatus?: number | null
  /** Serialised by the caller; this layer does not decide the shape. */
  raw: unknown
  normalised?: unknown
  extractionStatus?: ExtractionStatus
  fieldsFound?: number
  fieldsExpected?: number
  confidence?: number
  matchedCarId?: string | null
  matchStrategy?: string | null
  matchScore?: number | null
  matchCandidates?: unknown
  errorMessage?: string | null
  errorFields?: string[] | null

  /**
   * --- Identity as published, Phase 4.1 ----------------------------
   *
   * Lifted out of the payload into columns so the review queue can show which
   * variant a figure came from without parsing JSON, and so "which variants of
   * this model have we seen?" is a query rather than a scan.
   *
   * The data was always in the payload; nothing read it. openev publishes variant
   * "61.4 kWh RWD Comfort" for the Seal and the matcher compared brand and model
   * only, so five different vehicles became indistinguishable claims about one
   * catalogue row.
   */
  variant?: string | null
  trim?: string | null
  modelYear?: number | null
  generation?: string | null
  /** proven | unproven | ambiguous | mismatch — see crawler/identity.ts. */
  variantVerdict?: string | null
  identityTier?: string | null
}

/**
 * Keys that change on every fetch without the data having changed.
 *
 * `fetchedAt` is the whole list and the whole problem. It is stamped with the
 * current time as each record is built, so hashing the payload verbatim gave a
 * different hash every morning for a byte-identical car — and the change
 * detection this hash exists for reported all 8 of 8 records as changed on a
 * re-run of the same command, minutes apart. Nothing downstream was wrong; the
 * fingerprint simply included the clock.
 */
const VOLATILE_KEYS = new Set(['fetchedAt'])

/**
 * Stable hash of a payload's data, so an unchanged re-crawl is recognisable.
 *
 * Volatile provenance is stripped before hashing. Only the top level is
 * stripped, which is where these fields live — a deep sweep would risk removing
 * a genuine field that happens to share the name.
 */
export function hashPayload(payload: unknown): string {
  const subject =
    payload !== null && typeof payload === 'object' && !Array.isArray(payload)
      ? Object.fromEntries(
          Object.entries(payload as Record<string, unknown>).filter(
            ([key]) => !VOLATILE_KEYS.has(key),
          ),
        )
      : payload

  return createHash('sha256').update(JSON.stringify(subject ?? null)).digest('hex').slice(0, 32)
}

/**
 * Stores one crawled page.
 *
 * Upserts on (sourceId, sourceUrl, runId): a run that visits the same URL twice
 * updates rather than duplicating, while a later run inserts a new row and the
 * history survives. That is why the run id is part of the key.
 *
 * `matchedCarId` is only ever a proposal here. Writing it does not change the
 * car, and nothing downstream may treat it as approval.
 */
export async function storeRecord(input: RecordInput) {
  const raw = JSON.stringify(input.raw ?? null)
  const data = {
    sourceId: input.sourceId,
    sourceUrl: input.sourceUrl,
    externalId: input.externalId ?? null,
    runId: input.runId,
    fetchedAt: input.fetchedAt ?? new Date(),
    httpStatus: input.httpStatus ?? null,
    raw,
    normalised: input.normalised === undefined ? null : JSON.stringify(input.normalised),
    contentHash: hashPayload(input.raw),
    extractionStatus: input.extractionStatus ?? 'ok',
    fieldsFound: input.fieldsFound ?? 0,
    fieldsExpected: input.fieldsExpected ?? 0,
    confidence: input.confidence ?? 0,
    matchedCarId: input.matchedCarId ?? null,
    matchStrategy: input.matchStrategy ?? null,
    matchScore: input.matchScore ?? null,
    matchCandidates:
      input.matchCandidates === undefined ? null : JSON.stringify(input.matchCandidates),
    errorMessage: input.errorMessage ?? null,
    errorFields: input.errorFields ? JSON.stringify(input.errorFields) : null,

    variant: input.variant ?? null,
    trim: input.trim ?? null,
    /*
      From the source or null. Never from the crawl date — a record fetched today
      says nothing about the model year of the car it describes, and an invented
      year is worse than none because the year guard would then compare it.
    */
    modelYear: input.modelYear ?? null,
    generation: input.generation ?? null,
    /*
      Defaults to 'unproven', not null. A record whose identity nobody assessed
      has not had its variant established, and the two must read the same to
      everything downstream.
    */
    variantVerdict: input.variantVerdict ?? 'unproven',
    identityTier: input.identityTier ?? null,
  }

  return prisma.carSourceRecord.upsert({
    where: {
      sourceId_sourceUrl_runId: {
        sourceId: input.sourceId,
        sourceUrl: input.sourceUrl,
        runId: input.runId,
      },
    },
    create: { id: randomUUID(), ...data },
    update: data,
  })
}

export async function getRecord(id: string) {
  return prisma.carSourceRecord.findUnique({ where: { id }, include: { source: true } })
}

export async function listRecordsForRun(runId: string) {
  return prisma.carSourceRecord.findMany({
    where: { runId },
    orderBy: { fetchedAt: 'asc' },
    include: { source: true },
  })
}

/** The review queue: what a person still has to look at, oldest first. */
export async function listPendingReview(limit = 100) {
  return prisma.carSourceRecord.findMany({
    where: { reviewStatus: 'pending' },
    orderBy: [{ confidence: 'desc' }, { fetchedAt: 'asc' }],
    take: limit,
    include: { source: true },
  })
}

/**
 * Every source's view of one car, newest first.
 *
 * This is what makes disagreement visible: two sources quoting different prices
 * both appear, with their trust ranks, instead of one silently overwriting the
 * other.
 */
export async function listRecordsForCar(carId: string, limit = 50) {
  return prisma.carSourceRecord.findMany({
    where: { matchedCarId: carId },
    orderBy: { fetchedAt: 'desc' },
    take: limit,
    include: { source: true },
  })
}

/** Records that matched nothing — candidates for cars the catalogue lacks. */
export async function listUnmatched(limit = 100) {
  return prisma.carSourceRecord.findMany({
    where: { matchedCarId: null, reviewStatus: 'pending' },
    orderBy: { fetchedAt: 'desc' },
    take: limit,
    include: { source: true },
  })
}

/**
 * Records the outcome of a review.
 *
 * Deliberately does not apply anything. Marking a record approved says a person
 * agreed with it; writing it to the catalogue is a separate action, through
 * car-actions.ts, with its own validation and its own admin check. Keeping the
 * two apart means a mis-click here cannot change the public site.
 */
export async function setReviewStatus(id: string, status: ReviewStatus, note?: string | null) {
  return prisma.carSourceRecord.update({
    where: { id },
    data: { reviewStatus: status, reviewedAt: new Date(), reviewNote: note ?? null },
  })
}

/** Attaches or clears a proposed match. Still only a proposal. */
export async function setProposedMatch(
  id: string,
  carId: string | null,
  strategy: string | null,
  score: number | null,
) {
  return prisma.carSourceRecord.update({
    where: { id },
    data: { matchedCarId: carId, matchStrategy: strategy, matchScore: score },
  })
}

/** Whether this exact payload has been seen before, at any time, anywhere. */
export async function hasSeenPayload(sourceId: string, payload: unknown): Promise<boolean> {
  const found = await prisma.carSourceRecord.findFirst({
    where: { sourceId, contentHash: hashPayload(payload) },
    select: { id: true },
  })
  return found !== null
}

/** Counts for a dashboard, without pulling every row to compute them. */
export async function getStagingStats() {
  const [total, pending, matched, unmatched, sources, runs] = await Promise.all([
    prisma.carSourceRecord.count(),
    prisma.carSourceRecord.count({ where: { reviewStatus: 'pending' } }),
    prisma.carSourceRecord.count({ where: { matchedCarId: { not: null } } }),
    prisma.carSourceRecord.count({ where: { matchedCarId: null } }),
    prisma.carSource.count(),
    prisma.carSourceRecord.findMany({ distinct: ['runId'], select: { runId: true } }),
  ])

  return { total, pending, matched, unmatched, sources, runs: runs.length }
}

// ─── Scheduling and health ────────────────────────────────────────────
//
// The decisions live in crawler/schedule.ts and crawler/health.ts, which are
// pure and importable from both the crawler and the app. This file only reads and
// writes rows: keeping the arithmetic out of the data layer is what makes the
// scheduler testable without a database, and what stops "daily" from acquiring a
// second definition in here.

/**
 * Every source, with the fields the scheduler and the dashboard need.
 *
 * Deliberately not filtered by enabled or robots status. A dashboard that only
 * lists crawlable sources cannot show the operator the switched-off one that is
 * the reason a figure is three weeks old. Filtering is the caller's job, and
 * `isDue` gives it the reason.
 */
export async function listSourcesForSchedule() {
  return prisma.carSource.findMany({
    orderBy: [{ trustRank: 'desc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      baseUrl: true,
      trustRank: true,
      isEnabled: true,
      robotsStatus: true,
      robotsCheckedAt: true,
      schedule: true,
      staleAfterDays: true,
      requestDelayMs: true,
      lastCrawledAt: true,
      lastSuccessAt: true,
      lastFailureAt: true,
      lastError: true,
      lastChangedAt: true,
      consecutiveFailures: true,
      avgResponseMs: true,
      lastEtag: true,
      lastModifiedHttp: true,
      lastSeenModified: true,
      recordBudget: true,
    },
  })
}

/**
 * Stores the validators a source returned, so tomorrow's request can be
 * conditional.
 *
 * Separate from updateSourceHealth on purpose. Health is about whether a source
 * is working; a validator is a token we hand back to it. Writing them together
 * would mean every health update had an opinion about the ETag, and the one
 * update that got that opinion wrong — a failure path writing `undefined` over a
 * good validator — is the bug that makes a source answer 304 forever.
 */
export interface ValidatorPatch {
  lastEtag?: string | null
  lastModifiedHttp?: string | null
  lastSeenModified?: Date | null
}

export async function updateSourceValidators(sourceId: string, patch: ValidatorPatch) {
  return prisma.carSource.update({
    where: { id: sourceId },
    data: {
      ...(patch.lastEtag !== undefined ? { lastEtag: patch.lastEtag } : {}),
      ...(patch.lastModifiedHttp !== undefined ? { lastModifiedHttp: patch.lastModifiedHttp } : {}),
      ...(patch.lastSeenModified !== undefined ? { lastSeenModified: patch.lastSeenModified } : {}),
    },
  })
}

/**
 * Clears a source's validators.
 *
 * Called on any failure. A validator kept across a failure is worse than no
 * validator: the source recovers, answers 304 to a token from before whatever
 * went wrong, and the run records a clean success having fetched nothing — a
 * silent outage that looks like a quiet week.
 */
export async function clearSourceValidators(sourceId: string) {
  return prisma.carSource.update({
    where: { id: sourceId },
    data: { lastEtag: null, lastModifiedHttp: null },
  })
}

/**
 * Sets how many records a source may process per run.
 *
 * 0 means no cap. Distinct from `requestDelayMs`, which is about their server;
 * this is about ours — a ceiling on a run's own work, so a dataset growing to
 * ten thousand records cannot turn a morning job into an afternoon one.
 */
export async function setSourceBudget(sourceId: string, recordBudget: number) {
  return prisma.carSource.update({
    where: { id: sourceId },
    data: { recordBudget: Math.max(0, Math.trunc(recordBudget)) },
  })
}

/**
 * Every external identity this source has ever produced.
 *
 * Read alongside the hashes so a record can be told apart from a *changed*
 * record: a payload whose hash is unknown might be a car we have tracked for
 * months whose price moved, or one we have never seen. Those deserve different
 * places in the queue, and only the identity distinguishes them.
 *
 * Falls back to the URL when a source publishes no id of its own, because that
 * is what the staging key already uses as identity.
 */
export async function knownRecordIdentities(sourceId: string): Promise<Set<string>> {
  const rows = await prisma.carSourceRecord.findMany({
    where: { sourceId },
    select: { externalId: true, sourceUrl: true },
  })

  const identities = new Set<string>()
  for (const row of rows) {
    identities.add(row.externalId ?? row.sourceUrl)
  }
  return identities
}

export interface HealthPatch {
  lastSuccessAt?: Date | null
  lastFailureAt?: Date | null
  lastError?: string | null
  consecutiveFailures?: number
  avgResponseMs?: number | null
  lastChangedAt?: Date | null
  lastCrawledAt?: Date | null
}

/**
 * Writes a source's health after a run.
 *
 * Takes the already-computed state rather than an outcome, so the rules about
 * what a partial run means, or whether a blocked run counts as a failure, are
 * decided in one tested place instead of being re-derived here.
 */
export async function updateSourceHealth(sourceId: string, patch: HealthPatch) {
  return prisma.carSource.update({ where: { id: sourceId }, data: patch })
}

/**
 * Changes a source's cadence.
 *
 * Separate from `upsertSource` on purpose. How often we visit somebody else's
 * server is a decision about their bandwidth and their terms, and it should never
 * change as a side effect of a crawl correcting a source's name.
 */
export async function setSourceSchedule(
  sourceId: string,
  schedule: string,
  staleAfterDays?: number,
) {
  return prisma.carSource.update({
    where: { id: sourceId },
    data: {
      schedule,
      ...(staleAfterDays !== undefined ? { staleAfterDays } : {}),
    },
  })
}

// ─── Runs ─────────────────────────────────────────────────────────────

export interface OpenRunInput {
  id: string
  sourceId: string
  /** scheduled | manual */
  trigger: string
}

export async function openRun(input: OpenRunInput) {
  return prisma.crawlRun.create({
    data: { id: input.id, sourceId: input.sourceId, trigger: input.trigger, status: 'running' },
  })
}

export interface CloseRunInput {
  status: 'completed' | 'failed' | 'blocked' | 'partial'
  recordsFound?: number
  recordsStored?: number
  recordsFailed?: number
  recordsChanged?: number
  recordsUnchanged?: number
  recordsPendingReview?: number
  candidatesFound?: number
  durationMs?: number
  notes?: string | null
  errors?: string[] | null
}

export async function closeRun(runId: string, input: CloseRunInput) {
  return prisma.crawlRun.update({
    where: { id: runId },
    data: {
      status: input.status,
      completedAt: new Date(),
      recordsFound: input.recordsFound ?? 0,
      recordsStored: input.recordsStored ?? 0,
      recordsFailed: input.recordsFailed ?? 0,
      recordsChanged: input.recordsChanged ?? 0,
      recordsUnchanged: input.recordsUnchanged ?? 0,
      recordsPendingReview: input.recordsPendingReview ?? 0,
      candidatesFound: input.candidatesFound ?? 0,
      ...(input.durationMs !== undefined ? { durationMs: input.durationMs } : {}),
      notes: input.notes ?? null,
      errors: input.errors && input.errors.length > 0 ? JSON.stringify(input.errors) : null,
    },
  })
}

/**
 * The most recent runs, with each source's display name attached.
 *
 * Two queries rather than a join, because CrawlRun deliberately has no relation
 * to CarSource: a run is a historical fact and must survive the source being
 * renamed, reconfigured or removed. The name is decoration, so it is looked up
 * separately and falls back to the id when the source is gone.
 */
export async function recentRuns(limit = 30) {
  const runs = await prisma.crawlRun.findMany({ orderBy: { startedAt: 'desc' }, take: limit })
  const sources = await prisma.carSource.findMany({ select: { id: true, name: true } })
  const names = new Map(sources.map((source) => [source.id, source.name]))

  return runs.map((run) => ({ ...run, sourceName: names.get(run.sourceId) ?? run.sourceId }))
}

/** A run that is still marked running, so a crashed process can be spotted. */
export async function unfinishedRuns(olderThanMinutes = 120) {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60_000)
  return prisma.crawlRun.findMany({
    where: { status: 'running', startedAt: { lt: cutoff } },
    orderBy: { startedAt: 'asc' },
  })
}

// ─── Candidates ───────────────────────────────────────────────────────

export interface CandidateInput {
  sourceId: string
  runId: string
  recordId: string
  brand: string
  model: string
  variant: string | null
  trim: string | null
  modelYear: number | null
  category: string | null
  normalised: unknown
  possibleDuplicateOf: string | null
  duplicateReason: string | null
  matchScore: number | null
  confidence: number
  sourceUrl: string
  fetchedAt: Date
}

/**
 * Records a car a source described that the catalogue does not have.
 *
 * Upsert, not create. A daily crawl re-seeing the same fifty unmatched cars must
 * refresh fifty rows, not add fifty a day — the alternative is a review queue
 * that is unusable inside a week and an operator who stops opening it.
 *
 * A candidate already reviewed is left alone apart from its raw data: reappearing
 * in tomorrow's crawl is not new information, and resetting a rejection to
 * pending would mean a decision that has to be made again every morning.
 */
export async function upsertCandidate(input: CandidateInput) {
  const payload = {
    runId: input.runId,
    recordId: input.recordId,
    trim: input.trim,
    category: input.category,
    normalised: JSON.stringify(input.normalised),
    possibleDuplicateOf: input.possibleDuplicateOf,
    duplicateReason: input.duplicateReason,
    matchScore: input.matchScore,
    confidence: input.confidence,
    sourceUrl: input.sourceUrl,
    fetchedAt: input.fetchedAt,
  }

  /*
    findFirst then update, rather than prisma.upsert on the unique key.

    The key includes variant and modelYear, both nullable, and in SQL a NULL never
    equals another NULL — so a unique index does not deduplicate rows where those
    are absent, and an upsert on that key would insert a fresh row every morning
    for every candidate whose variant a source does not publish. Matching
    explicitly on null is the only form that treats "no variant" as one identity.

    A single-writer crawler has no race here worth guarding against.
  */
  const existing = await prisma.carCandidate.findFirst({
    where: {
      sourceId: input.sourceId,
      brand: input.brand,
      model: input.model,
      variant: input.variant,
      modelYear: input.modelYear,
    },
    select: { id: true, status: true },
  })

  if (existing) {
    /*
      A candidate that has already been judged keeps its verdict.

      Reappearing in tomorrow's crawl is not new information. Resetting a
      rejection to pending would mean the same decision arriving every morning
      forever, which trains an operator to stop opening the queue — so only the
      underlying data is refreshed, and the status stays where the person put it.
    */
    return prisma.carCandidate.update({ where: { id: existing.id }, data: payload })
  }

  return prisma.carCandidate.create({
    data: {
      id: randomUUID(),
      sourceId: input.sourceId,
      brand: input.brand,
      model: input.model,
      variant: input.variant,
      modelYear: input.modelYear,
      ...payload,
    },
  })
}

export async function listCandidates(status = 'pending', limit = 100) {
  return prisma.carCandidate.findMany({
    where: { status },
    orderBy: [{ confidence: 'desc' }, { createdAt: 'desc' }],
    take: limit,
  })
}

export async function candidateCounts() {
  const rows = await prisma.carCandidate.groupBy({ by: ['status'], _count: { _all: true } })
  const counts: Record<string, number> = { pending: 0, approved: 0, rejected: 0, merged: 0 }
  for (const row of rows) counts[row.status] = row._count._all
  return counts
}

/**
 * Records a decision about a candidate.
 *
 * Note what this does NOT do: it never creates a Car. Approving a candidate marks
 * it as worth adding and nothing more — the car itself is then created through the
 * ordinary admin form, with its slug, its images, its Pakistan pricing and its
 * copy written by a person. A crawler that could create catalogue entries from a
 * name it failed to match is precisely the failure this table exists to prevent.
 */
export async function reviewCandidate(
  id: string,
  status: 'approved' | 'rejected' | 'merged',
  note?: string | null,
  mergedInto?: string | null,
) {
  return prisma.carCandidate.update({
    where: { id },
    data: {
      status,
      reviewedAt: new Date(),
      reviewNote: note ?? null,
      mergedInto: status === 'merged' ? (mergedInto ?? null) : null,
    },
  })
}

// ─── Logs ─────────────────────────────────────────────────────────────

export async function listRunLog(runId: string, limit = 500) {
  return prisma.crawlLogEntry.findMany({
    where: { runId },
    orderBy: { createdAt: 'asc' },
    take: limit,
  })
}

export async function listFailures(sinceHours = 48, limit = 100) {
  const cutoff = new Date(Date.now() - sinceHours * 3_600_000)
  return prisma.crawlLogEntry.findMany({
    where: { status: { in: ['failed', 'blocked'] }, createdAt: { gte: cutoff } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

/**
 * Trims the log.
 *
 * Called with an explicit age by an operator or a maintenance command, never
 * automatically on a crawl — a crawler that quietly deletes its own audit trail
 * as a side effect of running is not auditable.
 */
export async function pruneLog(olderThanDays: number) {
  const cutoff = new Date(Date.now() - olderThanDays * 86_400_000)
  const result = await prisma.crawlLogEntry.deleteMany({ where: { createdAt: { lt: cutoff } } })
  return result.count
}

// ─── Dashboard ────────────────────────────────────────────────────────

/** The numbers the updates dashboard leads with, counted rather than loaded. */
export async function getUpdateStats() {
  const dayAgo = new Date(Date.now() - 86_400_000)
  const weekAgo = new Date(Date.now() - 7 * 86_400_000)

  const [runsToday, runsWeek, failedWeek, pendingProposals, pendingCandidates, cars, records] =
    await Promise.all([
      prisma.crawlRun.count({ where: { startedAt: { gte: dayAgo } } }),
      prisma.crawlRun.count({ where: { startedAt: { gte: weekAgo } } }),
      prisma.crawlRun.count({ where: { startedAt: { gte: weekAgo }, status: 'failed' } }),
      prisma.carFieldChange.count({ where: { status: 'pending' } }),
      prisma.carCandidate.count({ where: { status: 'pending' } }),
      prisma.car.count(),
      prisma.carSourceRecord.count(),
    ])

  const changed = await prisma.crawlRun.aggregate({
    where: { startedAt: { gte: weekAgo } },
    _sum: { recordsChanged: true, recordsUnchanged: true },
  })

  return {
    runsToday,
    runsWeek,
    failedWeek,
    pendingProposals,
    pendingCandidates,
    cars,
    records,
    changedWeek: changed._sum.recordsChanged ?? 0,
    unchangedWeek: changed._sum.recordsUnchanged ?? 0,
  }
}

/**
 * Every payload hash this source has ever produced.
 *
 * Loaded once per run rather than queried per record. The per-record form —
 * hasSeenPayload in a loop — is one query per car, which is 5,000 round trips
 * against a single-writer SQLite file for a catalogue that size, and the cost
 * grows with the very thing the daily run is meant to make cheap.
 *
 * A Set of 32-character hashes for 5,000 records is well under a megabyte.
 */
export async function knownContentHashes(sourceId: string): Promise<Set<string>> {
  const rows = await prisma.carSourceRecord.findMany({
    where: { sourceId },
    select: { contentHash: true },
    distinct: ['contentHash'],
  })
  return new Set(rows.map((row) => row.contentHash))
}

// ─── Today's crawl, and filtering ─────────────────────────────────────
//
// The dashboard asks two different kinds of question, and they need different
// shapes. "What happened today" is a set of counts, and must be counted rather
// than assembled from rows — a page that loads every run of the day to add up its
// records gets slower every day it runs. "Show me X" is a filtered list, and
// every filter belongs in the query: filtering after a `take` means asking for
// one source's runs can return none while it has plenty, which is the bug this
// project already fixed once on the review queue.

/** Local midnight, so "today" means the operator's day and not UTC's. */
function startOfToday(now = new Date()): Date {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  return start
}

export interface TodayStats {
  sourcesChecked: number
  sourcesSuccessful: number
  sourcesFailed: number
  sourcesBlocked: number
  carsScanned: number
  newCarsDiscovered: number
  changedFields: number
  unchangedRecords: number
  conflicts: number
  highConfidenceProposals: number
  reviewRequired: number
  staleSources: number
  /** Runs still marked running, which means a process stopped without closing. */
  unfinished: number
}

/**
 * The figures for today's crawl.
 *
 * Everything is scoped to runs that *started* today rather than completed today.
 * A run that began at 23:58 and finished after midnight belongs to the day it was
 * scheduled for; attributing it to the next day would make one morning look
 * missed and the following one look doubled.
 *
 * Staleness is the exception and is not time-scoped at all: a source that has
 * been failing for three weeks is stale today whether or not anything ran, and
 * that is exactly the fact this panel exists to surface.
 */
export async function getTodayStats(now = new Date()): Promise<TodayStats> {
  const since = startOfToday(now)

  const [runs, candidates, conflicts, highConfidence, reviewRequired, unfinished, sources] =
    await Promise.all([
      prisma.crawlRun.findMany({
        where: { startedAt: { gte: since } },
        select: {
          sourceId: true,
          status: true,
          recordsFound: true,
          recordsChanged: true,
          recordsUnchanged: true,
          candidatesFound: true,
        },
      }),
      prisma.carCandidate.count({ where: { status: 'pending', createdAt: { gte: since } } }),
      prisma.carFieldChange.count({
        where: {
          status: 'pending',
          changeType: { in: ['conflicting', 'source-disagreement'] },
        },
      }),
      /*
        "High-confidence" is a property of the proposal, not a permission.

        Counted so an operator can see how much of the queue is likely to be
        straightforward, and deliberately not wired to anything that applies it.
        There is no threshold in this system above which a change is written
        without a person.
      */
      prisma.carFieldChange.count({ where: { status: 'pending', confidence: { gte: 80 } } }),
      prisma.carFieldChange.count({ where: { status: 'pending' } }),
      prisma.crawlRun.count({
        where: { status: 'running', startedAt: { lt: new Date(now.getTime() - 2 * 3_600_000) } },
      }),
      prisma.carSource.findMany({ select: { lastSuccessAt: true, staleAfterDays: true } }),
    ])

  const staleSources = sources.filter((source) => {
    if (source.lastSuccessAt === null) return true
    const days = Math.floor((now.getTime() - source.lastSuccessAt.getTime()) / 86_400_000)
    return days >= source.staleAfterDays
  }).length

  return {
    /*
      Distinct sources, not runs. A source crawled twice today because somebody
      re-ran it by hand was checked once as far as coverage is concerned, and
      counting runs would make a morning of debugging look like broad coverage.
    */
    sourcesChecked: new Set(runs.map((run) => run.sourceId)).size,
    sourcesSuccessful: new Set(
      runs
        .filter((run) => run.status === 'completed' || run.status === 'partial')
        .map((run) => run.sourceId),
    ).size,
    sourcesFailed: new Set(
      runs.filter((run) => run.status === 'failed').map((run) => run.sourceId),
    ).size,
    sourcesBlocked: new Set(
      runs.filter((run) => run.status === 'blocked').map((run) => run.sourceId),
    ).size,
    carsScanned: runs.reduce((total, run) => total + run.recordsFound, 0),
    newCarsDiscovered: candidates,
    changedFields: runs.reduce((total, run) => total + run.recordsChanged, 0),
    unchangedRecords: runs.reduce((total, run) => total + run.recordsUnchanged, 0),
    conflicts,
    highConfidenceProposals: highConfidence,
    reviewRequired,
    staleSources,
    unfinished,
  }
}

export interface RunFilter {
  sourceId?: string | undefined
  status?: string | undefined
  from?: Date | undefined
  to?: Date | undefined
  limit?: number | undefined
}

function runWhere(filter: RunFilter) {
  const startedAt =
    filter.from || filter.to
      ? {
          ...(filter.from ? { gte: filter.from } : {}),
          ...(filter.to ? { lt: filter.to } : {}),
        }
      : undefined

  return {
    ...(filter.sourceId ? { sourceId: filter.sourceId } : {}),
    ...(filter.status ? { status: filter.status } : {}),
    ...(startedAt ? { startedAt } : {}),
  }
}

/**
 * Runs, filtered in the query.
 *
 * The source name is attached afterwards rather than joined, because CrawlRun
 * deliberately has no relation to CarSource: a run is a historical fact and must
 * survive its source being renamed, reconfigured or removed. The name is
 * decoration, so it falls back to the id when the source is gone.
 */
export async function filterRuns(filter: RunFilter = {}) {
  const runs = await prisma.crawlRun.findMany({
    where: runWhere(filter),
    orderBy: { startedAt: 'desc' },
    take: filter.limit ?? 30,
  })

  const sources = await prisma.carSource.findMany({ select: { id: true, name: true } })
  const names = new Map(sources.map((source) => [source.id, source.name]))

  return runs.map((run) => ({ ...run, sourceName: names.get(run.sourceId) ?? run.sourceId }))
}

/** How many runs match a filter, so the count is not just the page length. */
export async function countRuns(filter: RunFilter = {}): Promise<number> {
  return prisma.crawlRun.count({ where: runWhere(filter) })
}

export interface CandidateFilter {
  status?: string | undefined
  sourceId?: string | undefined
  minConfidence?: number | undefined
  /** Only candidates flagged as possibly already in the catalogue. */
  duplicatesOnly?: boolean | undefined
  limit?: number | undefined
}

/** New-car candidates, filtered in the query for the same reason as runs. */
export async function filterCandidates(filter: CandidateFilter = {}) {
  return prisma.carCandidate.findMany({
    where: {
      status: filter.status ?? 'pending',
      ...(filter.sourceId ? { sourceId: filter.sourceId } : {}),
      ...(filter.minConfidence !== undefined ? { confidence: { gte: filter.minConfidence } } : {}),
      ...(filter.duplicatesOnly ? { possibleDuplicateOf: { not: null } } : {}),
    },
    orderBy: [{ confidence: 'desc' }, { createdAt: 'desc' }],
    take: filter.limit ?? 30,
  })
}

export interface LogFilter {
  sourceId?: string | undefined
  runId?: string | undefined
  status?: string | undefined
  operation?: string | undefined
  sinceHours?: number | undefined
  limit?: number | undefined
}

/**
 * Log lines, filtered.
 *
 * A superset of listFailures, which stays as the default view because "what
 * broke" is asked far more often than anything else. Nothing here can leak a
 * credential: every message was redacted by crawler/logger.ts before it was
 * written, at the single point where logging happens rather than at each caller.
 */
export async function filterLog(filter: LogFilter = {}) {
  const cutoff = new Date(Date.now() - (filter.sinceHours ?? 72) * 3_600_000)

  return prisma.crawlLogEntry.findMany({
    where: {
      createdAt: { gte: cutoff },
      ...(filter.sourceId ? { sourceId: filter.sourceId } : {}),
      ...(filter.runId ? { runId: filter.runId } : {}),
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.operation ? { operation: filter.operation } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: filter.limit ?? 40,
  })
}
