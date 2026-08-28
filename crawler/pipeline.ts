// crawler/pipeline.ts

/**
 * The daily run itself, with its dependencies handed in.
 *
 * ── Why this is not simply inside daily.ts ────────────────────────────
 *
 * It was. daily.ts is a script: it calls main() at module scope, imports the
 * Prisma client, and reaches the network. That is the right shape for a command
 * and the wrong shape for the only part of this system that is meant to run
 * unattended — because none of the nineteen things that have to be true about a
 * scheduled crawl could be tested. "A failed source does not modify Car" was an
 * assertion in a comment. "A partial failure still closes its run" was a code
 * path nobody had executed. The tests that existed covered the pure functions
 * around this loop, which is to say they covered everything except the loop.
 *
 * So the orchestration lives here, behind interfaces, and both the command and
 * the HTTP trigger drive the same code. crawler/verify-daily.ts drives it with a
 * fake store, a fake adapter and a fixed clock, and can therefore make a source
 * fail, half-fail, answer 304, throw inside the database, or vanish mid-run.
 *
 * ── What this module cannot do, by construction ───────────────────────
 *
 *   * write to Car — PipelineStore below has no method that could
 *   * delete anything, ever, including cars a source has stopped listing
 *   * fetch a source whose access check did not return allowed
 *   * let one source's failure stop the others, or empty the catalogue
 */

import { classify, isCandidate, candidateKey } from './discover'
import { applyOutcome, grade, type HealthReport, type HealthState, type RunOutcome } from './health'
import { assessIdentity, identityFromCar, identityFromSource } from './identity'
import { deferralNote, prioritise, type Classifiable, type Priority } from './incremental'
import { match, type MatchCandidateCar, type MatchResult } from './match'
import { toMatchInput } from './match-input'
import { coverage, type NormalisedVehicle } from './model'
import { isDue, toCadence, CADENCES, type DueVerdict } from './schedule'
import type { FetchOptions, FetchOutcome, SourceAdapter } from './sources/types'

// ─── What the pipeline needs from the world ───────────────────────────

/** A source row, narrowed to the columns this loop reads. */
export interface SourceRow extends HealthState {
  id: string
  name: string
  schedule: string
  isEnabled: boolean
  robotsStatus: string
  staleAfterDays: number
  requestDelayMs: number | null
  lastEtag: string | null
  lastModifiedHttp: string | null
  lastSeenModified: Date | null
  recordBudget: number
}

export interface StoreRecordInput {
  sourceId: string
  sourceUrl: string
  externalId: string | null
  runId: string
  fetchedAt: Date
  httpStatus: number | null
  raw: unknown
  normalised: unknown
  extractionStatus: 'ok' | 'partial' | 'failed'
  fieldsFound: number
  fieldsExpected: number
  confidence: number
  matchedCarId: string | null
  matchStrategy: string | null
  matchScore: number | null
  matchCandidates: unknown
  /** Identity as published, and what it proved. Phase 4.1. */
  variant: string | null
  trim: string | null
  modelYear: number | null
  generation: string | null
  variantVerdict: string | null
  identityTier: string | null
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

/**
 * The data access this loop is permitted.
 *
 * Deliberately the whole surface: if a method is not here, the pipeline cannot do
 * it. There is no `updateCar`, no `deleteRecord` and no raw query, so the central
 * guarantee of this design — that crawled data never reaches Car except through a
 * person — is enforced by the type rather than by review.
 */
export interface PipelineStore {
  recordRobotsCheck(sourceId: string, status: string, note: string | null): Promise<unknown>
  openRun(input: { id: string; sourceId: string; trigger: string }): Promise<unknown>
  closeRun(runId: string, input: CloseRunInput): Promise<unknown>
  updateSourceHealth(sourceId: string, patch: Partial<HealthState>): Promise<unknown>
  updateSourceValidators(
    sourceId: string,
    patch: {
      lastEtag?: string | null
      lastModifiedHttp?: string | null
      lastSeenModified?: Date | null
    },
  ): Promise<unknown>
  clearSourceValidators(sourceId: string): Promise<unknown>
  knownContentHashes(sourceId: string): Promise<Set<string>>
  knownRecordIdentities(sourceId: string): Promise<Set<string>>
  storeRecord(input: StoreRecordInput): Promise<{ id: string }>
  upsertCandidate(input: Record<string, unknown>): Promise<unknown>
  hashPayload(payload: unknown): string
}

/** A car, as the proposal path needs it. */
export type ProposalCar = { id: string; slug: string; fullName: string; category: string } & Record<
  string,
  unknown
>

export interface ProposalRecord {
  id: string
  sourceId: string
  runId: string
  sourceUrl: string
  fetchedAt: Date
  confidence: number
  raw: string
  normalised: string | null
  matchedCarId: string | null
  matchStrategy: string | null
  matchScore: number | null
  matchCandidates: string | null
  matchedCar: ProposalCar | null
}

/** The catalogue side, read-only by design. */
export interface PipelineCatalogue {
  cars(): Promise<MatchCandidateCar[]>
  /** Staging rows for the records that changed, with their matched car attached. */
  recordsForProposal(recordIds: string[]): Promise<ProposalRecord[]>
  countCars(): Promise<number>
}

export interface ProposeTotals {
  proposed: number
  unchanged: number
  prices: number
  images: number
  highRisk: number
}

/** A line for the run log. Redaction happens inside the implementation. */
export interface PipelineLog {
  runId: string
  sourceId: string
  carId?: string | null
  operation: 'fetch' | 'normalise' | 'match' | 'compare' | 'propose' | 'discover' | 'skip' | 'error'
  status: 'ok' | 'unchanged' | 'changed' | 'failed' | 'blocked' | 'skipped'
  message?: string | undefined
  durationMs?: number | undefined
}

export interface PipelineLogger {
  log(line: PipelineLog): void
  error(base: Omit<PipelineLog, 'status' | 'message'>, error: unknown): void
  flush(): Promise<number>
}

/** Runs one task with retries and spacing. RateLimiter satisfies this. */
export interface PipelineLimiter {
  run<T>(task: (signal: AbortSignal) => Promise<T>): Promise<{ value: T; totalMs: number }>
}

export interface PipelineDeps {
  store: PipelineStore
  catalogue: PipelineCatalogue
  sources: SourceRow[]
  adapters: Record<string, SourceAdapter>
  /** Turns changed records into proposals. Injected so tests need no Prisma. */
  propose(
    car: ProposalCar,
    records: ProposalRecord[],
    options: { runId: string; logger?: PipelineLogger | undefined },
  ): Promise<ProposeTotals>
  logger(options: { persist: boolean }): PipelineLogger
  limiter(sourceId: string, options: { minDelayMs: number; concurrency: number }): PipelineLimiter
  /** Injected so every timestamp in a test means the same thing next month. */
  now(): Date
  /** Injected so a test needs no real uuid, and gets stable run ids. */
  newRunId(): string
}

// ─── What the caller asks for ─────────────────────────────────────────

export interface RunRequest {
  /**
   * scheduled  every source whose cadence says it is due
   * named      one source, ignoring its cadence but never its access check
   * all        every enabled source, ignoring cadence
   */
  mode: 'scheduled' | 'named' | 'all'
  source?: string | null
  /** Restrict to records whose name contains one of these. For one-car checks. */
  only?: string[]
  dry: boolean
  /** Cap on records fetched from the source. 0 for no cap. */
  limit: number
  /** Cap on records processed. Overrides the source's stored recordBudget. */
  budget: number
  trigger: 'scheduled' | 'manual'
}

export interface SourceTotals extends ProposeTotals {
  found: number
  stored: number
  failed: number
  unchanged: number
  candidates: number
  deferred: number
  /**
   * Records that matched a catalogue car confidently enough to be compared.
   *
   * The number that decides how much work the proposal stage has, and the one a
   * dry run most needs to report: `stored` says how many records are new to us,
   * and this says how many of them are about a car we actually carry. On a global
   * dataset against a 36-car catalogue those two numbers are wildly different,
   * and only the second predicts the size of the review queue.
   */
  matched: number
}

export const ZERO_TOTALS: SourceTotals = {
  found: 0,
  stored: 0,
  failed: 0,
  unchanged: 0,
  candidates: 0,
  deferred: 0,
  matched: 0,
  proposed: 0,
  prices: 0,
  images: 0,
  highRisk: 0,
}

const ZERO_PRIORITIES: Record<Priority, number> = { unseen: 0, changed: 0, stale: 0, unchanged: 0 }

export interface PlanEntry {
  source: SourceRow
  run: boolean
  reason: string
  health: HealthReport
  due: DueVerdict
}

export interface SourceResult {
  sourceId: string
  runId: string | null
  outcome: 'completed' | 'partial' | 'failed' | 'blocked' | 'skipped' | 'not-modified'
  totals: SourceTotals
  errors: string[]
  notes: string[]
  durationMs: number
  priorityCounts: Record<Priority, number>
}

export interface RunReport {
  startedAt: Date
  plan: PlanEntry[]
  results: SourceResult[]
  totals: SourceTotals
  /** Sources whose data is older than their own window, whether or not they ran. */
  attention: { source: SourceRow; health: HealthReport }[]
  carsAfter: number
  durationMs: number
}

// ─── The plan ─────────────────────────────────────────────────────────

/**
 * Which sources run, and why — computed before anything is contacted.
 *
 * Separate from execution so `--status` can print exactly what a real run would
 * do without touching a network or a database. A dry run that took a different
 * decision path from the real one would be worthless as a rehearsal, and keeping
 * the decision in one function is the only way to guarantee it does not.
 */
export function planRun(
  deps: Pick<PipelineDeps, 'sources' | 'now'>,
  request: RunRequest,
): PlanEntry[] {
  const now = deps.now()

  return deps.sources.map((source) => {
    const health = grade({ ...source, now })
    const due = isDue({ ...source, now })

    if (request.mode === 'named') {
      /*
        A named source runs regardless of cadence, but never regardless of its
        access check. Impatience is a fine reason to ignore a schedule and never a
        reason to ignore somebody's stated wishes about their own server — the
        access check still runs downstream, and still refuses.
      */
      const run = source.id === request.source
      return {
        source,
        run,
        reason: run ? 'named on the command line, cadence ignored' : 'not the named source',
        health,
        due,
      }
    }

    if (request.mode === 'all') {
      /*
        `--all` ignores cadence but not the enabled switch.

        A switched-off source is off because somebody decided we may not, or
        should not, visit it. A convenience flag must not override that: the flag
        exists to skip a timer, not a decision.
      */
      return {
        source,
        run: source.isEnabled,
        reason: source.isEnabled
          ? 'every enabled source, cadence ignored'
          : 'the source is switched off',
        health,
        due,
      }
    }

    return { source, run: due.due, reason: due.reason, health, due }
  })
}

// ─── One source ───────────────────────────────────────────────────────

/** A record on its way through, carrying what the prioritiser needs. */
interface PendingRecord extends Classifiable {
  vehicle: NormalisedVehicle
  label: string
}

/**
 * Crawls one source.
 *
 * Every early return closes the run it opened and writes the source's health.
 * That symmetry is why this function is long rather than composed out of smaller
 * ones: a run row left open, or a health row left unwritten, is invisible until
 * the next morning's dashboard shows a source that has apparently been crawling
 * for nineteen hours.
 */
export async function crawlOneSource(
  deps: PipelineDeps,
  source: SourceRow,
  request: RunRequest,
): Promise<SourceResult> {
  const runStart = Date.now()
  const runId = deps.newRunId()
  const errors: string[] = []
  const notes: string[] = []
  const totals: SourceTotals = { ...ZERO_TOTALS }
  const priorityCounts: Record<Priority, number> = { ...ZERO_PRIORITIES }

  const result = (
    outcome: SourceResult['outcome'],
    runIdOrNull: string | null,
  ): SourceResult => ({
    sourceId: source.id,
    runId: runIdOrNull,
    outcome,
    totals,
    errors,
    notes,
    durationMs: Date.now() - runStart,
    priorityCounts,
  })

  const adapter = deps.adapters[source.id]
  if (!adapter) {
    /*
      No adapter is a configuration gap, not a source failure.

      It writes nothing at all — no run, no health change. A source row can exist
      for something nobody has written code for yet, and recording a failure
      against it every morning would put an innocent row into permanent backoff
      and eventually report it as stale, which says something untrue about a
      source we have never actually asked.
    */
    notes.push(`no adapter is registered for "${source.id}"`)
    return result('skipped', null)
  }

  const logger = deps.logger({ persist: !request.dry })

  // ── Access, before a single request ───────────────────────────────
  let verdict: Awaited<ReturnType<SourceAdapter['access']>>
  try {
    verdict = await adapter.access()
  } catch (error) {
    /*
      An access check that throws is a refusal, not permission.

      This is the one place where a bug in our own code could become an
      unauthorised request: if a thrown access check fell through to the fetch, a
      network blip inside `access()` would turn into a crawl of a source we had
      not established we may read. So it fails closed, and it is recorded as our
      failure rather than as a block by them.
    */
    const message = error instanceof Error ? error.message : String(error)
    errors.push(`access check failed: ${message}`)
    logger.error({ runId, sourceId: source.id, operation: 'fetch' }, error)

    if (!request.dry) {
      await safely(errors, () =>
        deps.store.openRun({ id: runId, sourceId: source.id, trigger: request.trigger }),
      )
      await safely(errors, () =>
        deps.store.closeRun(runId, {
          status: 'failed',
          durationMs: Date.now() - runStart,
          errors,
          notes: 'the access check itself failed, so nothing was fetched',
        }),
      )
      await safely(errors, () =>
        deps.store.updateSourceHealth(
          source.id,
          applyOutcome(source, { outcome: 'failure', error: message, at: deps.now() }),
        ),
      )
      await safely(errors, () => deps.store.clearSourceValidators(source.id))
      await safely(errors, () => logger.flush())
    }

    totals.failed = 1
    return result('failed', request.dry ? null : runId)
  }

  notes.push(`access: ${verdict.kind} — ${verdict.reason}`)
  if (verdict.attribution) notes.push(`ATTRIBUTION REQUIRED: ${verdict.attribution}`)

  if (!verdict.allowed) {
    if (!request.dry) {
      await safely(errors, () =>
        deps.store.recordRobotsCheck(source.id, 'unchecked', verdict.reason),
      )
      await safely(errors, () =>
        deps.store.openRun({ id: runId, sourceId: source.id, trigger: request.trigger }),
      )
      await safely(errors, () =>
        deps.store.closeRun(runId, {
          status: 'blocked',
          durationMs: Date.now() - runStart,
          notes: verdict.reason,
          errors: verdict.requires ?? null,
        }),
      )
      /*
        Blocked, not failed.

        Declining to fetch is this system working as designed. Counting it as a
        failure would grow a backoff against our own decision and eventually
        report a perfectly fine source as unhealthy, when the only fact is that we
        are not permitted to read it.
      */
      await safely(errors, () =>
        deps.store.updateSourceHealth(
          source.id,
          applyOutcome(source, { outcome: 'blocked', error: verdict.reason, at: deps.now() }),
        ),
      )
      logger.log({
        runId,
        sourceId: source.id,
        operation: 'skip',
        status: 'blocked',
        message: verdict.reason,
      })
      await safely(errors, () => logger.flush())
    }
    return result('blocked', request.dry ? null : runId)
  }

  if (!request.dry) {
    await safely(errors, () => deps.store.recordRobotsCheck(source.id, 'allowed', verdict.reason))
    await safely(errors, () =>
      deps.store.openRun({ id: runId, sourceId: source.id, trigger: request.trigger }),
    )
  }

  // ── Fetch, conditionally where the source supports it ─────────────
  const limiter = deps.limiter(source.id, {
    minDelayMs: source.requestDelayMs ?? 1_500,
    concurrency: 1,
  })

  const targeted = (request.only?.length ?? 0) > 0

  const fetchOptions: FetchOptions = {
    ...(request.limit > 0 ? { limit: request.limit } : {}),
    ...(targeted ? { only: request.only } : {}),
    /*
      Validators are not replayed on a targeted run.

      `--car byd-seal` wants that car's current data. Sending yesterday's ETag
      would get a 304 for the whole dataset and the run would report "nothing
      changed" — a true statement about the dataset and a useless answer to the
      question that was asked.
    */
    ...(targeted
      ? {}
      : {
          etag: source.lastEtag,
          lastModified: source.lastModifiedHttp,
          modifiedSince: source.lastSeenModified,
        }),
  }

  let outcome: FetchOutcome
  let fetchMs: number | null = null

  try {
    const fetched = await limiter.run(() => adapter.fetch(fetchOptions))
    outcome = fetched.value
    fetchMs = fetched.totalMs
    logger.log({
      runId,
      sourceId: source.id,
      operation: 'fetch',
      status: outcome.notModified ? 'unchanged' : 'ok',
      message: outcome.notModified
        ? 'the source answered 304 — its data has not changed'
        : `${outcome.vehicles.length} record(s)` +
          (outcome.totalAvailable && outcome.totalAvailable > outcome.vehicles.length
            ? ` of ${outcome.totalAvailable} available`
            : ''),
      durationMs: fetched.totalMs,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    errors.push(message)
    logger.error({ runId, sourceId: source.id, operation: 'fetch' }, error)

    if (!request.dry) {
      await safely(errors, () =>
        deps.store.closeRun(runId, {
          status: 'failed',
          durationMs: Date.now() - runStart,
          errors,
        }),
      )
      await safely(errors, () =>
        deps.store.updateSourceHealth(
          source.id,
          applyOutcome(source, { outcome: 'failure', error: message, at: deps.now() }),
        ),
      )
      /*
        Validators are cleared on failure.

        Keeping them would let a recovered source answer 304 to a token from
        before the outage, and the run would record a clean success having fetched
        nothing at all. A silent outage that looks like a quiet week is the worst
        failure this pipeline can have, because nothing on the dashboard turns
        orange.
      */
      await safely(errors, () => deps.store.clearSourceValidators(source.id))
      await safely(errors, () => logger.flush())
    }

    /*
      Nothing else happens on a failed fetch.

      In particular: no records are marked missing, no cars are touched, no
      candidate is withdrawn and no price is nulled. The catalogue after a failed
      crawl is byte-identical to the catalogue before it, which is the only
      behaviour that makes an unattended daily job safe to leave running.
    */
    totals.failed = 1
    return result('failed', request.dry ? null : runId)
  }

  // ── 304: a success with no work ──────────────────────────────────
  if (outcome.notModified) {
    notes.push('the source reports its data unchanged since the last run')

    if (!request.dry) {
      await safely(errors, () =>
        deps.store.closeRun(runId, {
          status: 'completed',
          recordsFound: 0,
          durationMs: Date.now() - runStart,
          notes: 'HTTP 304 — not modified since the last successful run',
        }),
      )
      /*
        A 304 is a success and must move lastSuccessAt.

        Otherwise a source that is working perfectly and simply has no news goes
        stale after its window and gets reported as a problem — punishing exactly
        the behaviour a conditional request exists to encourage. It does not move
        lastChangedAt, because nothing changed.
      */
      await safely(errors, () =>
        deps.store.updateSourceHealth(
          source.id,
          applyOutcome(source, {
            outcome: 'success',
            responseMs: fetchMs,
            changed: false,
            at: deps.now(),
          }),
        ),
      )
      await safely(errors, () => logger.flush())
    }

    return result('not-modified', request.dry ? null : runId)
  }

  totals.found = outcome.vehicles.length

  // ── Idempotency and ordering ─────────────────────────────────────
  /*
    A dry run reads. It is only writing that it does not do.

    This was the other way round, and it made the dry run useless for the one
    thing it exists for. Skipping the hash lookup meant every record was
    classified as new, so a rehearsal of a quiet morning reported "1,321
    changed" — the opposite of the true answer, and the number an operator would
    have used to decide whether to switch scheduling on.

    Both of these are read-only, and a dry run already reads the catalogue to
    match against, so nothing is being required that was not required already.
  */
  const [seen, identities] = await Promise.all([
    deps.store.knownContentHashes(source.id),
    deps.store.knownRecordIdentities(source.id),
  ])

  const pending: PendingRecord[] = outcome.vehicles.map((vehicle) => ({
    vehicle,
    label: `${vehicle.brand ?? '?'} ${vehicle.model ?? '?'}`.trim(),
    hash: deps.store.hashPayload(vehicle),
    modifiedAt: null,
    everSeen: identities.has(vehicle.externalId ?? vehicle.sourceUrl),
  }))

  const budget = request.budget > 0 ? request.budget : source.recordBudget
  const ordered = prioritise({ items: pending, knownHashes: seen, budget })
  Object.assign(priorityCounts, ordered.counts)
  totals.deferred = ordered.deferred.length

  const note = deferralNote(ordered)
  if (note) {
    notes.push(note)
    logger.log({ runId, sourceId: source.id, operation: 'skip', status: 'skipped', message: note })
  }

  const catalogue = await deps.catalogue.cars()
  const changedRecordIds: string[] = []

  for (const entry of ordered.selected) {
    const { vehicle, label } = entry.item

    /*
      An unchanged payload is skipped entirely.

      Not re-stored, not re-compared, not re-proposed, and — critically — its
      image is not re-fetched. For any source that does not support an ETag this
      is the overwhelmingly common case on a daily schedule: the vast majority of
      records are byte-identical to yesterday, and a run that re-processed them
      all would do a day's work to discover nothing, every day.
    */
    if (entry.priority === 'unchanged') {
      totals.unchanged += 1
      logger.log({
        runId,
        sourceId: source.id,
        operation: 'fetch',
        status: 'unchanged',
        message: label,
      })
      continue
    }

    const proposal: MatchResult = match(toMatchInput(vehicle), catalogue)
    const { filled, total } = coverage(vehicle)

    /*
      A dry run classifies. It simply does not write.

      Counting records and stopping there answered "how much data is there", which
      is not the question. What an operator needs before switching scheduling on is
      how many of these records are about cars we carry — the size of tomorrow's
      review queue — and how many are cars we do not, which is the size of the
      candidate queue. Both are decided by code that touches no database, so
      running it costs nothing and omitting it made the rehearsal misleading.
    */
    if (request.dry) {
      totals.stored += 1

      if (proposal.decision === 'confident') {
        totals.matched += 1
        logger.log({
          runId,
          sourceId: source.id,
          carId: proposal.best?.car.id ?? null,
          operation: 'match',
          status: 'changed',
          message: `DRY ${label} · ${filled}/${total} fields · would compare against ${proposal.best?.car.slug}`,
        })
        continue
      }

      const discovery = classify({ vehicle, match: proposal })
      if (isCandidate(discovery.verdict)) totals.candidates += 1
      logger.log({
        runId,
        sourceId: source.id,
        operation: 'discover',
        status: isCandidate(discovery.verdict) ? 'changed' : 'skipped',
        message: `DRY ${label} · ${discovery.verdict} — ${discovery.reason}`,
      })
      continue
    }

    try {
      const saved = await deps.store.storeRecord({
        sourceId: source.id,
        sourceUrl: vehicle.sourceUrl,
        externalId: vehicle.externalId,
        runId,
        fetchedAt: new Date(vehicle.fetchedAt),
        httpStatus: 200,
        raw: vehicle,
        normalised: vehicle,
        extractionStatus: filled === 0 ? 'failed' : filled < total / 3 ? 'partial' : 'ok',
        fieldsFound: filled,
        fieldsExpected: total,
        confidence: vehicle.confidence,
        // A proposal only. Nothing downstream reads this as approval.
        matchedCarId: proposal.decision === 'confident' ? (proposal.best?.car.id ?? null) : null,
        matchStrategy: proposal.best?.strategy ?? 'none',
        matchScore: proposal.best?.score ?? null,
        matchCandidates: proposal.candidates.map((candidate) => ({
          carId: candidate.car.id,
          slug: candidate.car.slug,
          strategy: candidate.strategy,
          score: candidate.score,
          reason: candidate.reason,
        })),

        /*
          Identity, stored alongside the match.

          `variantVerdict` answers a different question from `matchStrategy`: the
          strategy says how the MODEL was identified, the verdict says whether the
          TRIM was. Both were needed and only the first existed, which is how a
          record for "U 87 kWh Design" came to be stored as a confident match for
          a catalogue row describing the 61.4 kWh car.

          Assessed against every variant of this model the batch contains, so a
          group of records competing for one row is recognised as ambiguous rather
          than each being judged alone and each looking fine.
        */
        variant: vehicle.variant,
        trim: vehicle.trim,
        modelYear: vehicle.modelYear,
        generation: vehicle.generation,
        variantVerdict: identityFor(vehicle, proposal, ordered.selected).verdict,
        identityTier: identityFor(vehicle, proposal, ordered.selected).tier,
      })

      totals.stored += 1
      logger.log({
        runId,
        sourceId: source.id,
        carId: proposal.best?.car.id ?? null,
        operation: 'match',
        status: 'changed',
        message: `${label} · ${proposal.decision}${proposal.best ? ` -> ${proposal.best.car.slug}` : ''}`,
      })

      if (proposal.decision === 'confident') {
        totals.matched += 1
        changedRecordIds.push(saved.id)
        continue
      }

      // ── Discovery, for anything that did not match ────────────────
      const discovery = classify({ vehicle, match: proposal })
      if (!isCandidate(discovery.verdict)) {
        logger.log({
          runId,
          sourceId: source.id,
          operation: 'discover',
          status: 'skipped',
          message: `${label}: ${discovery.reason}`,
        })
        continue
      }

      await deps.store.upsertCandidate({
        sourceId: source.id,
        runId,
        recordId: saved.id,
        ...candidateKey(vehicle),
        trim: vehicle.trim,
        category: vehicle.powertrainType,
        normalised: vehicle,
        possibleDuplicateOf: discovery.possibleDuplicateOf,
        duplicateReason: discovery.duplicateReason,
        matchScore: discovery.matchScore,
        confidence: discovery.confidence,
        sourceUrl: vehicle.sourceUrl,
        fetchedAt: new Date(vehicle.fetchedAt),
      })
      totals.candidates += 1
      logger.log({
        runId,
        sourceId: source.id,
        operation: 'discover',
        status: 'changed',
        message: `${label}: ${discovery.verdict} — ${discovery.reason}`,
      })
    } catch (error) {
      /*
        One record's failure is one record's failure.

        This catch is inside the loop for the same reason the per-source catch is
        inside the driver: a malformed payload, a constraint violation, or the
        database being momentarily unavailable must cost one record, not the run.
        The alternative is a single bad row from a source with a thousand good ones
        aborting a night's work and leaving no report at all.
      */
      totals.failed += 1
      const message = error instanceof Error ? error.message : String(error)
      errors.push(`${label}: ${message}`)
      logger.error({ runId, sourceId: source.id, operation: 'normalise' }, error)
    }
  }

  // ── Proposals for the records that actually changed ───────────────
  if (!request.dry && changedRecordIds.length > 0) {
    try {
      const records = await deps.catalogue.recordsForProposal(changedRecordIds)

      for (const [, group] of groupByCar(records)) {
        const car = group[0]?.matchedCar
        if (!car) continue
        const proposed = await deps.propose(car, group, { runId, logger })
        totals.proposed += proposed.proposed
        totals.prices += proposed.prices
        totals.images += proposed.images
        totals.highRisk += proposed.highRisk
      }
    } catch (error) {
      /*
        A failure here makes the run partial, not lost.

        The staging rows are already written and are the valuable half: they can be
        turned into proposals later by `npm run crawl:propose` without re-fetching
        anything. Throwing away the run's record of what it found, in order to
        report a clean failure, would discard the part that cost a network request.
      */
      const message = error instanceof Error ? error.message : String(error)
      errors.push(`proposals: ${message}`)
      totals.failed += 1
      logger.error({ runId, sourceId: source.id, operation: 'propose' }, error)
    }
  }

  if (request.dry) {
    return result(totals.failed > 0 ? 'partial' : 'completed', null)
  }

  /*
    A run with some failures and some results is `partial`, not `failed`.

    The distinction matters to health: `partial` clears the failure count, because
    the source is plainly reachable. Calling it a failure would put a working
    source into backoff over one bad record.
  */
  const runOutcome: RunOutcome =
    totals.failed > 0 && totals.stored === 0 ? 'failure' : totals.failed > 0 ? 'partial' : 'success'

  await safely(errors, () =>
    deps.store.closeRun(runId, {
      status:
        runOutcome === 'failure' ? 'failed' : runOutcome === 'partial' ? 'partial' : 'completed',
      recordsFound: totals.found,
      recordsStored: totals.stored,
      recordsFailed: totals.failed,
      recordsChanged: totals.stored,
      recordsUnchanged: totals.unchanged,
      recordsPendingReview: totals.proposed,
      candidatesFound: totals.candidates,
      durationMs: Date.now() - runStart,
      errors: errors.length > 0 ? errors : null,
      notes: notes.length > 0 ? notes.join(' · ') : null,
    }),
  )

  await safely(errors, () =>
    deps.store.updateSourceHealth(
      source.id,
      applyOutcome(source, {
        outcome: runOutcome,
        responseMs: fetchMs,
        changed: totals.stored > 0,
        error: errors[0] ?? null,
        at: deps.now(),
      }),
    ),
  )

  /*
    Validators are stored only by a run that finished its own work.

    A partial run has records it could not process, and storing an ETag would mean
    tomorrow's request answers 304 — permanently skipping the very records that
    failed today. The next run therefore fetches in full, which is the right cost
    for having something left to do. A deferred budget is treated the same way,
    for the same reason.
  */
  if (runOutcome === 'success' && ordered.deferred.length === 0) {
    await safely(errors, () =>
      deps.store.updateSourceValidators(source.id, {
        lastEtag: outcome.etag ?? null,
        lastModifiedHttp: outcome.lastModified ?? null,
        ...(outcome.newestModified ? { lastSeenModified: outcome.newestModified } : {}),
      }),
    )
  } else if (outcome.etag || outcome.lastModified) {
    notes.push('validators not stored — the run left work undone, so the next must fetch in full')
    await safely(errors, () => deps.store.clearSourceValidators(source.id))
  }

  await safely(errors, () => logger.flush())

  return result(
    runOutcome === 'failure' ? 'failed' : runOutcome === 'partial' ? 'partial' : 'completed',
    runId,
  )
}

// ─── The whole run ────────────────────────────────────────────────────

/**
 * Runs every source the plan selected.
 *
 * The per-source try/catch is the whole of the failure isolation, and it is
 * deliberately at the outermost level per source: whatever goes wrong — network,
 * parse, a bug in an adapter, the database — the loop moves to the next source,
 * the report still comes back, and the catalogue is untouched. A daily job that
 * aborts halfway leaves the operator with no report and half the sources silently
 * a day older.
 */
export async function runDaily(deps: PipelineDeps, request: RunRequest): Promise<RunReport> {
  const startedAt = deps.now()
  const wallStart = Date.now()

  const plan = planRun(deps, request)
  const results: SourceResult[] = []
  let totals: SourceTotals = { ...ZERO_TOTALS }

  for (const entry of plan.filter((candidate) => candidate.run)) {
    try {
      const result = await crawlOneSource(deps, entry.source, request)
      results.push(result)
      totals = mergeTotals(totals, result.totals)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)

      /*
        A source that failed in a way this module did not anticipate.

        Recorded against the source's health so it backs off, but without a run
        row — the code that would have opened one is the code that just threw, and
        inventing a run id here would produce a row no log line refers to.
      */
      results.push({
        sourceId: entry.source.id,
        runId: null,
        outcome: 'failed',
        totals: { ...ZERO_TOTALS, failed: 1 },
        errors: [`unexpected failure: ${message}`],
        notes: [],
        durationMs: 0,
        priorityCounts: { ...ZERO_PRIORITIES },
      })
      totals = mergeTotals(totals, { ...ZERO_TOTALS, failed: 1 })

      if (!request.dry) {
        const swallowed: string[] = []
        await safely(swallowed, () =>
          deps.store.updateSourceHealth(
            entry.source.id,
            applyOutcome(entry.source, { outcome: 'failure', error: message, at: deps.now() }),
          ),
        )
      }
    }
  }

  const now = deps.now()
  const attention = deps.sources
    .map((source) => ({ source, health: grade({ ...source, now }) }))
    .filter((entry) => entry.health.grade !== 'healthy')

  return {
    startedAt,
    plan,
    results,
    totals,
    attention,
    carsAfter: await deps.catalogue.countCars(),
    durationMs: Date.now() - wallStart,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────

/**
 * Runs a bookkeeping write, collecting its failure instead of raising it.
 *
 * Used for every closeRun / health / validator write. The reasoning is narrow and
 * worth stating: if the database becomes unavailable *after* the fetch, the
 * useful work is already done, and letting a bookkeeping row's failure propagate
 * would abandon the remaining sources over an outage that has nothing to do with
 * them. The failure is collected, so it appears in the report rather than
 * vanishing.
 *
 * Never used for a write that is itself the point — storeRecord and
 * upsertCandidate raise, and are caught per record.
 */
async function safely(sink: string[], task: () => Promise<unknown>): Promise<void> {
  try {
    await task()
  } catch (error) {
    sink.push(`bookkeeping write failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/** Groups staging rows by the car they matched. */
export function groupByCar(records: ProposalRecord[]): Map<string, ProposalRecord[]> {
  const groups = new Map<string, ProposalRecord[]>()
  for (const record of records) {
    if (!record.matchedCarId) continue
    const existing = groups.get(record.matchedCarId)
    if (existing) existing.push(record)
    else groups.set(record.matchedCarId, [record])
  }
  return groups
}

export function mergeTotals(a: SourceTotals, b: SourceTotals): SourceTotals {
  return {
    found: a.found + b.found,
    stored: a.stored + b.stored,
    failed: a.failed + b.failed,
    unchanged: a.unchanged + b.unchanged,
    candidates: a.candidates + b.candidates,
    deferred: a.deferred + b.deferred,
    matched: a.matched + b.matched,
    proposed: a.proposed + b.proposed,
    prices: a.prices + b.prices,
    images: a.images + b.images,
    highRisk: a.highRisk + b.highRisk,
  }
}

/**
 * The identity verdict for one record, against the car it matched.
 *
 * Kept out of the loop body so the storeRecord call stays readable, and so the
 * "what else is competing for this row?" argument is derived in one place. The
 * competing set is every variant in this batch that matched the same car — which
 * is the fact no single record can see about itself.
 */
function identityFor(
  vehicle: NormalisedVehicle,
  proposal: MatchResult,
  batch: { item: { vehicle: NormalisedVehicle } }[],
): { verdict: string; tier: string } {
  const car = proposal.best?.car
  if (!car) return { verdict: 'mismatch', tier: 'none' }

  /*
    Only records that matched THIS car count as competing.

    Every variant in the batch would be the wrong set: a Kia EV9 record in the
    same run is not competing for the Seal's row, and counting it would make every
    multi-car batch look ambiguous.
  */
  const competing = batch
    .filter(({ item }) => {
      const other = match(toMatchInput(item.vehicle), [car])
      return other.decision === 'confident' || other.decision === 'probable'
    })
    .map(({ item }) => item.vehicle.variant ?? null)

  const assessment = assessIdentity({
    source: identityFromSource(vehicle),
    car: identityFromCar({
      slug: car.slug,
      brand: car.brand,
      model: car.model,
      variant: car.variant ?? null,
      trim: car.trim ?? null,
      modelYear: car.modelYear ?? null,
      generation: car.generation ?? null,
    }),
    competingSourceVariants: competing,
  })

  return { verdict: assessment.verdict, tier: assessment.tier }
}

/** Re-exported so callers get the cadence labels without a second import. */
export { CADENCES, toCadence }
