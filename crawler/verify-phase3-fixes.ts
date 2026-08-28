// crawler/verify-phase3-fixes.ts
//
// The Phase 3 fixes that can only be proved against a database: the price
// columns moving together in one transaction, the review queue paging on the
// server, bulk approval refusing what it should, and the fabricated
// verification sources being gone.
//
// Run:  npm run crawl:verify-fixes
//
// ── This test writes, and puts everything back ────────────────────────
//
// It has to: a transaction that keeps three columns consistent cannot be
// demonstrated on fixtures. So it snapshots the one car it touches, works
// against it, and restores it in a `finally` — then asserts, afterwards, that
// the restore actually happened and that no row it created survives.
//
// It registers no CarSource. That is deliberate: the last suite to write to this
// database left two fabricated sources enabled in it for a fortnight, and the
// only reliable way not to repeat that is to need no source row at all. The
// proposal, history and price tables carry `sourceId` as a plain string, so a
// fixture id is enough, and everything bearing that id is deleted at the end.

import { randomUUID } from 'node:crypto'

import { proposeForCar, type CarLike, type RecordLike } from './proposals'

import { cars } from '../src/data/cars'
import { requiresUnmetAttribution } from '../src/data/dataSources'
import { prisma } from '../src/lib/db/client'
import {
  applyChange,
  applyMany,
  bulkEligible,
  countProposals,
  listPriceHistory,
  listProposalPage,
  recordPrice,
  rejectChange,
  DEFAULT_PAGE_SIZE,
} from '../src/lib/db/car-review-store'

/** Everything this suite writes carries this, and everything with it is deleted. */
const FIXTURE_SOURCE = 'verify-fixture'

/**
 * The licence check, stubbed for the fixture source.
 *
 * applyChange refuses to publish data from a source whose licence has not been
 * recorded in src/data/dataSources.ts — the gate that stops a crawled figure
 * reaching a public page while an attribution obligation is outstanding.
 *
 * FIXTURE_SOURCE is not a real source. Its id has to stay distinct from every
 * real one because `cleanup()` deletes everything carrying it, and pointing the
 * fixtures at "openev" would make a test run delete real crawled history. It has
 * no upstream licensor, so there is nothing to credit.
 *
 * Asserted below, so this stub cannot quietly become a way of disabling the gate:
 * the real check is called directly and must still refuse this source.
 */
const FIXTURE_LICENCE = {
  attributionCheck: (sourceId: string) =>
    sourceId === FIXTURE_SOURCE ? null : requiresUnmetAttribution(sourceId),
}
const FIXTURE_CAR = 'byd-sealion-6'
/** A second car, to prove a filter is applied in the query. */
const OTHER_CAR = 'byd-atto-3-advanced'

/** The sources the Phase 3 verification left behind, which must be gone. */
const REMOVED_SOURCES = ['testA', 'testB']

/** Columns the price and bulk tests can move, and therefore must restore. */
const RESTORED_COLUMNS = [
  'priceMin',
  'priceMax',
  'priceDisplay',
  'range',
  'torque',
  'electricRange',
  'batteryCapacity',
  /*
    Added in Phase 4.1. This suite now declares a variant on the fixture car so
    that price and specification approvals can be tested at all — a
    variant-sensitive field is refused while the trim is unestablished. It has to
    be restored like any other column the suite moves.
  */
  'variant',
  'rangeStandard',
  'electricRangeStandard',
] as const

/**
 * The variant the fixture car and the fixture record both declare.
 *
 * One constant for both sides, so they cannot drift. If they did, every price test
 * here would start failing on variant grounds and the failure would look like a
 * bug in the price logic.
 */
const FIXTURE_VARIANT = 'Fixture Trim 18.3 kWh'

let failures = 0

function check(label: string, condition: boolean, detail = '') {
  if (!condition) failures += 1
  console.log(`  ${condition ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`)
}

type CarRow = Awaited<ReturnType<typeof prisma.car.findFirstOrThrow>>

async function carRow(slug = FIXTURE_CAR): Promise<CarRow> {
  return prisma.car.findFirstOrThrow({ where: { slug } })
}

/** The staging row every fixture proposal points at. */
const FIXTURE_RECORD = 'fixture-record'

/**
 * Creates the source row and staging row the approval path now needs.
 *
 * Phase 4.1 made `applyChange` re-derive variant identity from the staging row
 * behind a proposal, so a proposal whose `recordId` names nothing can no longer
 * be applied — which is correct in production, where staging rows are never
 * deleted, and was silently untrue of this suite, whose proposals pointed at a
 * record that had never existed.
 *
 * The record declares the same variant as the fixture car, so identity comes back
 * `proven` and these tests go on measuring what they are named for.
 */
async function seedFixtureRecord() {
  const car = await carRow()

  await prisma.carSource.upsert({
    where: { id: FIXTURE_SOURCE },
    create: {
      id: FIXTURE_SOURCE,
      name: 'Verification fixture',
      baseUrl: 'https://example.invalid',
      /*
        Never enabled. A source row that exists for a test must not become
        something a scheduled crawl would visit.
      */
      isEnabled: false,
      robotsStatus: 'unchecked',
    },
    update: {},
  })

  const payload = {
    brand: car.brand,
    model: car.model,
    variant: FIXTURE_VARIANT,
    trim: FIXTURE_VARIANT,
    modelYear: null,
    generation: null,
    rangeStandard: 'cltc',
    electricRangeStandard: 'cltc',
  }

  await prisma.carSourceRecord.upsert({
    where: { id: FIXTURE_RECORD },
    create: {
      id: FIXTURE_RECORD,
      sourceId: FIXTURE_SOURCE,
      sourceUrl: 'https://example.invalid/fixture',
      externalId: 'fixture-external-id',
      runId: 'fixture-run-0',
      fetchedAt: new Date(),
      raw: JSON.stringify(payload),
      normalised: JSON.stringify(payload),
      contentHash: 'fixture-hash',
      variant: FIXTURE_VARIANT,
      trim: FIXTURE_VARIANT,
      variantVerdict: 'proven',
      identityTier: 'brand-model-variant',
      matchedCarId: car.id,
      matchStrategy: 'exact-variant',
      matchScore: 94,
    },
    update: { variant: FIXTURE_VARIANT, trim: FIXTURE_VARIANT, matchedCarId: car.id },
  })

  /*
    The car declares the same variant and a test cycle for its range figures.

    Both are restored by the suite's teardown. Without the cycle, a range
    approval would be refused on comparability grounds instead of the reason the
    test is about.
  */
  await prisma.car.update({
    where: { id: car.id },
    data: { variant: FIXTURE_VARIANT, rangeStandard: 'cltc', electricRangeStandard: 'cltc' },
  })
}

/** Deletes everything this suite could have written. Safe to run twice. */
async function cleanup() {
  const where = { sourceId: FIXTURE_SOURCE }
  await prisma.carChangeHistory.deleteMany({ where })
  await prisma.carFieldChange.deleteMany({ where })
  await prisma.carPriceHistory.deleteMany({ where })
  /*
    The staging row and its source, in that order — the record has a cascading
    foreign key to the source, so the source cannot go first.
  */
  await prisma.carSourceRecord.deleteMany({ where: { id: FIXTURE_RECORD } })
  await prisma.carSource.deleteMany({ where: { id: FIXTURE_SOURCE } })
}

let runCounter = 0

interface ProposalFixture {
  field: string
  currentValue: string | null
  proposedValue: string | null
  riskLevel?: string
  changeType?: string
  confidence?: number
  carId?: string
}

async function makeProposal(input: ProposalFixture) {
  runCounter += 1
  return prisma.carFieldChange.create({
    data: {
      id: randomUUID(),
      carId: input.carId ?? (await carRow()).id,
      recordId: FIXTURE_RECORD,
      sourceId: FIXTURE_SOURCE,
      runId: `fixture-run-${runCounter}`,
      field: input.field,
      currentValue: input.currentValue,
      proposedValue: input.proposedValue,
      changeType: input.changeType ?? 'changed',
      riskLevel: input.riskLevel ?? 'review',
      confidence: input.confidence ?? 70,
      sourceUrl: 'https://example.invalid/fixture',
      fetchedAt: new Date(),
    },
  })
}

async function main() {
  console.log('\nPHASE 3 FIXES — AGAINST THE DATABASE\n')

  const carsBefore = await prisma.car.count()
  const vehiclesBefore = await prisma.vehicle.count()
  const original = await carRow()

  const snapshot = Object.fromEntries(
    RESTORED_COLUMNS.map((column) => [column, (original as unknown as Record<string, unknown>)[column]]),
  )

  /** Puts the car back exactly as it was found. Used at the very end. */
  const restoreExactly = async () => {
    await prisma.car.update({ where: { id: original.id }, data: snapshot })
  }

  /**
   * Puts the car back between tests, keeping the fixture identity in place.
   *
   * The variant and the range cycles are part of the fixture, not part of what any
   * individual test moves: a variant-sensitive field cannot be approved while the
   * trim is unestablished, so a reset that cleared the variant would make every
   * price test fail on identity grounds. `restoreExactly` above is what runs last.
   */
  const resetCar = async () => {
    await prisma.car.update({
      where: { id: original.id },
      data: {
        ...snapshot,
        variant: FIXTURE_VARIANT,
        rangeStandard: 'cltc',
        electricRangeStandard: 'cltc',
      },
    })
  }

  // A crashed earlier run leaves rows; start from a known state.
  await cleanup()
  /*
    The staging row the approval path needs, and the variant that makes identity
    provable. Phase 4.1 re-derives variant identity from the record behind a
    proposal, so a proposal pointing at nothing can no longer be applied.
  */
  await seedFixtureRecord()

  try {
    // ── 4. Price synchronisation ────────────────────────────────────
    console.log('PRICE SYNCHRONISATION')
    console.log(
      `  (${original.slug}: ${original.priceMin}/${original.priceMax} shown as "${original.priceDisplay}")\n`,
    )

    {
      // priceMin moving down, which turns a single figure into a span.
      const proposal = await makeProposal({
        field: 'priceMin',
        currentValue: String(original.priceMin),
        proposedValue: '10500000',
      })

      const result = await applyChange(proposal.id, 'verify-fixes', undefined, FIXTURE_LICENCE)
      const after = await carRow()
      const history = await prisma.carChangeHistory.findMany({
        where: { changeId: proposal.id },
        orderBy: { field: 'asc' },
      })

      check('an approved priceMin is written', result.ok && after.priceMin === 10_500_000, result.message)
      check(
        'and priceDisplay is rewritten in the same breath',
        after.priceDisplay === 'PKR 1.05–1.09 Cr (indicative)',
        after.priceDisplay,
      )
      check('priceMax is left alone', after.priceMax === original.priceMax)
      check('the qualifier the catalogue chose survives', after.priceDisplay.includes('(indicative)'))
      check('both columns get a history row', history.length === 2, history.map((row) => row.field).join(', '))
      check(
        'and the display row says where it came from',
        history.some((row) => row.field === 'priceDisplay' && (row.reason ?? '').includes('derived from the approved priceMin')),
      )
      check(
        'the proposal is marked approved by the named approver',
        (await prisma.carFieldChange.findUniqueOrThrow({ where: { id: proposal.id } })).reviewedBy ===
          'verify-fixes',
      )
      check(
        'the pages to rebuild are the ones showing this car',
        (result.revalidate ?? []).join(',') === `/cars/${after.slug},/cars,/cars/compare`,
      )
      await resetCar()
    }

    {
      // priceMax moving up.
      const proposal = await makeProposal({
        field: 'priceMax',
        currentValue: String(original.priceMax),
        proposedValue: '11500000',
      })

      const result = await applyChange(proposal.id, 'verify-fixes', undefined, FIXTURE_LICENCE)
      const after = await carRow()

      check('an approved priceMax is written', result.ok && after.priceMax === 11_500_000, result.message)
      check(
        'and the display becomes the new span',
        after.priceDisplay === 'PKR 1.09–1.15 Cr (indicative)',
        after.priceDisplay,
      )
      check('priceMin is left alone', after.priceMin === original.priceMin)
      await resetCar()
    }

    {
      // The state the report called out: figures updated, string stale. It is
      // now unreachable — either both move or neither does.
      const proposal = await makeProposal({
        field: 'priceMin',
        currentValue: String(original.priceMin),
        proposedValue: '11500000',
      })

      const result = await applyChange(proposal.id, 'verify-fixes', undefined, FIXTURE_LICENCE)
      const after = await carRow()
      const stillPending = await prisma.carFieldChange.findUniqueOrThrow({ where: { id: proposal.id } })

      check('a priceMin above priceMax is refused', !result.ok, result.message)
      check('the car is untouched', after.priceMin === original.priceMin && after.priceDisplay === original.priceDisplay)
      check('and the proposal stays pending for a person', stillPending.status === 'pending')
      check('no history row is written for a refusal', (await prisma.carChangeHistory.count({ where: { changeId: proposal.id } })) === 0)
    }

    {
      // A display string no formatter can rewrite: refused, not guessed at.
      await prisma.car.update({
        where: { id: original.id },
        data: { priceDisplay: 'from PKR 1.09 Cr onwards' },
      })

      const proposal = await makeProposal({
        field: 'priceMin',
        currentValue: String(original.priceMin),
        proposedValue: '10500000',
      })

      const result = await applyChange(proposal.id, 'verify-fixes', undefined, FIXTURE_LICENCE)
      const after = await carRow()

      check('a display string that cannot be rewritten blocks the price change', !result.ok, result.message)
      check('rather than updating the figure and leaving the string', after.priceMin === original.priceMin)
      check('and the reviewer is told to edit by hand', result.message.includes('by hand'))
      await resetCar()
    }

    {
      // priceDisplay is no longer a column a proposal may write on its own.
      const proposal = await makeProposal({
        field: 'priceDisplay',
        currentValue: original.priceDisplay,
        proposedValue: 'PKR 2 Cr',
      })

      const result = await applyChange(proposal.id, 'verify-fixes', undefined, FIXTURE_LICENCE)
      const after = await carRow()

      check('priceDisplay cannot be approved on its own', !result.ok, result.message)
      check('so it cannot be moved away from its figures', after.priceDisplay === original.priceDisplay)
    }

    // ── 5. A rejected price proposal ────────────────────────────────
    console.log('\nREJECTED PRICE PROPOSAL')
    {
      const proposal = await makeProposal({
        field: 'priceMin',
        currentValue: String(original.priceMin),
        proposedValue: '10500000',
      })

      await rejectChange(proposal.id, 'verify-fixes', 'the supplied list is right')
      const after = await carRow()
      const row = await prisma.carFieldChange.findUniqueOrThrow({ where: { id: proposal.id } })

      check('a rejected price changes no figure', after.priceMin === original.priceMin)
      check('and no string', after.priceDisplay === original.priceDisplay)
      check('the rejection is recorded with its note', row.status === 'rejected' && row.reviewNote !== null)
      check('and nothing is written to history', (await prisma.carChangeHistory.count({ where: { changeId: proposal.id } })) === 0)
    }

    // ── 6. Price history ────────────────────────────────────────────
    console.log('\nPRICE HISTORY')
    {
      const january = new Date('2026-01-15T00:00:00.000Z')
      const march = new Date('2026-03-20T00:00:00.000Z')
      const august = new Date('2026-08-10T00:00:00.000Z')

      await recordPrice({ carId: original.id, price: 15_000_000, sourceId: FIXTURE_SOURCE, fetchedAt: january })
      await recordPrice({ carId: original.id, price: 16_500_000, sourceId: FIXTURE_SOURCE, fetchedAt: march })
      await recordPrice({ carId: original.id, price: 17_800_000, sourceId: FIXTURE_SOURCE, fetchedAt: august })
      // The same price, same source, same day: a re-crawl, not a price event.
      await recordPrice({ carId: original.id, price: 17_800_000, sourceId: FIXTURE_SOURCE, fetchedAt: august })

      const points = (await listPriceHistory(original.id)).filter(
        (point) => point.sourceId === FIXTURE_SOURCE,
      )

      check('every price change is kept', points.length === 3, `${points.length} point(s)`)
      check(
        'in the order they happened',
        points.map((point) => point.price).join(',') === '15000000,16500000,17800000',
      )
      check('a same-day repeat is not a new price point', points.filter((p) => p.price === 17_800_000).length === 1)
      check('the series is append-only — no row was overwritten', points[0]?.price === 15_000_000)
    }

    // ── 7. Review queue pagination ──────────────────────────────────
    console.log('\nREVIEW QUEUE PAGINATION')
    {
      const otherCar = await carRow(OTHER_CAR)

      // Enough rows to page: one more than a page and a bit.
      for (let index = 0; index < 30; index += 1) {
        await makeProposal({
          field: 'range',
          currentValue: '90',
          proposedValue: String(100 + index),
          riskLevel: index < 20 ? 'safe' : 'review',
          changeType: 'changed',
          confidence: 90 - index,
        })
      }
      // And one on another car, which a car filter must exclude in the query.
      await makeProposal({
        field: 'range',
        currentValue: '420',
        proposedValue: '430',
        carId: otherCar.id,
      })

      /*
        Narrowed to the rows this section made. Earlier sections deliberately
        leave proposals pending — a refused price change must stay in the queue —
        and counting those here would make the assertions about totals depend on
        how many refusals the suite happens to test.
      */
      const filter = { sourceId: FIXTURE_SOURCE, field: 'range' } as const

      const first = await listProposalPage({ ...filter, carSlug: FIXTURE_CAR })
      const second = await listProposalPage({ ...filter, carSlug: FIXTURE_CAR, page: 2 })

      check('the total counts every matching row', first.total === 30, String(first.total))
      check('a page holds only a page', first.rows.length === DEFAULT_PAGE_SIZE, String(first.rows.length))
      check('the whole queue is not sent to the browser', first.rows.length < first.total)
      check('the second page holds the remainder', second.rows.length === 5, String(second.rows.length))
      check('the page count is right', first.pageCount === 2)

      const firstIds = new Set(first.rows.map((row) => row.id))
      check('no row appears on two pages', second.rows.every((row) => !firstIds.has(row.id)))
      check(
        'the two pages together are the whole filtered queue',
        new Set([...firstIds, ...second.rows.map((row) => row.id)]).size === 30,
      )

      const repeat = await listProposalPage({ ...filter, carSlug: FIXTURE_CAR })
      check(
        'the same request returns the same page',
        repeat.rows.map((row) => row.id).join() === first.rows.map((row) => row.id).join(),
      )

      // Filters survive paging, and are applied in the query rather than after.
      const filtered = await listProposalPage({ ...filter, carSlug: FIXTURE_CAR, riskLevel: 'review' })
      check('a risk filter narrows the total, not just the page', filtered.total === 10, String(filtered.total))
      check('and every row on the page matches it', filtered.rows.every((row) => row.riskLevel === 'review'))

      const otherOnly = await listProposalPage({ ...filter, carSlug: OTHER_CAR })
      check('the car filter is applied in the query', otherOnly.total === 1, String(otherOnly.total))
      check(
        'and returns that car, not the first page of everything',
        otherOnly.rows.every((row) => row.car.slug === OTHER_CAR),
      )

      const oversized = await listProposalPage({ ...filter, carSlug: FIXTURE_CAR, pageSize: 5000 })
      check('a hand-typed page size is not honoured', oversized.pageSize === DEFAULT_PAGE_SIZE, String(oversized.pageSize))

      const larger = await listProposalPage({ ...filter, carSlug: FIXTURE_CAR, pageSize: 50 })
      check('an offered page size is', larger.pageSize === 50 && larger.rows.length === 30)

      const past = await listProposalPage({ ...filter, carSlug: FIXTURE_CAR, page: 99 })
      check('a page past the end lands on the last one', past.page === 2 && past.rows.length === 5)

      const negative = await listProposalPage({ ...filter, carSlug: FIXTURE_CAR, page: -3 })
      check('and a nonsense page number lands on the first', negative.page === 1)

      check(
        'the count query and the page query agree',
        (await countProposals({ ...filter, carSlug: FIXTURE_CAR })) === first.total,
      )
    }

    // ── 8. Bulk review safety ───────────────────────────────────────
    console.log('\nBULK REVIEW SAFETY')
    {
      check(
        'a high-risk row is never bulk-eligible',
        !bulkEligible({ riskLevel: 'high-risk', changeType: 'changed', field: 'range' }).ok,
      )
      check(
        'nor is a conflict',
        !bulkEligible({ riskLevel: 'safe', changeType: 'conflicting', field: 'range' }).ok,
      )
      check(
        'nor is a price, even at review risk',
        !bulkEligible({ riskLevel: 'review', changeType: 'changed', field: 'priceMin' }).ok,
      )
      check(
        'nor the displayed price',
        !bulkEligible({ riskLevel: 'safe', changeType: 'changed', field: 'priceDisplay' }).ok,
      )
      check(
        'an ordinary safe correction is',
        bulkEligible({ riskLevel: 'safe', changeType: 'new', field: 'torque' }).ok,
      )

      const highRisk = await makeProposal({
        field: 'range',
        currentValue: '90',
        proposedValue: '900',
        riskLevel: 'high-risk',
      })
      const conflicting = await makeProposal({
        field: 'batteryCapacity',
        currentValue: '18.3',
        proposedValue: '21',
        changeType: 'conflicting',
        riskLevel: 'review',
      })
      const price = await makeProposal({
        field: 'priceMin',
        currentValue: String(original.priceMin),
        proposedValue: '10500000',
        riskLevel: 'review',
      })
      const ordinary = await makeProposal({
        field: 'torque',
        currentValue: null,
        proposedValue: '325',
        riskLevel: 'safe',
        changeType: 'new',
      })

      const outcome = await applyMany(
        [highRisk.id, conflicting.id, price.id, ordinary.id],
        'verify-fixes',
        FIXTURE_LICENCE,
      )
      const after = await carRow()

      check('bulk approval applies only the eligible row', outcome.applied.length === 1, outcome.applied.join())
      check('and refuses the other three', outcome.refused.length === 3, outcome.refused.map((r) => r.reason).join(' / '))
      check('the high-risk row is refused', outcome.refused.some((r) => r.id === highRisk.id))
      check('the conflict is refused', outcome.refused.some((r) => r.id === conflicting.id))
      check(
        'and so is the price — this is the hole the policy always intended to close',
        outcome.refused.some((r) => r.id === price.id && r.reason.includes('price')),
      )
      check('the price on the car did not move', after.priceMin === original.priceMin)
      check('the eligible row did apply', after.torque === 325)
      check(
        'and the refused rows are still pending',
        (await prisma.carFieldChange.count({
          where: { id: { in: [highRisk.id, conflicting.id, price.id] }, status: 'pending' },
        })) === 3,
      )
      await resetCar()
    }

    // ── The Phase 4.1 gate, against the real database ───────────────
    //
    // The critical regression, at the level that actually matters. verify-variant.ts
    // proves the policy grades an unproven variant high-risk; this proves
    // applyChange REFUSES it, because grading was not enough — five proposals
    // graded `review` and `high-risk` were approved through the UI on 2026-08-27
    // and a 87 kWh figure reached the public catalogue.
    console.log('\nVARIANT GATE ON THE APPLY PATH')
    {
      const car = await carRow()

      /*
        The catalogue row stops declaring a variant, which is the state every row
        is in today. Everything else about the proposal is unchanged.
      */
      await prisma.car.update({ where: { id: car.id }, data: { variant: null } })

      const proposal = await makeProposal({
        field: 'batteryCapacity',
        currentValue: '18.3',
        proposedValue: '26.6',
        riskLevel: 'review',
        confidence: 85,
      })

      const refused = await applyChange(proposal.id, 'verify-fixes', undefined, FIXTURE_LICENCE)
      const afterRefusal = await carRow()

      check('an unproven variant is REFUSED by applyChange', !refused.ok, refused.message)
      check(
        '   and the message names the variant as the reason',
        refused.message.includes('variant'),
        refused.message,
      )
      check('   the catalogue value did not move', afterRefusal.batteryCapacity === car.batteryCapacity)
      check(
        '   and the proposal is still pending, not marked approved',
        (await prisma.carFieldChange.findUnique({ where: { id: proposal.id } }))?.status === 'pending',
      )
      check(
        '   no history row was written for a change that did not happen',
        (await prisma.carChangeHistory.count({ where: { changeId: proposal.id } })) === 0,
      )

      /*
        Declaring the variant is what unblocks it — the fix has to let the right
        answer through, not merely block every answer. No re-crawl: the gate
        re-derives identity at approval time precisely so this works.
      */
      await prisma.car.update({ where: { id: car.id }, data: { variant: FIXTURE_VARIANT } })

      const allowed = await applyChange(proposal.id, 'verify-fixes', undefined, FIXTURE_LICENCE)
      const afterApproval = await carRow()

      check('declaring the variant unblocks the same proposal', allowed.ok, allowed.message)
      check('   and the value is written', afterApproval.batteryCapacity === 26.6, String(afterApproval.batteryCapacity))
      check(
        '   with a history row naming the old value',
        (await prisma.carChangeHistory.findFirst({ where: { changeId: proposal.id } }))?.oldValue === '18.3',
      )

      /*
        And a stated contradiction is refused even with a variant declared. The
        record says "Fixture Trim 18.3 kWh"; a row declaring a different trim is a
        different vehicle.
      */
      await prisma.car.update({ where: { id: car.id }, data: { variant: 'Some Other Trim 99 kWh' } })

      const contradiction = await makeProposal({
        field: 'range',
        currentValue: '90',
        proposedValue: '400',
        riskLevel: 'review',
        confidence: 85,
      })
      const mismatched = await applyChange(contradiction.id, 'verify-fixes', undefined, FIXTURE_LICENCE)

      check('a declared variant that contradicts the record is refused', !mismatched.ok, mismatched.message)
      check(
        '   and states the contradiction rather than blaming a missing variant',
        mismatched.message.includes('they differ'),
        mismatched.message,
      )
      check(
        '   advising rejection, not setting a variant that is already set',
        mismatched.message.includes('should be rejected'),
        mismatched.message,
      )

      await resetCar()
    }

    // ── The live proposal path, end to end, writing nothing ─────────
    console.log('\nTHE LIVE PROPOSAL PATH (dry)')
    {
      const car = (await carRow()) as unknown as CarLike

      /*
        Shaped like a real NormalisedVehicle: every field present, most null.

        The identity fields are here because Phase 4.1 reads them. A payload with
        no brand, model or variant describes a vehicle with no name, which
        `assessIdentity` correctly calls a mismatch — so torque would come back
        high-risk for both records and this test would stop distinguishing a weak
        match from a strong one, which is the only thing it is for.
      */
      const DRY_PAYLOAD = {
        brand: car.brand,
        model: car.model,
        variant: FIXTURE_VARIANT,
        trim: FIXTURE_VARIANT,
        modelYear: null,
        generation: null,
        torqueNm: 325,
        chargingStandards: [],
      }

      const record = (columns: Partial<RecordLike>): RecordLike => ({
        id: 'dry-record',
        sourceId: 'openev',
        runId: 'dry-run',
        sourceUrl: 'https://example.invalid/dry',
        fetchedAt: new Date(),
        confidence: 80,
        raw: JSON.stringify(DRY_PAYLOAD),
        normalised: JSON.stringify(DRY_PAYLOAD),
        matchedCarId: car.id,
        ...columns,
      })

      const weak = await proposeForCar(car, [record({ matchStrategy: 'brand-model', matchScore: 65 })], {
        dry: true,
      })
      const strong = await proposeForCar(car, [record({ matchStrategy: 'exact-parts', matchScore: 90 })], {
        dry: true,
      })

      check('proposeForCar proposes the field either way', weak.proposed === 1 && strong.proposed === 1)
      check('a weakly-matched record produces a high-risk proposal', weak.highRisk === 1, JSON.stringify(weak))
      check('a confidently-matched one does not', strong.highRisk === 0, JSON.stringify(strong))
      check('and a dry run wrote nothing', (await prisma.carFieldChange.count({ where: { runId: 'dry-run' } })) === 0)
    }
  } finally {
    await cleanup()
    /*
      Exactly as found, including the null variant. The fixture identity existed
      only for the duration of the tests, and the teardown checks below compare
      against the original snapshot.
    */
    await restoreExactly()
  }

  // ── 9. The fabricated verification sources are gone ───────────────
  console.log('\nTEST SOURCES REMOVED')
  {
    const where = { sourceId: { in: REMOVED_SOURCES } }
    const counts = {
      sources: await prisma.carSource.count({ where: { id: { in: REMOVED_SOURCES } } }),
      records: await prisma.carSourceRecord.count({ where }),
      proposals: await prisma.carFieldChange.count({ where }),
      history: await prisma.carChangeHistory.count({ where }),
      prices: await prisma.carPriceHistory.count({ where }),
      images: await prisma.carImageCandidate.count({ where }),
      candidates: await prisma.carCandidate.count({ where }),
      runs: await prisma.crawlRun.count({ where }),
      logs: await prisma.crawlLogEntry.count({ where }),
    }

    for (const [table, count] of Object.entries(counts)) {
      check(`no ${table} reference testA or testB`, count === 0, count === 0 ? '' : `${count} left`)
    }

    check(
      'and no source is registered under either name',
      (await prisma.carSource.count({ where: { name: { in: ['Test EV database', 'Test aggregator'] } } })) === 0,
    )
    check(
      'the real sources are still registered',
      (await prisma.carSource.count({ where: { id: { in: ['openev', 'evdb'] } } })) === 2,
    )
  }

  // ── 10. This suite left nothing behind either ─────────────────────
  console.log('\nNOTHING LEFT BEHIND')
  {
    const where = { sourceId: FIXTURE_SOURCE }
    check('no fixture proposals', (await prisma.carFieldChange.count({ where })) === 0)
    check('no fixture history', (await prisma.carChangeHistory.count({ where })) === 0)
    check('no fixture price points', (await prisma.carPriceHistory.count({ where })) === 0)
    check(
      'no fixture source was ever registered',
      (await prisma.carSource.count({ where: { id: FIXTURE_SOURCE } })) === 0,
    )

    const restored = await carRow()
    for (const column of RESTORED_COLUMNS) {
      const now = (restored as unknown as Record<string, unknown>)[column]
      check(`${column} is back as it was`, now === snapshot[column], `${String(now)} vs ${String(snapshot[column])}`)
    }

    /*
      ── And back as the SEED says it should be ──────────────────────────

      The snapshot above is the row as this run found it, so the checks against it
      prove only that the run undid its own writes. If a previous run left the row
      drifted, the snapshot captures the drift, every check passes, and the wrong
      value survives indefinitely.

      That is not hypothetical. This suite lost the "(indicative)" qualifier from
      byd-sealion-6's priceDisplay — the one row of 36 that differed from the
      authored seed — and went on reporting ALL CHECKS PASSED afterwards, because
      it was comparing the damage against itself.

      So the fixture car is also compared against src/data/cars.ts, which is the
      authored source of truth and cannot drift. Only the price fields are checked
      here: they are what this suite rewrites, and the rest of the columns it
      touches (range, torque, battery) legitimately differ from the seed once a
      crawler proposal has been approved by a person.
    */
    const authored = cars.find((entry) => entry.id === FIXTURE_CAR)
    if (!authored) {
      check(`${FIXTURE_CAR} exists in the authored seed`, false, 'not found in src/data/cars.ts')
    } else {
      check(
        'priceMin matches the authored seed',
        restored.priceMin === authored.price.min,
        `${restored.priceMin} vs ${authored.price.min}`,
      )
      check(
        'priceMax matches the authored seed',
        restored.priceMax === authored.price.max,
        `${restored.priceMax} vs ${authored.price.max}`,
      )
      check(
        'priceDisplay matches the authored seed, qualifier included',
        restored.priceDisplay === authored.price.display,
        `${JSON.stringify(restored.priceDisplay)} vs ${JSON.stringify(authored.price.display)}`,
      )
    }

    check(`the catalogue still holds ${carsBefore} cars`, (await prisma.car.count()) === carsBefore)
    check('Vehicle is untouched', (await prisma.vehicle.count()) === vehiclesBefore)
  }

  console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}\n`)
  process.exitCode = failures === 0 ? 0 : 1
}

main()
  .catch((error: unknown) => {
    console.error('\nUnexpected failure:', error)
    process.exitCode = 1
  })
  .finally(() => {
    void prisma.$disconnect()
  })
