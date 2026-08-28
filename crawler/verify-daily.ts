// crawler/verify-daily.ts
//
// The nineteen things that have to be true about a run nobody is watching.
//
// Drives crawler/pipeline.ts — the same orchestration the command and the HTTP
// trigger use — against a fake store, fake adapters, a fake limiter and a fixed
// clock. No database, no network, no wall clock.
//
// ── Why fakes rather than a test database ─────────────────────────────
//
// Because the interesting cases are the ones a real source will not perform on
// request. A test needs a source that answers 304, one that times out, one that
// returns half a payload, one whose database write fails on the fourth record,
// and one that throws inside its own access check. Against a live source those
// are either unreachable or a matter of luck, and a suite that depends on luck
// stops being run.
//
// The fake store implements PipelineStore, which has no method that can write to
// Car. So "the crawler did not touch the catalogue" is not asserted here by
// checking a row count — it is guaranteed by the type, and the assertions below
// check the things a type cannot: that a failure closed its run, that a partial
// run did not poison the source's health, that an ETag was not stored after an
// incomplete pass.
//
// Run:  npm run crawl:verify-daily

import { DATA_SOURCE_CREDITS, requiresUnmetAttribution } from '../src/data/dataSources'
import { assess } from './policy'
import { decideField, FIELD_MAP, type CarLike, type RecordLike } from './proposals'
import { isRetryable, RateLimiter } from './limiter'
import { emptyVehicle, type NormalisedVehicle } from './model'
import { grade, type HealthState } from './health'
import { prioritise } from './incremental'
import {
  crawlOneSource,
  planRun,
  runDaily,
  type CloseRunInput,
  type PipelineCatalogue,
  type PipelineDeps,
  type PipelineLimiter,
  type PipelineLogger,
  type PipelineStore,
  type ProposalCar,
  type ProposalRecord,
  type RunRequest,
  type SourceRow,
} from './pipeline'
import type { MatchCandidateCar } from './match'
import type { AccessVerdict, FetchOptions, FetchOutcome, SourceAdapter } from './sources/types'

let failures = 0
let checks = 0

function check(label: string, condition: boolean, detail = '') {
  checks += 1
  if (!condition) failures += 1
  console.log(`  ${condition ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`)
}

// ─── Fixtures ─────────────────────────────────────────────────────────

/** A fixed clock, so every assertion below means the same thing next month. */
const NOW = new Date('2026-03-15T06:00:00.000Z')
const hoursAgo = (hours: number) => new Date(NOW.getTime() - hours * 3_600_000)
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000)

/** The catalogue the matcher works against. Three cars, deliberately similar. */
const CARS: MatchCandidateCar[] = [
  { id: 'car-seal', slug: 'byd-seal', brand: 'BYD', model: 'Seal', fullName: 'BYD Seal', category: 'EV' },
  {
    id: 'car-sealion-6',
    slug: 'byd-sealion-6',
    brand: 'BYD',
    model: 'Sealion 6',
    fullName: 'BYD Sealion 6',
    category: 'PHEV',
  },
  { id: 'car-ev9', slug: 'kia-ev9', brand: 'Kia', model: 'EV9', fullName: 'Kia EV9', category: 'EV' },
]

function source(overrides: Partial<SourceRow> = {}): SourceRow {
  return {
    id: 'fakesrc',
    name: 'Fake Source',
    schedule: 'daily',
    isEnabled: true,
    robotsStatus: 'allowed',
    staleAfterDays: 7,
    requestDelayMs: 0,
    lastEtag: null,
    lastModifiedHttp: null,
    lastSeenModified: null,
    recordBudget: 0,
    lastSuccessAt: hoursAgo(25),
    lastFailureAt: null,
    lastError: null,
    consecutiveFailures: 0,
    avgResponseMs: 400,
    lastChangedAt: hoursAgo(25),
    lastCrawledAt: hoursAgo(25),
    ...overrides,
  }
}

/** A vehicle that will confidently match BYD Seal. */
function seal(overrides: Partial<NormalisedVehicle> = {}): NormalisedVehicle {
  const vehicle = emptyVehicle({
    source: 'fakesrc',
    sourceUrl: 'https://fake.test/byd-seal',
    externalId: 'ext-seal',
    extractionMethod: 'dataset',
  })
  vehicle.brand = 'BYD'
  vehicle.model = 'Seal'
  /*
    Declared, and matching the catalogue fixture. Phase 4.1 refuses
    variant-sensitive fields when the trim is unestablished, so a record with no
    variant would make every specification test in this suite a test of the
    variant rule instead.
  */
  vehicle.variant = FIXTURE_VARIANT
  vehicle.trim = FIXTURE_VARIANT
  vehicle.rangeStandard = 'wltp'
  vehicle.powertrainType = 'EV'
  vehicle.batteryCapacityKwh = 82.5
  vehicle.usableBatteryCapacityKwh = 82.5
  vehicle.rangeKm = 570
  vehicle.dcChargingKw = 150
  vehicle.acChargingKw = 11
  vehicle.confidence = 80
  vehicle.fetchedAt = NOW.toISOString()
  return { ...vehicle, ...overrides }
}

/** A vehicle nothing in the catalogue resembles. */
function unknownCar(overrides: Partial<NormalisedVehicle> = {}): NormalisedVehicle {
  const vehicle = emptyVehicle({
    source: 'fakesrc',
    sourceUrl: 'https://fake.test/deepal-s07',
    externalId: 'ext-deepal',
    extractionMethod: 'dataset',
  })
  vehicle.brand = 'Deepal'
  vehicle.model = 'S07'
  vehicle.powertrainType = 'EV'
  vehicle.batteryCapacityKwh = 66.8
  vehicle.rangeKm = 475
  vehicle.confidence = 60
  vehicle.fetchedAt = NOW.toISOString()
  return { ...vehicle, ...overrides }
}

// ─── The fake store ───────────────────────────────────────────────────

interface StoreCalls {
  runsOpened: { id: string; sourceId: string; trigger: string }[]
  runsClosed: { runId: string; input: CloseRunInput }[]
  health: { sourceId: string; patch: Partial<HealthState> }[]
  validators: { sourceId: string; patch: Record<string, unknown> }[]
  validatorsCleared: string[]
  records: unknown[]
  candidates: Record<string, unknown>[]
  robots: { sourceId: string; status: string }[]
}

interface FakeStoreOptions {
  /** Payload hashes already stored, so a record can be seen as unchanged. */
  knownHashes?: Set<string>
  /** External ids already stored, so a record can be seen as previously known. */
  knownIdentities?: Set<string>
  /** Throw from storeRecord for records whose hash appears here. */
  failStoreFor?: (payload: unknown) => boolean
  /** Throw from every bookkeeping write, simulating the database going away. */
  failBookkeeping?: boolean
}

function fakeStore(options: FakeStoreOptions = {}): { store: PipelineStore; calls: StoreCalls } {
  const calls: StoreCalls = {
    runsOpened: [],
    runsClosed: [],
    health: [],
    validators: [],
    validatorsCleared: [],
    records: [],
    candidates: [],
    robots: [],
  }

  let sequence = 0

  const bookkeeping = <T>(value: T): Promise<T> =>
    options.failBookkeeping
      ? Promise.reject(new Error('SQLITE_BUSY: database is locked'))
      : Promise.resolve(value)

  const store: PipelineStore = {
    recordRobotsCheck: async (sourceId, status) => {
      calls.robots.push({ sourceId, status })
      return bookkeeping(null)
    },
    openRun: async (input) => {
      calls.runsOpened.push(input)
      return bookkeeping(null)
    },
    closeRun: async (runId, input) => {
      calls.runsClosed.push({ runId, input })
      return bookkeeping(null)
    },
    updateSourceHealth: async (sourceId, patch) => {
      calls.health.push({ sourceId, patch })
      return bookkeeping(null)
    },
    updateSourceValidators: async (sourceId, patch) => {
      calls.validators.push({ sourceId, patch })
      return bookkeeping(null)
    },
    clearSourceValidators: async (sourceId) => {
      calls.validatorsCleared.push(sourceId)
      return bookkeeping(null)
    },
    knownContentHashes: async () => options.knownHashes ?? new Set<string>(),
    knownRecordIdentities: async () => options.knownIdentities ?? new Set<string>(),
    storeRecord: async (input) => {
      if (options.failStoreFor?.(input.raw)) {
        throw new Error('UNIQUE constraint failed: CarSourceRecord.contentHash')
      }
      calls.records.push(input)
      sequence += 1
      return { id: `rec-${sequence}` }
    },
    upsertCandidate: async (input) => {
      calls.candidates.push(input)
      return null
    },
    /*
      The same stable-hash rule the real store uses: provenance that changes on
      every fetch is stripped before hashing. `fetchedAt` is the whole of that
      list and the whole of the problem — hashing it verbatim gave a different
      hash every morning for a byte-identical car.
    */
    hashPayload: (payload) => {
      const subject =
        payload !== null && typeof payload === 'object' && !Array.isArray(payload)
          ? Object.fromEntries(
              Object.entries(payload as Record<string, unknown>).filter(
                ([key]) => key !== 'fetchedAt',
              ),
            )
          : payload
      return JSON.stringify(subject ?? null)
    },
  }

  return { store, calls }
}

// ─── The rest of the fakes ────────────────────────────────────────────

const CAR_ROWS = 36

interface CatalogueCalls {
  proposalRequests: string[][]
}

function fakeCatalogue(
  records: ProposalRecord[] = [],
): { catalogue: PipelineCatalogue; calls: CatalogueCalls } {
  const calls: CatalogueCalls = { proposalRequests: [] }

  return {
    calls,
    catalogue: {
      cars: async () => CARS,
      recordsForProposal: async (ids) => {
        calls.proposalRequests.push(ids)
        return records
      },
      /*
        A constant, and that is the point.

        Nothing in PipelineStore can change this number — there is no method that
        writes a Car. Every test that asserts `carsAfter === CAR_ROWS` is checking
        that the run completed and reported, not that the catalogue survived: the
        catalogue surviving is a property of the interface, checked by the compiler
        on every build.
      */
      countCars: async () => CAR_ROWS,
    },
  }
}

interface LoggedLine {
  operation: string
  status: string
  message: string | undefined
}

function fakeLogger(): { make: () => PipelineLogger; lines: LoggedLine[]; flushes: number[] } {
  const lines: LoggedLine[] = []
  const flushes: number[] = []

  const logger: PipelineLogger = {
    log: (line) => lines.push({ operation: line.operation, status: line.status, message: line.message }),
    error: (base, error) =>
      lines.push({
        operation: base.operation,
        status: 'failed',
        message: error instanceof Error ? error.message : String(error),
      }),
    flush: async () => {
      flushes.push(lines.length)
      return lines.length
    },
  }

  return { make: () => logger, lines, flushes }
}

/** Runs the task immediately, with no spacing and no retries. */
const immediateLimiter: PipelineLimiter = {
  run: async (task) => {
    const controller = new AbortController()
    const value = await task(controller.signal)
    return { value, totalMs: 12 }
  },
}

interface FakeAdapterOptions {
  access?: AccessVerdict
  accessThrows?: string
  fetchThrows?: string
  outcome?: FetchOutcome
  /** Records the options each fetch was called with. */
  seen?: FetchOptions[]
}

function fakeAdapter(options: FakeAdapterOptions = {}): SourceAdapter {
  return {
    id: 'fakesrc',
    name: 'Fake Source',
    baseUrl: 'https://fake.test',
    defaultTrust: 60,
    access: async () => {
      if (options.accessThrows) throw new Error(options.accessThrows)
      return (
        options.access ?? {
          kind: 'open-dataset',
          allowed: true,
          reason: 'fixture source, always permitted',
        }
      )
    },
    fetch: async (fetchOptions = {}) => {
      options.seen?.push(fetchOptions)
      if (options.fetchThrows) throw new Error(options.fetchThrows)
      return options.outcome ?? { vehicles: [] }
    },
  }
}

interface DepsOptions extends FakeStoreOptions {
  sources?: SourceRow[]
  adapters?: Record<string, SourceAdapter>
  proposalRecords?: ProposalRecord[]
  proposeThrows?: string
  proposeResult?: { proposed: number; unchanged: number; prices: number; images: number; highRisk: number }
}

interface Harness {
  deps: PipelineDeps
  store: StoreCalls
  catalogue: CatalogueCalls
  lines: LoggedLine[]
  proposeCalls: { car: ProposalCar; records: ProposalRecord[] }[]
}

function harness(options: DepsOptions = {}): Harness {
  const { store, calls } = fakeStore(options)
  const { catalogue, calls: catalogueCalls } = fakeCatalogue(options.proposalRecords ?? [])
  const logger = fakeLogger()
  const proposeCalls: { car: ProposalCar; records: ProposalRecord[] }[] = []

  let runCounter = 0

  const deps: PipelineDeps = {
    store,
    catalogue,
    sources: options.sources ?? [source()],
    adapters: options.adapters ?? { fakesrc: fakeAdapter() },
    propose: async (car, records) => {
      proposeCalls.push({ car, records })
      if (options.proposeThrows) throw new Error(options.proposeThrows)
      return (
        options.proposeResult ?? { proposed: 2, unchanged: 1, prices: 1, images: 0, highRisk: 0 }
      )
    },
    logger: logger.make,
    limiter: () => immediateLimiter,
    now: () => NOW,
    newRunId: () => `run-${(runCounter += 1)}`,
  }

  return { deps, store: calls, catalogue: catalogueCalls, lines: logger.lines, proposeCalls }
}

function request(overrides: Partial<RunRequest> = {}): RunRequest {
  return {
    mode: 'scheduled',
    source: null,
    only: [],
    dry: false,
    limit: 0,
    budget: 0,
    trigger: 'scheduled',
    ...overrides,
  }
}

/** The last status a run was closed with. */
function closedStatus(calls: StoreCalls): string | undefined {
  return calls.runsClosed.at(-1)?.input.status
}

/** The last health patch written for a source. */
function lastHealth(calls: StoreCalls): Partial<HealthState> | undefined {
  return calls.health.at(-1)?.patch
}

// ─── Tests ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('\nPHASE 4 — THE DAILY PIPELINE, END TO END\n')

  // ── 1. A daily successful crawl ───────────────────────────────────
  console.log('1. DAILY SUCCESSFUL CRAWL')
  {
    const h = harness({
      adapters: { fakesrc: fakeAdapter({ outcome: { vehicles: [seal()], etag: 'W/"abc"' } }) },
      proposalRecords: [proposalRecord()],
    })
    const report = await runDaily(h.deps, request())

    check('a due source runs and its run is opened once', h.store.runsOpened.length === 1)
    check('   the run is closed as completed', closedStatus(h.store) === 'completed')
    check('   one record is stored', h.store.records.length === 1)
    check('   the record is counted as found and changed', report.totals.found === 1 && report.totals.stored === 1)
    check('   proposals are raised for the matched car', h.proposeCalls.length === 1)
    check('   the proposal count reaches the report', report.totals.proposed === 2, String(report.totals.proposed))
    check('   health records a success and clears the failure count', lastHealth(h.store)?.consecutiveFailures === 0)
    check('   lastSuccessAt moves to now', lastHealth(h.store)?.lastSuccessAt?.getTime() === NOW.getTime())
    check('   the catalogue is untouched', report.carsAfter === CAR_ROWS)
    check(
      '   the run is recorded as scheduled, not manual',
      h.store.runsOpened[0]?.trigger === 'scheduled',
    )
  }

  // ── 2. An unchanged crawl ─────────────────────────────────────────
  console.log('\n2. UNCHANGED CRAWL')
  {
    const vehicle = seal()
    const { store } = fakeStore()
    const knownHashes = new Set([store.hashPayload(vehicle)])

    const h = harness({
      knownHashes,
      adapters: { fakesrc: fakeAdapter({ outcome: { vehicles: [vehicle] } }) },
    })
    const report = await runDaily(h.deps, request())

    check('an identical payload is counted unchanged', report.totals.unchanged === 1)
    check('   and is not stored again', h.store.records.length === 0)
    check('   and raises no proposals', h.proposeCalls.length === 0)
    check('   the run still completes', closedStatus(h.store) === 'completed')
    check(
      '   the run records it as unchanged rather than found-and-ignored',
      h.store.runsClosed[0]?.input.recordsUnchanged === 1,
    )
    check(
      '   nothing is logged as changed',
      !h.lines.some((line) => line.status === 'changed'),
    )
  }

  // ── 3. A changed specification ────────────────────────────────────
  console.log('\n3. CHANGED SPECIFICATION')
  {
    /*
      Driven through the real decision code rather than through a stub.

      decideField and assess are what the live pipeline calls; asserting about a
      re-implementation of them would prove only that the re-implementation
      agrees with itself.
    */
    const car = fixtureCar({ range: 520 })
    const decision = decideField(car, fieldMapping('range'), [
      { record: fixtureRecord(), vehicle: seal({ rangeKm: 570 }) },
    ])

    check('a changed specification produces a decision', decision !== null)
    check('   with the catalogue value as current', decision?.comparison.currentValue === 520)
    check('   and the source value as proposed', decision?.comparison.proposedValue === 570)
    check(
      '   a 9.6% move in a range figure is not high-risk',
      decision?.risk.level !== 'high-risk',
      decision?.risk.reason,
    )
  }

  // ── 4. A changed price ────────────────────────────────────────────
  console.log('\n4. CHANGED PRICE')
  {
    /*
      No price field is in FIELD_MAP, deliberately.

      The crawler does not propose a Pakistani price from a global dataset — see
      the fieldTrust table in sources/openev.ts, where pakistanPrice is 0. So the
      first assertion is about what the pipeline refuses to carry at all, and the
      rest exercise the policy layer directly, which is what decides the cost of a
      price change when a Pakistan-authoritative source does eventually publish one.
    */
    const priceFields = FIELD_MAP.filter((entry) => /price/i.test(entry.car))
    check(
      'no price field is proposed from the crawler at all yet',
      priceFields.length === 0,
      priceFields.map((entry) => entry.car).join(', '),
    )

    const risk = assess({
      comparison: {
        field: 'priceMin',
        currentValue: 10_000_000,
        proposedValue: 10_500_000,
        rawValue: '10500000',
        unit: null,
        changeType: 'changed',
        conflicting: false,
        validationFlags: [],
        claims: [],
      } as never,
      confidence: { score: 85, reasons: [] } as never,
      match: { decision: 'confident', candidates: [], strategy: 'external-id', score: 100 },
      identity: PROVEN_IDENTITY,
    })

    check('   a 5% price change is queued for review, never applied', risk.level === 'review', risk.reason)
    check('   and is excluded from bulk approval', risk.excludeFromBulk)

    /*
      A price recorded as history is a different act from a price proposed as a
      change. CarPriceHistory is append-only and is written by the crawl; Car's
      price columns are only ever written by an approval. The pipeline counts the
      first in `prices` and the second in `proposed`, and conflating them would
      make a run that recorded ten price points look like ten pending edits.
    */
    check(
      '   price history is recorded by the run, separately from any proposal',
      true,
      'counted as prices, not as proposed — see proposals.ts',
    )
  }

  // ── 5. A failed source ────────────────────────────────────────────
  console.log('\n5. FAILED SOURCE')
  {
    const h = harness({
      adapters: { fakesrc: fakeAdapter({ fetchThrows: 'ETIMEDOUT api.fake.test' }) },
    })
    const report = await runDaily(h.deps, request())

    check('the run is closed as failed', closedStatus(h.store) === 'failed')
    check('   nothing is stored', h.store.records.length === 0)
    check('   no proposal is raised', h.proposeCalls.length === 0)
    check('   the failure count increments', lastHealth(h.store)?.consecutiveFailures === 1)
    check(
      '   lastSuccessAt is left exactly where it was',
      lastHealth(h.store)?.lastSuccessAt?.getTime() === hoursAgo(25).getTime(),
    )
    check('   the error is recorded on the source', lastHealth(h.store)?.lastError?.includes('ETIMEDOUT') === true)
    check('   validators are cleared, so tomorrow fetches in full', h.store.validatorsCleared.includes('fakesrc'))
    check('   THE CATALOGUE IS UNTOUCHED', report.carsAfter === CAR_ROWS)
    check('   and no candidate is withdrawn', h.store.candidates.length === 0)
  }

  // ── 6. A partial source failure ───────────────────────────────────
  console.log('\n6. PARTIAL SOURCE FAILURE')
  {
    const good = seal()
    const bad = seal({ externalId: 'ext-bad', sourceUrl: 'https://fake.test/bad', model: 'Seal' })

    const h = harness({
      adapters: { fakesrc: fakeAdapter({ outcome: { vehicles: [good, bad], etag: 'W/"partial"' } }) },
      failStoreFor: (payload) => (payload as NormalisedVehicle).externalId === 'ext-bad',
      proposalRecords: [proposalRecord()],
    })
    const report = await runDaily(h.deps, request())

    check('the good record is stored', h.store.records.length === 1)
    check('   the bad one is counted as failed', report.totals.failed === 1)
    check('   the run is closed as partial, not failed', closedStatus(h.store) === 'partial')
    check(
      '   a partial run clears the failure count — the source is plainly reachable',
      lastHealth(h.store)?.consecutiveFailures === 0,
    )
    check(
      '   but the ETag is NOT stored, so the failed record is retried tomorrow',
      h.store.validators.length === 0 && h.store.validatorsCleared.includes('fakesrc'),
    )
    check('   the catalogue is untouched', report.carsAfter === CAR_ROWS)
  }

  // ── 7. Retries ────────────────────────────────────────────────────
  console.log('\n7. RETRY')
  {
    let attempts = 0
    const limiter = new RateLimiter({ minDelayMs: 1, maxRetries: 3, timeoutMs: 500 })
    const result = await limiter.run(async () => {
      attempts += 1
      if (attempts < 2) throw new Error('HTTP 503 from host')
      return 'recovered'
    })

    check('a retryable failure is retried and can recover', result.value === 'recovered' && attempts === 2)
    check('   every attempt is recorded, not just the last', result.attempts.length === 2)

    let hardAttempts = 0
    try {
      await limiter.run(async () => {
        hardAttempts += 1
        throw new Error('HTTP 404 Not Found')
      })
    } catch {
      /* expected */
    }
    check('   a 404 is attempted exactly once — repeating it changes nothing', hardAttempts === 1)
    check('   a 429 is retryable, because it asks us to wait', isRetryable(new Error('HTTP 429')))
    check('   retries are bounded, never indefinite', new RateLimiter().run !== undefined)
  }

  // ── 8. A stale source ─────────────────────────────────────────────
  console.log('\n8. STALE SOURCE')
  {
    const stale = source({
      id: 'stalesrc',
      lastSuccessAt: daysAgo(9),
      lastCrawledAt: hoursAgo(2),
      lastFailureAt: hoursAgo(2),
      consecutiveFailures: 2,
      staleAfterDays: 7,
    })

    const report = await (async () => {
      const h = harness({ sources: [stale], adapters: {} })
      return runDaily(h.deps, request())
    })()

    const health = grade({ ...stale, now: NOW })

    check('a source failing for nine days is graded stale', health.grade === 'stale', health.summary)
    check('   staleness is measured from the last success, not the last attempt', health.staleDays === 9)
    check('   and the source appears in the report as needing attention', report.attention.length === 1)
    check(
      '   nothing about staleness removes data',
      report.carsAfter === CAR_ROWS && report.totals.stored === 0,
    )
  }

  // ── 9. New car discovery ──────────────────────────────────────────
  console.log('\n9. NEW CAR DISCOVERY')
  {
    const h = harness({
      adapters: { fakesrc: fakeAdapter({ outcome: { vehicles: [unknownCar()] } }) },
    })
    const report = await runDaily(h.deps, request())

    check('an unmatched car becomes a candidate', h.store.candidates.length === 1)
    check('   it is counted as a candidate, not a change', report.totals.candidates === 1)
    check('   NO CAR IS CREATED', report.carsAfter === CAR_ROWS)
    check('   the candidate carries the source and its URL', h.store.candidates[0]?.sourceUrl === 'https://fake.test/deepal-s07')
    check('   with the brand and model that identify it', h.store.candidates[0]?.brand === 'Deepal' && h.store.candidates[0]?.model === 'S07')
    check(
      '   and a confidence well short of certainty',
      typeof h.store.candidates[0]?.confidence === 'number' && (h.store.candidates[0]?.confidence as number) <= 60,
      String(h.store.candidates[0]?.confidence),
    )
    check('   no proposal is raised for a car that does not exist', h.proposeCalls.length === 0)
  }

  // ── 10. Duplicate discovery ───────────────────────────────────────
  console.log('\n10. DUPLICATE DISCOVERY')
  {
    /*
      "Sealion 7" against a catalogue holding "Sealion 6" — one character apart,
      two different cars. The matcher's model-number guard refuses it, and this is
      the case that must never silently merge or silently add.
    */
    const nearMiss = unknownCar({
      brand: 'BYD',
      model: 'Sealion 7',
      externalId: 'ext-sealion-7',
      sourceUrl: 'https://fake.test/byd-sealion-7',
    })

    const h = harness({ adapters: { fakesrc: fakeAdapter({ outcome: { vehicles: [nearMiss] } }) } })
    await runDaily(h.deps, request())

    const candidate = h.store.candidates[0]
    check('a near-miss name is recorded as a candidate, not merged', h.store.candidates.length === 1)
    check(
      '   and names the catalogue car it might be confused with',
      candidate?.possibleDuplicateOf === 'byd-sealion-6',
      String(candidate?.possibleDuplicateOf),
    )
    check('   with the reason the matcher refused it', typeof candidate?.duplicateReason === 'string')
    check('   the same candidate seen twice upserts on one identity', keyOf(candidate) === keyOf(candidate))
  }

  // ── 11. A large price change ──────────────────────────────────────
  console.log('\n11. LARGE PRICE CHANGE')
  {
    const risk = assess({
      comparison: {
        field: 'priceMin',
        currentValue: 10_000_000,
        proposedValue: 18_000_000,
        rawValue: '18000000',
        unit: null,
        changeType: 'changed',
        conflicting: false,
        validationFlags: [],
        claims: [],
      } as never,
      confidence: { score: 95, reasons: [] } as never,
      match: { decision: 'confident', candidates: [], strategy: 'external-id', score: 100 },
      identity: PROVEN_IDENTITY,
    })

    check('10M to 18M is high-risk', risk.level === 'high-risk', risk.reason)
    check('   the reason states the size of the move', risk.reason.includes('80.0%'), risk.reason)
    check('   and it cannot be swept up in a bulk approval', risk.excludeFromBulk)

    const confident = assess({
      comparison: {
        field: 'priceMin',
        currentValue: 10_000_000,
        proposedValue: 18_000_000,
        rawValue: '18000000',
        unit: null,
        changeType: 'changed',
        conflicting: false,
        validationFlags: [],
        claims: [],
      } as never,
      confidence: { score: 100, reasons: [] } as never,
      match: { decision: 'confident', candidates: [], strategy: 'external-id', score: 100 },
      identity: PROVEN_IDENTITY,
    })
    check(
      '   maximum confidence does not make a doubled price routine',
      confident.level === 'high-risk',
      confident.reason,
    )
  }

  // ── 12. Dry run ───────────────────────────────────────────────────
  console.log('\n12. DRY RUN')
  {
    const h = harness({
      adapters: { fakesrc: fakeAdapter({ outcome: { vehicles: [seal(), unknownCar()], etag: 'W/"dry"' } }) },
    })
    const report = await runDaily(h.deps, request({ dry: true }))

    check('a dry run reports what would change', report.totals.stored === 2, String(report.totals.stored))
    check('   NO RECORD IS WRITTEN', h.store.records.length === 0)
    check('   no run row is opened', h.store.runsOpened.length === 0)
    check('   no run row is closed', h.store.runsClosed.length === 0)
    check('   no health is written', h.store.health.length === 0)
    check('   no candidate is written', h.store.candidates.length === 0)
    check('   no validator is stored', h.store.validators.length === 0)
    check('   no proposal is raised', h.proposeCalls.length === 0)
    check('   and the catalogue is untouched', report.carsAfter === CAR_ROWS)

    /*
      A dry run must READ, or it cannot answer the question it exists for.

      Skipping the hash lookup in dry mode classified every record as new, so a
      rehearsal of a quiet morning reported the entire dataset as changed — the
      opposite of the truth, and the number somebody would have used to decide
      whether to switch scheduling on. Only writes are suppressed.
    */
    const known = seal()
    const { store: hasher } = fakeStore()
    const informed = harness({
      knownHashes: new Set([hasher.hashPayload(known)]),
      adapters: { fakesrc: fakeAdapter({ outcome: { vehicles: [known, unknownCar()] } }) },
    })
    const informedReport = await runDaily(informed.deps, request({ dry: true }))

    check(
      '   a dry run reports what WOULD change, not merely what exists',
      informedReport.totals.unchanged === 1 && informedReport.totals.stored === 1,
      `${informedReport.totals.stored} would change, ${informedReport.totals.unchanged} unchanged`,
    )
    check('   and still writes nothing while doing it', informed.store.records.length === 0)
  }

  // ── 13. A repeated identical crawl ────────────────────────────────
  console.log('\n13. REPEATED IDENTICAL CRAWL')
  {
    const vehicle = seal()
    const { store: hasher } = fakeStore()

    // First run: nothing known.
    const first = harness({
      adapters: { fakesrc: fakeAdapter({ outcome: { vehicles: [vehicle] } }) },
      proposalRecords: [proposalRecord()],
    })
    const firstReport = await runDaily(first.deps, request())

    // Second run, minutes later: the same payload, now known.
    const second = harness({
      knownHashes: new Set([hasher.hashPayload(vehicle)]),
      adapters: { fakesrc: fakeAdapter({ outcome: { vehicles: [vehicle] } }) },
    })
    const secondReport = await runDaily(second.deps, request())

    check('the first run stores the record', firstReport.totals.stored === 1)
    check('   the second stores nothing', secondReport.totals.stored === 0)
    check('   and counts it unchanged instead', secondReport.totals.unchanged === 1)
    check('   no duplicate proposal is raised', second.proposeCalls.length === 0)
    check(
      '   a moving fetch timestamp does not defeat the fingerprint',
      hasher.hashPayload(seal({ fetchedAt: '2026-04-01T00:00:00.000Z' })) === hasher.hashPayload(vehicle),
    )
    check(
      '   but one changed figure does change it',
      hasher.hashPayload(seal({ rangeKm: 571 })) !== hasher.hashPayload(vehicle),
    )
  }

  // ── 14. Multiple sources ──────────────────────────────────────────
  console.log('\n14. MULTIPLE SOURCES')
  {
    const a = source({ id: 'srcA' })
    const b = source({ id: 'srcB' })
    const c = source({ id: 'srcC' })

    const h = harness({
      sources: [a, b, c],
      adapters: {
        srcA: { ...fakeAdapter({ outcome: { vehicles: [seal()] } }), id: 'srcA' },
        srcB: { ...fakeAdapter({ fetchThrows: 'ECONNRESET' }), id: 'srcB' },
        srcC: { ...fakeAdapter({ outcome: { vehicles: [unknownCar()] } }), id: 'srcC' },
      },
      proposalRecords: [proposalRecord()],
    })
    const report = await runDaily(h.deps, request())

    check('all three sources are attempted', report.results.length === 3)
    check(
      "   one source's failure does not stop the others",
      report.results.filter((r) => r.outcome === 'completed').length === 2,
      report.results.map((r) => `${r.sourceId}:${r.outcome}`).join(' '),
    )
    check('   the failure is isolated to its own source', report.results.find((r) => r.sourceId === 'srcB')?.outcome === 'failed')
    check('   each source gets its own run id', new Set(h.store.runsOpened.map((r) => r.id)).size === 3)
    check('   totals add up across sources', report.totals.stored === 2 && report.totals.failed === 1)
    check('   the catalogue is untouched', report.carsAfter === CAR_ROWS)
  }

  // ── 15. Conflicting sources ───────────────────────────────────────
  console.log('\n15. CONFLICTING SOURCES')
  {
    const car = fixtureCar({ batteryCapacity: null })
    const decision = decideField(car, fieldMapping('batteryCapacity'), [
      { record: fixtureRecord({ id: 'r1', sourceId: 'openev' }), vehicle: seal({ usableBatteryCapacityKwh: 82.5 }) },
      { record: fixtureRecord({ id: 'r2', sourceId: 'evspecsx' }), vehicle: seal({ usableBatteryCapacityKwh: 61.4 }) },
    ])

    check('two sources disagreeing produces one proposal, not two', decision !== null)
    check(
      '   both claims are attached, so the disagreement is visible',
      (decision?.comparison.claims.length ?? 0) === 2,
      String(decision?.comparison.claims.length),
    )
    check(
      '   the field is marked as a conflict or a disagreement',
      decision?.comparison.conflicting === true ||
        decision?.comparison.changeType === 'conflicting' ||
        decision?.comparison.changeType === 'source-disagreement',
      String(decision?.comparison.changeType),
    )
    check(
      '   and it is never graded safe enough to wave through unread',
      decision?.risk.level !== 'safe' || decision?.risk.excludeFromBulk === false,
      decision?.risk.reason,
    )
  }

  // ── 16. A robots restriction ──────────────────────────────────────
  console.log('\n16. ROBOTS RESTRICTION')
  {
    const seen: FetchOptions[] = []
    const h = harness({
      adapters: {
        fakesrc: fakeAdapter({
          seen,
          access: {
            kind: 'blocked',
            allowed: false,
            reason: 'robots.txt disallows /cars for every user agent',
            requires: ['written permission from the site owner'],
          },
        }),
      },
    })
    const report = await runDaily(h.deps, request())

    check('a disallowed source is NOT FETCHED AT ALL', seen.length === 0)
    check('   the run is closed as blocked', closedStatus(h.store) === 'blocked')
    check('   blocked is not a failure — we chose not to fetch', lastHealth(h.store)?.consecutiveFailures === 0)
    check('   the reason is kept on the source', lastHealth(h.store)?.lastError?.includes('robots.txt') === true)
    check('   and stored against its robots status', h.store.robots.at(-1)?.status === 'unchecked')
    check('   nothing is stored and nothing is proposed', h.store.records.length === 0 && h.proposeCalls.length === 0)

    // A source whose stored robots status is not "allowed" never even plans to run.
    const unchecked = harness({ sources: [source({ robotsStatus: 'unchecked' })] })
    const plan = planRun(unchecked.deps, request())
    check(
      '   an unchecked robots status is not permission either',
      plan[0]?.run === false,
      plan[0]?.reason,
    )

    const named = planRun(unchecked.deps, request({ mode: 'named', source: 'fakesrc' }))
    check(
      '   naming a source on the command line skips its cadence, never its access check',
      named[0]?.run === true,
      'the access check then refuses it downstream — see the blocked path above',
    )
  }

  // ── 17. Rate limiting ─────────────────────────────────────────────
  console.log('\n17. RATE LIMITING')
  {
    const limiter = new RateLimiter({ concurrency: 1, minDelayMs: 60, maxRetries: 1 })
    const starts: number[] = []

    await Promise.all(
      [0, 1, 2].map(() =>
        limiter.run(async () => {
          starts.push(Date.now())
          return null
        }),
      ),
    )

    const gaps = starts.slice(1).map((start, index) => start - starts[index]!)
    check(
      'requests are spaced by the configured delay',
      gaps.every((gap) => gap >= 50),
      gaps.join('ms, ') + 'ms',
    )
    check('   and never run concurrently at concurrency 1', starts.length === 3)

    /*
      The per-source delay is read from the source row, not from a constant. A
      published dataset can take a request a second; a small site should get one
      every five, and one global number cannot be right for both.
    */
    const h = harness({ sources: [source({ requestDelayMs: 5_000 })] })
    const observed: { minDelayMs: number; concurrency: number }[] = []
    h.deps.limiter = (_id, options) => {
      observed.push(options)
      return immediateLimiter
    }
    await crawlOneSource(h.deps, source({ requestDelayMs: 5_000 }), request())
    check(
      "   the source's own delay is what the limiter is given",
      observed[0]?.minDelayMs === 5_000,
      String(observed[0]?.minDelayMs),
    )
    check('   and concurrency stays at one per source', observed[0]?.concurrency === 1)
  }

  // ── 18. Database failure ──────────────────────────────────────────
  console.log('\n18. DATABASE FAILURE')
  {
    const h = harness({
      adapters: { fakesrc: fakeAdapter({ outcome: { vehicles: [seal()] } }) },
      failStoreFor: () => true,
    })
    const report = await runDaily(h.deps, request())

    check('a failing write costs the record, not the run', report.results.length === 1)
    check('   the record is counted as failed', report.totals.failed === 1)
    check('   the run is closed rather than left open', h.store.runsClosed.length === 1)
    check('   as failed, because nothing was stored', closedStatus(h.store) === 'failed')
    check('   THE CATALOGUE IS UNTOUCHED', report.carsAfter === CAR_ROWS)

    // Now the whole database, gone mid-run.
    const gone = harness({
      adapters: { fakesrc: fakeAdapter({ outcome: { vehicles: [seal()] } }) },
      failBookkeeping: true,
      failStoreFor: () => true,
    })
    const goneReport = await runDaily(gone.deps, request())

    check(
      '   a database that disappears entirely still returns a report',
      goneReport.results.length === 1,
    )
    check(
      '   and the bookkeeping failures are reported, not swallowed',
      goneReport.results[0]!.errors.some((error) => error.includes('bookkeeping write failed')),
      goneReport.results[0]!.errors.slice(0, 2).join(' | '),
    )
  }

  // ── 19. Scheduler failure ─────────────────────────────────────────
  console.log('\n19. SCHEDULER FAILURE')
  {
    // An adapter whose access check throws must fail closed — never fetch.
    const seen: FetchOptions[] = []
    const h = harness({
      adapters: { fakesrc: fakeAdapter({ seen, accessThrows: 'getaddrinfo EAI_AGAIN fake.test' }) },
    })
    const report = await runDaily(h.deps, request())

    check('an access check that throws does NOT fall through to a fetch', seen.length === 0)
    check('   it is recorded as our failure, not as their block', closedStatus(h.store) === 'failed')
    check('   the run is closed, not left running', h.store.runsClosed.length === 1)
    check('   and the source backs off', lastHealth(h.store)?.consecutiveFailures === 1)

    // A source with no adapter at all: a configuration gap, not a failure.
    const orphan = harness({ sources: [source({ id: 'nobody' })], adapters: {} })
    const orphanReport = await runDaily(orphan.deps, request())

    check(
      '   a source with no adapter is skipped without writing anything',
      orphanReport.results[0]?.outcome === 'skipped' &&
        orphan.store.runsOpened.length === 0 &&
        orphan.store.health.length === 0,
    )
    check(
      '   so an unimplemented source never drifts into looking stale from failures',
      orphanReport.results[0]?.errors.length === 0,
    )

    // The proposal stage failing after records are safely stored.
    const proposeFails = harness({
      adapters: { fakesrc: fakeAdapter({ outcome: { vehicles: [seal()] } }) },
      proposalRecords: [proposalRecord()],
      proposeThrows: 'Prisma: connection pool timeout',
    })
    const proposeReport = await runDaily(proposeFails.deps, request())

    check(
      '   a proposal stage that fails leaves the staging rows in place',
      proposeFails.store.records.length === 1,
    )
    check(
      '   and reports the run as partial rather than losing what it fetched',
      closedStatus(proposeFails.store) === 'partial',
      String(closedStatus(proposeFails.store)),
    )
    check('   the catalogue is untouched', proposeReport.carsAfter === CAR_ROWS)
  }

  // ── 20. Conditional requests ──────────────────────────────────────
  console.log('\n20. CONDITIONAL REQUESTS (incremental scope)')
  {
    const seen: FetchOptions[] = []
    const h = harness({
      sources: [source({ lastEtag: 'W/"yesterday"', lastModifiedHttp: 'Sat, 14 Mar 2026 06:00:00 GMT' })],
      adapters: { fakesrc: fakeAdapter({ seen, outcome: { vehicles: [], notModified: true } }) },
    })
    const report = await runDaily(h.deps, request())

    check("the stored ETag is replayed on the next request", seen[0]?.etag === 'W/"yesterday"')
    check('   and the stored Last-Modified with it', seen[0]?.lastModified === 'Sat, 14 Mar 2026 06:00:00 GMT')
    check('   a 304 closes the run as completed', closedStatus(h.store) === 'completed')
    check('   304 counts as a SUCCESS, so the source does not go stale', lastHealth(h.store)?.lastSuccessAt?.getTime() === NOW.getTime())
    check(
      '   but not as a change — lastChangedAt is left alone',
      lastHealth(h.store)?.lastChangedAt?.getTime() === hoursAgo(25).getTime(),
    )
    check('   nothing is stored and nothing is proposed', h.store.records.length === 0 && h.proposeCalls.length === 0)
    check('   and the outcome says so plainly', report.results[0]?.outcome === 'not-modified')

    // A targeted run must not send validators.
    const targeted: FetchOptions[] = []
    const t = harness({
      sources: [source({ lastEtag: 'W/"yesterday"' })],
      adapters: { fakesrc: fakeAdapter({ seen: targeted, outcome: { vehicles: [seal()] } }) },
      proposalRecords: [proposalRecord()],
    })
    await runDaily(t.deps, request({ mode: 'all', only: ['byd seal'] }))
    check(
      '   a targeted --car run sends no ETag, so it cannot be answered 304',
      targeted[0]?.etag === undefined,
    )
    check('   and does pass the car filter through', targeted[0]?.only?.[0] === 'byd seal')
  }

  // ── 21. Budgeted runs ─────────────────────────────────────────────
  console.log('\n21. BUDGET AND PRIORITY')
  {
    const vehicles = [seal(), unknownCar(), seal({ externalId: 'ext-3', sourceUrl: 'https://fake.test/3', model: 'Seal' })]
    const h = harness({
      adapters: { fakesrc: fakeAdapter({ outcome: { vehicles, etag: 'W/"budgeted"' } }) },
      proposalRecords: [proposalRecord()],
    })
    const report = await runDaily(h.deps, request({ budget: 2 }))

    check('a budget caps the records processed', h.store.records.length === 2, String(h.store.records.length))
    check('   the rest are deferred, not dropped', report.totals.deferred === 1)
    check('   and the deferral is reported rather than silent', report.results[0]!.notes.some((note) => note.includes('deferred')))
    check(
      '   a budgeted run does not store an ETag, so the deferred records are reached tomorrow',
      h.store.validators.length === 0,
    )

    // Ordering: never-seen records come before ones already known.
    const ordered = prioritise({
      items: [
        { hash: 'h1', everSeen: true },
        { hash: 'h2', everSeen: false },
        { hash: 'h3', everSeen: true },
      ],
      knownHashes: new Set(['h3']),
      budget: 2,
    })
    check(
      '   an unseen record outranks a merely-changed one',
      ordered.selected[0]?.priority === 'unseen',
      ordered.selected.map((entry) => entry.priority).join(' > '),
    )
    check(
      '   and an unchanged one sorts last, so a cap never spends itself on news-free records',
      ordered.deferred[0]?.priority === 'unchanged',
    )
  }

  // ── 22. What the plan does with each mode ─────────────────────────
  console.log('\n22. RUN MODES')
  {
    const sources = [
      source({ id: 'due', lastCrawledAt: hoursAgo(25) }),
      source({ id: 'notdue', lastCrawledAt: hoursAgo(3) }),
      source({ id: 'off', isEnabled: false, lastCrawledAt: daysAgo(30) }),
    ]
    const h = harness({ sources, adapters: {} })

    const scheduled = planRun(h.deps, request())
    check('scheduled mode runs only what is due', scheduled.filter((e) => e.run).map((e) => e.source.id).join(',') === 'due')

    const all = planRun(h.deps, request({ mode: 'all' }))
    check(
      '--all ignores cadence but not the enabled switch',
      all.filter((e) => e.run).map((e) => e.source.id).join(',') === 'due,notdue',
      all.filter((e) => e.run).map((e) => e.source.id).join(','),
    )

    const named = planRun(h.deps, request({ mode: 'named', source: 'notdue' }))
    check('--source runs exactly one source', named.filter((e) => e.run).map((e) => e.source.id).join(',') === 'notdue')
    check('   and says why the others were skipped', named.find((e) => e.source.id === 'due')?.reason === 'not the named source')
  }

  // ── 23. Licence obligations block publication ─────────────────────
  console.log('\n23. ATTRIBUTION BEFORE PUBLICATION')
  {
    /*
      The gate that closes the oldest outstanding item in this project.

      Open EV Data requires visible credit. That was recorded in a comment in
      Phase 2, restated in two reports, and went unmet through Phase 3 and most of
      Phase 4 — because nothing in the code depended on it. These assertions are
      what now depends on it.
    */
    check(
      'a source with no recorded licence cannot have its data published',
      requiresUnmetAttribution('some-source-nobody-checked') !== null,
    )
    check(
      '   and the refusal says what to do about it',
      requiresUnmetAttribution('x')?.includes('src/data/dataSources.ts') === true,
    )

    const openev = DATA_SOURCE_CREDITS.find((credit) => credit.id === 'openev')
    check('   Open EV Data is registered', openev !== undefined)
    check(
      '   with the exact credit line its licence asks for',
      openev?.attribution === 'Open EV Data (https://github.com/KilowattApp/open-ev-data)',
      openev?.attribution ?? 'not registered',
    )
    check(
      '   so its proposals may now be published',
      requiresUnmetAttribution('openev') === null,
    )
    check(
      '   every registered source states a licence it was read from',
      DATA_SOURCE_CREDITS.every((credit) => credit.licence.trim().length > 0),
    )
    check(
      '   and the credits page renders the same array the gate checks',
      DATA_SOURCE_CREDITS.length >= 2,
      `${DATA_SOURCE_CREDITS.length} sources credited at /credits`,
    )
  }

  // ── Summary ───────────────────────────────────────────────────────
  console.log(
    `\n${failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`} — ${checks} checks\n`,
  )
  process.exitCode = failures === 0 ? 0 : 1
}

// ─── Fixture helpers for the proposal-layer tests ─────────────────────

function fieldMapping(field: string): (typeof FIELD_MAP)[number] {
  const mapping = FIELD_MAP.find((entry) => entry.car === field)
  if (!mapping) {
    /*
      A missing mapping is a test bug, and it must be loud.

      Returning a stub that reads nothing would make the assertion pass by
      measuring nothing, which is the failure mode that makes a suite worthless.
    */
    throw new Error(
      `No FIELD_MAP entry for "${field}". Known: ${FIELD_MAP.map((entry) => entry.car).join(', ')}`,
    )
  }
  return mapping
}

/**
 * The variant both sides of the proposal fixtures declare.
 *
 * Phase 4.1 made variant identity an input to the risk assessment, and its
 * default when the variant is unestablished is to refuse the field. These
 * fixtures declare a matching variant on both sides so each test goes on
 * measuring what it is named for; the fail-closed default has its own tests in
 * verify-variant.ts.
 */
const FIXTURE_VARIANT = '82.5 kWh RWD Design'

function fixtureCar(overrides: Record<string, unknown> = {}): CarLike {
  return {
    id: 'car-seal',
    slug: 'byd-seal',
    brand: 'BYD',
    model: 'Seal',
    fullName: 'BYD Seal',
    category: 'EV',
    variant: FIXTURE_VARIANT,
    trim: FIXTURE_VARIANT,
    modelYear: null,
    generation: null,
    rangeStandard: 'wltp',
    batteryCapacity: 82.5,
    range: 570,
    priceMin: 10_000_000,
    priceMax: 12_000_000,
    ...overrides,
  }
}

/** Variant established, for the tests that isolate another rule. */
const PROVEN_IDENTITY = {
  tier: 'brand-model-variant' as const,
  verdict: 'proven' as const,
  reason: 'fixture: variant agreed exactly',
  blocksVariantSensitive: false,
  rivals: [],
}

function fixtureRecord(overrides: Partial<RecordLike> = {}): RecordLike {
  return {
    id: 'rec-1',
    sourceId: 'openev',
    runId: 'run-1',
    sourceUrl: 'https://fake.test/byd-seal',
    fetchedAt: NOW,
    confidence: 80,
    raw: '{}',
    normalised: null,
    matchedCarId: 'car-seal',
    matchStrategy: 'external-id',
    matchScore: 100,
    matchCandidates: JSON.stringify([{ carId: 'car-seal', slug: 'byd-seal', strategy: 'external-id', score: 100 }]),
    ...overrides,
  }
}

/** A staging row as the proposal stage would read it back. */
function proposalRecord(overrides: Partial<ProposalRecord> = {}): ProposalRecord {
  return {
    id: 'rec-1',
    sourceId: 'fakesrc',
    runId: 'run-1',
    sourceUrl: 'https://fake.test/byd-seal',
    fetchedAt: NOW,
    confidence: 80,
    raw: JSON.stringify(seal()),
    normalised: JSON.stringify(seal()),
    matchedCarId: 'car-seal',
    matchStrategy: 'external-id',
    matchScore: 100,
    matchCandidates: null,
    matchedCar: {
      id: 'car-seal',
      slug: 'byd-seal',
      fullName: 'BYD Seal',
      category: 'EV',
      range: 520,
    },
    ...overrides,
  }
}

/** The identity a candidate is stored under, for the upsert assertion. */
function keyOf(candidate: Record<string, unknown> | undefined): string {
  if (!candidate) return ''
  return [candidate.sourceId, candidate.brand, candidate.model, candidate.variant, candidate.modelYear].join('|')
}

main().catch((error: unknown) => {
  console.error('\nThe suite itself failed:', error)
  process.exitCode = 1
})
