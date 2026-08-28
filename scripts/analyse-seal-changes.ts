// scripts/analyse-seal-changes.ts
//
// The report Phase 4.1 item 9 asks for: what the five approved BYD Seal changes
// actually were, which variant each figure came from, and whether that variant can
// be proven to be the one the catalogue row describes.
//
//   npx tsx scripts/analyse-seal-changes.ts
//   npx tsx scripts/analyse-seal-changes.ts --car byd-seal
//   npx tsx scripts/analyse-seal-changes.ts --mark-review
//
// ── This script does not revert anything ──────────────────────────────
//
// Five approvals were made by a person. Undoing them is a decision about the
// catalogue, not a cleanup task, and it is not this script's to take. What it does
// is assemble the evidence needed to make that decision, and — with --mark-review
// — annotate the proposal rows so the finding is recorded in the database rather
// than only in a terminal somebody has closed.
//
// Nothing here writes to Car. Nothing deletes. CarChangeHistory is read only.

import { assessIdentity, identityFromCar, identityFromSource, isVariantSensitive } from '../crawler/identity'
import { sameValue } from '../crawler/compare'
import {
  asRecordId,
  parseStoredValue,
  resolveProvenance,
  vehicleFromPayload,
  type ProvenanceRecord,
  type ProvenanceResolution,
} from '../crawler/provenance'
import { compareStandards, toRangeStandard } from '../crawler/range-standard'

import { prisma } from '../src/lib/db/client'

interface Args {
  car: string
  markReview: boolean
}

function parseArgs(argv: string[]): Args {
  const carFlag = argv.indexOf('--car')
  return {
    car: carFlag >= 0 ? (argv[carFlag + 1] ?? 'byd-seal') : 'byd-seal',
    /*
      Off by default. Writing a review note to an approved proposal is a small
      change and still a change, and a report should be readable without making
      one.
    */
    markReview: argv.includes('--mark-review'),
  }
}

const line = (char = '─') => char.repeat(78)

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2))

  const car = await prisma.car.findUnique({ where: { id: args.car } })
  if (!car) {
    console.error(`No car with id "${args.car}".`)
    return 1
  }

  const changes = await prisma.carFieldChange.findMany({
    where: { carId: car.id, status: 'approved' },
    orderBy: { reviewedAt: 'asc' },
  })

  console.log(`\n${line('═')}`)
  console.log(`APPROVED CRAWLER CHANGES — ${car.fullName} (${car.slug})`)
  console.log(line('═'))

  console.log(`\nThe catalogue row as it stands now`)
  console.log(`  model            ${JSON.stringify(car.model)}`)
  console.log(`  variant          ${car.variant === null ? 'NOT DECLARED' : JSON.stringify(car.variant)}`)
  console.log(`  modelYear        ${car.modelYear ?? 'unknown'}`)
  console.log(`  generation       ${car.generation ?? 'unknown'}`)
  console.log(`  batteryCapacity  ${car.batteryCapacity ?? '—'} kWh`)
  console.log(
    `  range            ${car.range ?? '—'} km (${toRangeStandard(car.rangeStandard).toUpperCase()})`,
  )
  console.log(`  dcCharging       ${car.dcCharging ?? '—'} kW`)
  console.log(`  acCharging       ${car.acCharging ?? '—'} kW`)

  if (changes.length === 0) {
    console.log('\nNo approved crawler changes on this car.\n')
    await prisma.$disconnect()
    return 0
  }

  /*
    Every source id the system knows, so asRecordId can refuse one.

    Read from CarSource rather than hardcoded: the check has to know what a source
    id looks like in *this* database, and a list in this file would go stale the
    first time a source was added.
  */
  const sourceIds = (await prisma.carSource.findMany({ select: { id: true } })).map((row) => row.id)

  /*
    The candidate set: every staging row the crawler matched to this car.

    Assembled once. This is what a stored record id is checked against — and,
    when the check fails, what is searched for the record that actually holds the
    value. Both need the same enumerable set, and it does not change per field.
  */
  const candidateRows = await prisma.carSourceRecord.findMany({
    where: { matchedCarId: car.id },
    select: { id: true, externalId: true, variant: true, sourceId: true, sourceUrl: true, normalised: true, raw: true, modelYear: true },
  })

  const candidates: ProvenanceRecord[] = candidateRows.map((row) => {
    let payload: unknown = null
    try {
      payload = JSON.parse(row.normalised ?? row.raw)
    } catch {
      payload = null
    }
    const vehicle = vehicleFromPayload(payload, {
      source: row.sourceId,
      sourceUrl: row.sourceUrl,
      externalId: row.externalId,
    })
    return {
      recordId: row.id,
      externalId: row.externalId,
      /*
        The payload's variant is preferred over the column.

        These rows predate the Phase 4.1 columns, so `variant` is null on every
        one of them while the payload has carried the variant since the first
        crawl. That asymmetry is why the incident was invisible: the data was
        there and nothing read it.
      */
      variant: (vehicle.variant as string | null) ?? row.variant ?? null,
      vehicle,
    }
  })

  console.log(`
  ${candidates.length} staging record(s) matched to this car:`)
  for (const candidate of candidates) {
    console.log(
      `    ${candidate.recordId.slice(0, 8)}  ${String(candidate.externalId ?? '—').slice(0, 8)}  ${candidate.variant ?? '(no variant stated)'}`,
    )
  }

  const verdicts: {
    field: string
    verdict: string
    reason: string
    provenance: ProvenanceResolution
  }[] = []

  for (const change of changes) {
    console.log(`\n${line()}`)
    console.log(`FIELD: ${change.field}`)
    console.log(line())

    const history = await prisma.carChangeHistory.findFirst({
      where: { carId: car.id, changeId: change.id },
    })

    /*
      ── Provenance, checked rather than trusted ────────────────────

      The record id on the proposal is a claim. resolveProvenance confirms it by
      asking whether that record actually holds the value that was proposed, and
      refutes it when it does not.

      This replaces reading `record.variant` off whatever id the proposal
      happened to carry. That is what made this tool report "0 of 5 approved
      changes cannot be substantiated" about the byd-seal incident: all five
      proposals name the `61.4 kWh RWD Comfort` record — which holds 61.4 kWh,
      370 km and 110 kW — while the values approved were 87 kWh, 425 km and
      140 kW. Reading the variant off that record and comparing it to the
      catalogue's declared `61.4 kWh RWD Comfort` matched by construction, so the
      incident was reported as corroboration for the trim it had overwritten.
    */
    const provenance = resolveProvenance({
      field: change.field,
      proposedValue: change.proposedValue,
      claimedRecordId: asRecordId(change.recordId, sourceIds),
      candidates,
    })

    const record = candidates.find((candidate) => candidate.recordId === provenance.claimed?.recordId)
    const sourceRangeStandard = (record?.vehicle.rangeStandard as string | null) ?? null
    const sourceModelYear = (record?.vehicle.modelYear as number | null) ?? null

    /*
      The live value is read from the Car row loaded at the top of this run, not
      from the history row.

      It used to print `history.newValue` under the heading "LIVE NOW", which is
      the value the approval *set* — true when it was written and wrong the moment
      anything changed it. On byd-seal it showed 87 kWh as live while the row held
      61.44, because the row was corrected on 2026-08-27. Every column below now
      says which of the three it is: what the row held before, what the approval
      set, and what the row holds now.
    */
    const liveValue = (car as unknown as Record<string, unknown>)[change.field] ?? null
    const approvedValue = history?.newValue ?? change.proposedValue ?? null
    /*
      Both sides parsed the same way.

      Comparing the live value raw against the parsed proposal made `connectors`
      read as superseded when it was not: Car stores "Type 2, CCS2" as text while
      the proposal parses to an array, and sameValue has no rule for string vs
      array so it fell through to `===`. Putting both through parseStoredValue
      makes the comparison shape-for-shape.
    */
    const stillLive = sameValue(
      parseStoredValue(change.field, liveValue === null ? null : String(liveValue)),
      parseStoredValue(change.field, approvedValue),
    )

    console.log(`  value before approval  ${history?.oldValue ?? change.currentValue ?? '—'}`)
    console.log(`  value the approval set ${approvedValue ?? '—'}`)
    console.log(`  value in the DB NOW    ${liveValue ?? '—'}   ${stillLive ? '(the approval is still live)' : '(SUPERSEDED since)'}`)
    console.log(`  source (provider)      ${change.sourceId}`)
    console.log(`  source URL on record   ${change.sourceUrl}`)
    console.log(`
  ── provenance ──`)
    console.log(`  record id claimed      ${change.recordId}`)
    console.log(`  record externalId      ${provenance.claimed?.externalId ?? '—'}`)
    console.log(`  that record's variant  ${provenance.claimed?.variant === undefined || provenance.claimed?.variant === null ? 'NOT PUBLISHED' : JSON.stringify(provenance.claimed.variant)}`)
    console.log(`  that record's value    ${describeValue(provenance.claimed?.value)}`)
    console.log(`  claim status           ${provenance.status.toUpperCase()}`)
    console.log(`  reason                 ${provenance.reason}`)
    console.log(`  value attributable to  ${describeAttribution(provenance)}`)
    console.log(`  catalogue variant      ${car.variant === null ? 'NOT DECLARED' : JSON.stringify(car.variant)}`)
    console.log(`
  approved at            ${change.reviewedAt?.toISOString() ?? '—'}`)
    console.log(`  approved by            ${change.reviewedBy ?? '—'}`)
    console.log(`  history record         ${history ? history.id : 'MISSING'}`)
    console.log(`  risk at approval       ${change.riskLevel} (confidence ${change.confidence})`)
    console.log(`  change type            ${change.changeType}`)

    // ── Can the variant be proven? ─────────────────────────────────
    const variantSensitive = isVariantSensitive(change.field)

    if (!variantSensitive) {
      console.log(`\n  VERDICT: model-level field — variant identity is not required.`)
      verdicts.push({
        field: change.field,
        verdict: 'OK (model-level)',
        reason: 'not a variant-level figure',
        provenance,
      })
      continue
    }

    /*
      The gate. Identity is assessed only from a CONFIRMED claim.

      Before this, a refuted claim still reached assessIdentity carrying the
      claimed record's variant — and assessIdentity, correctly given what it
      was handed, returned `proven`. The defect was never in the identity rules;
      it was in feeding them a variant that did not belong to the figure.
      Nothing here loosens Phase 4.1. It stops lying to it.
    */
    if (!provenance.trustworthy) {
      console.log(
        `
  VERDICT: PROVENANCE UNVERIFIED — the origin of this figure is not established, so it can neither be substantiated nor treated as corroboration for the catalogue's declared variant.`,
      )
      if (provenance.vehicleAttribution === 'unique-vehicle') {
        const holder = provenance.holders[0]
        const differs = holder?.variant !== provenance.claimed?.variant
        console.log(
          `           The value IS traceable, by value, to externalId ${holder?.externalId ?? '—'} — variant ${JSON.stringify(holder?.variant)}` +
            `${provenance.holders.length > 1 ? ` (${provenance.holders.length} rows across runs)` : ''}` +
            `${differs ? ', a DIFFERENT vehicle from the one the proposal names.' : '.'}`,
        )
      }
      verdicts.push({
        field: change.field,
        verdict: 'PROVENANCE UNVERIFIED',
        reason: provenance.reason,
        provenance,
      })
      continue
    }

    if (!record) {
      console.log(`\n  VERDICT: REVIEW REQUIRED — the source record is gone, so nothing can be proven.`)
      verdicts.push({
        field: change.field,
        verdict: 'REVIEW REQUIRED',
        reason: 'source record no longer available',
        provenance,
      })
      continue
    }

    const siblings = await prisma.car.findMany({
      where: { brand: car.brand, model: car.model, id: { not: car.id } },
      select: { slug: true, brand: true, model: true, variant: true, trim: true, modelYear: true, generation: true },
    })

    /*
      Every other variant the same source published that also matches this row.

      This is what makes the finding conclusive rather than suggestive: it is not
      that the variant is merely unstated, it is that five different vehicles were
      all claiming this one row.
    */
    const competing = [...new Set(candidates.map((candidate) => candidate.variant))]

    const identity = assessIdentity({
      source: identityFromSource({
        /*
          Brand and model come from the payload: CarSourceRecord has no columns for
          them, and never needed any — the payload has always carried them.
        */
        brand: (record.vehicle.brand as string | null) ?? null,
        model: (record.vehicle.model as string | null) ?? null,
        // Reached only when provenance.trustworthy is true, so this variant
        // belongs to the record that actually holds the value.
        variant: provenance.trustedVariant,
        modelYear: sourceModelYear,
        externalId: record.externalId,
      }),
      car: identityFromCar(car),
      siblings: siblings.map(identityFromCar),
      competingSourceVariants: competing,
    })

    console.log(`\n  variant identity       ${identity.verdict.toUpperCase()} (tier ${identity.tier})`)
    console.log(`  reason                 ${identity.reason}`)

    if (competing.length > 1) {
      console.log(`\n  Variants of this model the source published, all matching this one row:`)
      for (const variant of competing) {
        const marker = variant === provenance.trustedVariant ? ' <- the one that was applied' : ''
        console.log(`    ${variant === null ? '(none stated)' : variant}${marker}`)
      }
    }

    // ── Range cycles ───────────────────────────────────────────────
    if (change.field === 'range' || change.field === 'electricRange') {
      const comparability = compareStandards(
        toRangeStandard(change.currentRangeStandard ?? car.rangeStandard),
        toRangeStandard(sourceRangeStandard),
      )
      console.log(`\n  range cycles           ${comparability.comparable ? 'comparable' : 'NOT COMPARABLE'}`)
      console.log(`  reason                 ${comparability.reason}`)
    }

    const proven = !identity.blocksVariantSensitive
    console.log(
      `\n  VERDICT: ${proven ? 'variant proven — the figure belongs to this car' : 'REVIEW REQUIRED — it cannot be proven that this figure describes this car'}`,
    )

    verdicts.push({
      field: change.field,
      verdict: proven ? 'OK (variant proven)' : 'REVIEW REQUIRED',
      reason: identity.reason,
      provenance,
    })

    if (args.markReview && !proven) {
      /*
        The note is appended to the existing one, never replacing it, and the
        status stays `approved`.

        Rewriting an approval to `pending` would erase the fact that a person
        approved it, which is exactly the kind of history this system exists to
        keep. What is recorded is a second fact: that the approval could not be
        substantiated afterwards. Both are true and both belong.
      */
      const existing = await prisma.carFieldChange.findUnique({
        where: { id: change.id },
        select: { reviewNote: true },
      })
      const note =
        `${existing?.reviewNote ? `${existing.reviewNote} | ` : ''}` +
        `PHASE 4.1 REVIEW REQUIRED: variant ${identity.verdict} — ${identity.reason}`

      await prisma.carFieldChange.update({
        where: { id: change.id },
        data: { reviewNote: note },
      })
      console.log(`  (review note recorded on the proposal row)`)
    }
  }

  // ── Summary ──────────────────────────────────────────────────────
  console.log(`\n${line('═')}`)
  console.log('SUMMARY')
  console.log(line('═'))

  for (const v of verdicts) {
    console.log(
      `  ${v.field.padEnd(18)} ${v.verdict.padEnd(24)} ${describeAttribution(v.provenance)}`,
    )
  }

  /*
    Both failing verdicts count.

    This filtered on 'REVIEW REQUIRED' alone, so when the provenance gate started
    returning 'PROVENANCE UNVERIFIED' the tally kept reporting "0 of 5 cannot be
    substantiated" — the same false all-clear in a different place. A verdict
    is a pass only if it is explicitly one of the two OK verdicts; anything else
    counts against, including a verdict added later.
  */
  const PASSING = new Set(['OK (variant proven)', 'OK (model-level)'])
  const needsReview = verdicts.filter((v) => !PASSING.has(v.verdict))

  const unverified = needsReview.filter((v) => v.verdict === 'PROVENANCE UNVERIFIED')
  if (unverified.length > 0) {
    console.log(
      `
  ${unverified.length} change(s) have UNVERIFIABLE PROVENANCE: the record each proposal`,
    )
    console.log(`  names does not hold the value that was approved. These rows were written`)
    console.log(`  before crawler/compare.ts carried winnerRecordId, so their record id is the`)
    console.log(`  first record from the source rather than the one whose value won. They`)
    console.log(`  cannot be read as corroboration for this row's declared variant, in either`)
    console.log(`  direction.`)
  }
  console.log(
    `\n  ${needsReview.length} of ${verdicts.length} approved change(s) cannot be substantiated.`,
  )

  if (needsReview.length > 0) {
    console.log(`\n  Nothing has been reverted. To act on this:`)
    console.log(`    1. Decide which variant this catalogue row describes.`)
    console.log(`    2. Set it in the car editor — that alone makes the matcher strict,`)
    console.log(`       and turns the wrong-variant records into outright mismatches.`)
    console.log(`    3. Restore any figure that belonged to another variant. The old values`)
    console.log(`       are in CarChangeHistory and are printed above.`)
  }

  if (!args.markReview && needsReview.length > 0) {
    console.log(`\n  Re-run with --mark-review to record these findings on the proposal rows.`)
  }

  console.log(`\n  Car table not written by this script: ${await prisma.car.count()} rows\n`)

  await prisma.$disconnect()
  return 0
}

/** A record's value, rendered for a report line. */
function describeValue(value: unknown): string {
  if (value === null || value === undefined) return 'nothing published'
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}

/**
 * Where a value can be traced to, and how firmly.
 *
 * Deliberately never says "proven". Attribution answers "which record holds
 * this"; identity answers "may it be applied to this car". The defect this tool
 * now guards against came from treating the first as the second.
 */
function describeAttribution(p: ProvenanceResolution): string {
  if (p.status === 'confirmed') {
    return `${p.claimed?.variant ?? '(no variant stated)'} (claim confirmed)`
  }
  if (p.vehicleAttribution === 'unique-vehicle') {
    const variant = p.holderVariants[0] ?? '(no variant stated)'
    const rows = p.holders.length > 1 ? `, in ${p.holders.length} rows across runs` : ''
    return `${variant}${rows} (by value — NOT the record claimed)`
  }
  if (p.vehicleAttribution === 'ambiguous') {
    return `${p.holderVariants.length} different variants hold this value — not traceable to one vehicle`
  }
  if (p.vehicleAttribution === 'none') return 'no record holds this value'
  return 'not comparable'
}

main()
  .then((code) => {
    process.exitCode = code
  })
  .catch((error: unknown) => {
    console.error('\nFailed:', error)
    process.exitCode = 1
  })
