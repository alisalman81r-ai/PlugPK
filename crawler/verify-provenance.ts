// crawler/verify-provenance.ts
//
// Provenance resolution — can the audit tool be trusted about where a value
// came from?
//
// The regression this file exists for is not the byd-seal overwrite itself, which
// crawler/verify-variant.ts already covers. It is the *second* failure: the tool
// written to audit that overwrite reported "0 of 5 approved changes cannot be
// substantiated", because it read the record id stamped on each proposal and
// believed it.
//
// All five of those proposals name record `16500aa6…` — externalId `c2832ebc…`,
// the `61.4 kWh RWD Comfort` record, which holds 61.4 kWh / 370 km / 110 kW. The
// values approved were 87 kWh, 425 km and 140 kW. So the stamp is not merely
// unproven; the record it names contradicts it. Reading the variant off that
// record and comparing it to the catalogue's declared `61.4 kWh RWD Comfort`
// produced a match by construction, and the tool reported the incident as
// corroboration for the very trim whose figures had been overwritten.
//
// Fixtures and pure functions only. No database, no network, no clock: "can a
// source id masquerade as a record id?" must have the same answer whatever is in
// dev.db today.
//
// Run:  npm run crawl:verify-provenance

import {
  asRecordId,
  parseStoredValue,
  recordValueFor,
  resolveProvenance,
  vehicleFromPayload,
  type ProvenanceRecord,
} from './provenance'
import { assessIdentity, identityFromCar, identityFromSource } from './identity'

let failures = 0
let checks = 0

function check(label: string, condition: boolean, detail = '') {
  checks += 1
  if (!condition) failures += 1
  console.log(`  ${condition ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`)
}

// ─── Fixtures: the five Open EV Data Seal records, as recorded ────────
//
// Figures are the ones actually in dev.db, read from the payloads during the
// 2026-08-27 audit. They are fixtures here so the test does not depend on the
// database keeping them.

const SOURCE_IDS = ['openev', 'evdb', 'ev-database'] as const

function sealRecord(
  recordId: string,
  externalId: string,
  variant: string,
  figures: { battery: number | null; range: number | null; dc: number | null; ac: number | null },
): ProvenanceRecord {
  return {
    recordId,
    externalId,
    variant,
    vehicle: vehicleFromPayload(
      {
        brand: 'BYD',
        model: 'SEAL',
        variant,
        trim: variant,
        usableBatteryCapacityKwh: figures.battery,
        rangeKm: figures.range,
        rangeStandard: figures.range === null ? null : 'unspecified',
        dcChargingKw: figures.dc,
        acChargingKw: figures.ac,
        chargingStandards: ['Type 2', 'CCS2'],
      },
      { source: 'openev', sourceUrl: `https://example.invalid/#${externalId}`, externalId },
    ),
  }
}

/** The candidate set: every record the run matched to the one byd-seal row. */
const CANDIDATES: ProvenanceRecord[] = [
  sealRecord('rec-excellence', '1af288ad', '82.5 kWh AWD Excellence', {
    battery: 82.5, range: null, dc: 150, ac: 11,
  }),
  sealRecord('rec-design-82', 'ed282b7b', '82.5 kWh RWD Design', {
    battery: 82.5, range: null, dc: 150, ac: 11,
  }),
  sealRecord('rec-u718', '05a4162c', 'U 71.8 kWh Comfort', {
    battery: 71.8, range: 360, dc: 115, ac: 11,
  }),
  // The record every incident proposal names. 16500aa6 in dev.db.
  sealRecord('rec-comfort', 'c2832ebc', '61.4 kWh RWD Comfort', {
    battery: 61.4, range: 370, dc: 110, ac: 11,
  }),
  // The record whose figures were actually applied.
  sealRecord('rec-u87', '7085ed02', 'U 87 kWh Design', {
    battery: 87, range: 425, dc: 140, ac: 11,
  }),
]

const CATALOGUE = {
  id: 'byd-seal',
  slug: 'byd-seal',
  brand: 'BYD',
  model: 'Seal',
  variant: '61.4 kWh RWD Comfort',
  trim: '61.4 kWh RWD Comfort',
  modelYear: null,
  generation: null,
}

// ─── 1. A source id cannot masquerade as a record id ──────────────────

console.log('\n1. A source-level id cannot be used as a source-record id')

for (const sourceId of SOURCE_IDS) {
  check(
    `   asRecordId refuses the source id "${sourceId}"`,
    asRecordId(sourceId, SOURCE_IDS) === null,
  )
}
check('   and refuses it whatever the case or padding', asRecordId('  OpenEV  ', SOURCE_IDS) === null)
check('   a genuine record id is accepted', asRecordId('rec-u87', SOURCE_IDS) === 'rec-u87')
check('   null and empty are refused', asRecordId(null, SOURCE_IDS) === null && asRecordId('   ', SOURCE_IDS) === null)

{
  // The failure mode itself: a proposal carrying a source id where a record id
  // belongs must not resolve to "the first record from that source".
  const refused = asRecordId('openev', SOURCE_IDS)
  const resolution = resolveProvenance({
    field: 'batteryCapacity',
    proposedValue: '87',
    claimedRecordId: refused,
    candidates: CANDIDATES,
  })
  check(
    '   *** a source id does NOT resolve to the first record from that source ***',
    resolution.status === 'no-record-id' && resolution.claimed === null,
    `status=${resolution.status}`,
  )
  check(
    '   and it yields no trusted variant',
    resolution.trustedVariant === null && resolution.trustworthy === false,
  )
  check(
    '   while still reporting where the value can be traced to',
    resolution.attribution === 'unique' && resolution.holders[0]?.variant === 'U 87 kWh Design',
    resolution.holders.map((h) => h.variant).join(', '),
  )
}

// ─── 2. Five records from one provider stay distinguishable ───────────

console.log('\n2. Five records from the same provider remain distinguishable')

check('   the candidate set holds five records', CANDIDATES.length === 5)
check(
  '   every record has its own id',
  new Set(CANDIDATES.map((r) => r.recordId)).size === 5,
)
check(
  '   every record has its own externalId',
  new Set(CANDIDATES.map((r) => r.externalId)).size === 5,
)
check(
  '   every record states its own variant',
  new Set(CANDIDATES.map((r) => r.variant)).size === 5,
)
check(
  '   they all come from one provider, which is why a source id cannot separate them',
  new Set(CANDIDATES.map((r) => r.vehicle.source)).size === 1,
)

for (const field of ['batteryCapacity', 'range', 'dcCharging'] as const) {
  const values = CANDIDATES.map((r) => recordValueFor(field, r.vehicle))
  check(
    `   ${field} differs across the records, so a value identifies one of them`,
    new Set(values.filter((v) => v !== null)).size > 1,
    values.map((v) => v ?? '—').join(' / '),
  )
}

// ─── 3. A U 87 kWh Design value cannot be reported as the Comfort's ───

console.log('\n3. A value from "U 87 kWh Design" cannot be reported as "61.4 kWh RWD Comfort"')

const INCIDENT = [
  { field: 'batteryCapacity', proposed: '87', expected: 'U 87 kWh Design' },
  { field: 'range', proposed: '425', expected: 'U 87 kWh Design' },
  { field: 'dcCharging', proposed: '140', expected: 'U 87 kWh Design' },
] as const

for (const { field, proposed, expected } of INCIDENT) {
  // Exactly what dev.db holds: every proposal names rec-comfort.
  const resolution = resolveProvenance({
    field,
    proposedValue: proposed,
    claimedRecordId: asRecordId('rec-comfort', SOURCE_IDS),
    candidates: CANDIDATES,
  })

  console.log(`\n   ${field} ${proposed} — proposal names rec-comfort (61.4 kWh RWD Comfort)`)
  check(
    '     *** the stored provenance is REFUTED, not accepted ***',
    resolution.status === 'refuted',
    `status=${resolution.status}`,
  )
  check(
    '     no trusted variant survives a refuted claim',
    resolution.trustedVariant === null && resolution.trustworthy === false,
  )
  check(
    `     the value is attributed to ${expected}, uniquely`,
    resolution.attribution === 'unique' && resolution.holders[0]?.variant === expected,
    resolution.holders.map((h) => `${h.variant}=${h.value}`).join(', '),
  )
  check(
    '     the claimed record is still named, with what it actually holds',
    resolution.claimed?.variant === '61.4 kWh RWD Comfort' &&
      !sameish(resolution.claimed?.value, Number(proposed)),
    `claimed holds ${resolution.claimed?.value}`,
  )

  /*
    The consequence that matters. The old tool fed the claimed record's variant
    into assessIdentity and got `proven`, because that variant equals the
    catalogue's. Gating on `trustworthy` is what stops the incident being read as
    corroboration for the declared trim.
  */
  const identityWouldBeAssessed = resolution.trustworthy
  check(
    '     *** identity must NOT be assessed from a refuted claim ***',
    identityWouldBeAssessed === false,
  )

  const naive = assessIdentity({
    source: identityFromSource({
      brand: 'BYD',
      model: 'SEAL',
      variant: resolution.claimed?.variant ?? null,
      modelYear: null,
      externalId: resolution.claimed?.externalId ?? null,
    }),
    car: identityFromCar(CATALOGUE),
    competingSourceVariants: CANDIDATES.map((r) => r.variant),
  })
  check(
    '     (the old path would have said PROVEN — this is the bug, kept visible)',
    naive.verdict === 'proven',
    `naive verdict=${naive.verdict}`,
  )
}

// ─── The two fields that genuinely cannot be attributed ───────────────

console.log('\n   Fields every record agrees on cannot be traced to one record')

for (const { field, proposed } of [
  { field: 'acCharging', proposed: '11' },
  { field: 'connectors', proposed: 'Type 2, CCS2' },
] as const) {
  const resolution = resolveProvenance({
    field,
    proposedValue: proposed,
    claimedRecordId: asRecordId('rec-comfort', SOURCE_IDS),
    candidates: CANDIDATES,
  })
  check(
    `   ${field} — all five records hold it, so attribution is AMBIGUOUS`,
    resolution.attribution === 'ambiguous' && resolution.holders.length === 5,
    `${resolution.holders.length} holders`,
  )
  check(
    `   ${field} — but the named record does hold it, so the claim is confirmed`,
    resolution.status === 'confirmed' && resolution.trustedVariant === '61.4 kWh RWD Comfort',
    `status=${resolution.status}`,
  )
}

// ─── A value no record holds ──────────────────────────────────────────

{
  const resolution = resolveProvenance({
    field: 'range',
    proposedValue: '650',
    claimedRecordId: asRecordId('rec-comfort', SOURCE_IDS),
    candidates: CANDIDATES,
  })
  check(
    '   the authored 650 km matches no record at all — attribution "none"',
    resolution.attribution === 'none' && resolution.holders.length === 0,
  )
  check(
    '   and it is not silently attributed to the nearest figure',
    resolution.trustedVariant === null,
  )
}

// ─── A record that has since gone ─────────────────────────────────────

{
  const resolution = resolveProvenance({
    field: 'range',
    proposedValue: '425',
    claimedRecordId: asRecordId('rec-deleted', SOURCE_IDS),
    candidates: CANDIDATES,
  })
  check(
    '   a claim naming a record that is gone is "record-missing", not confirmed',
    resolution.status === 'record-missing' && resolution.trustworthy === false,
    `status=${resolution.status}`,
  )
}

// ─── 4. Stored-value parsing, so a text/number mismatch cannot pass ───

console.log('\n4. Stored proposal values parse back to the payload shape')

check('   "87" parses to the number 87', parseStoredValue('batteryCapacity', '87') === 87)
check('   null stays null', parseStoredValue('range', null) === null)
check('   an empty string is null, not 0', parseStoredValue('range', '   ') === null)
{
  const parsed = parseStoredValue('connectors', 'Type 2, CCS2')
  check(
    '   connectors parse to an array',
    Array.isArray(parsed) && parsed.length === 2 && parsed[0] === 'Type 2',
    JSON.stringify(parsed),
  )
}
check(
  '   unparseable text stays text, so it fails to match rather than confirming',
  parseStoredValue('range', 'about 400') === 'about 400',
)
{
  // 61.4 vs 61.44 is inside sameValue's 1% rounding tolerance, and must confirm:
  // that is the trim's own record agreeing with the catalogue, not a mismatch.
  const resolution = resolveProvenance({
    field: 'batteryCapacity',
    proposedValue: '61.44',
    claimedRecordId: asRecordId('rec-comfort', SOURCE_IDS),
    candidates: CANDIDATES,
  })
  check(
    '   61.4 confirms a proposed 61.44 — rounding, not a different vehicle',
    resolution.status === 'confirmed' && resolution.trustedVariant === '61.4 kWh RWD Comfort',
    `status=${resolution.status}`,
  )
}

// ─── 4b. One vehicle across several runs is not "ambiguous" ───────────

console.log('\n4b. A daily crawl stores one record per run, so a vehicle appears several times')

{
  /*
    What dev.db actually holds: three runs x five variants = fifteen rows. A
    figure belonging to one trim is therefore held by three *records*, and
    reporting that as ambiguous would understate what is known. Attribution by
    record and attribution by vehicle are separate answers.
  */
  const threeRuns: ProvenanceRecord[] = [
    ...CANDIDATES,
    sealRecord('rec-u87-run2', '7085ed02', 'U 87 kWh Design', {
      battery: 87, range: 425, dc: 140, ac: 11,
    }),
    sealRecord('rec-u87-run3', '7085ed02', 'U 87 kWh Design', {
      battery: 87, range: 425, dc: 140, ac: 11,
    }),
  ]

  const resolution = resolveProvenance({
    field: 'range',
    proposedValue: '425',
    claimedRecordId: asRecordId('rec-comfort', SOURCE_IDS),
    candidates: threeRuns,
  })

  check(
    '   three records hold 425, so record attribution is ambiguous',
    resolution.attribution === 'ambiguous' && resolution.holders.length === 3,
    `${resolution.holders.length} records`,
  )
  check(
    '   *** but they are one vehicle, so vehicle attribution is UNIQUE ***',
    resolution.vehicleAttribution === 'unique-vehicle',
    `holderVariants=${JSON.stringify(resolution.holderVariants)}`,
  )
  check(
    '   and that vehicle is U 87 kWh Design, not the Comfort',
    resolution.holderVariants.length === 1 && resolution.holderVariants[0] === 'U 87 kWh Design',
  )
  check(
    '   the claim is still refuted and still yields no trusted variant',
    resolution.status === 'refuted' && resolution.trustedVariant === null,
  )
  check(
    '   every holder shares one externalId, which is what makes it one vehicle',
    new Set(resolution.holders.map((h) => h.externalId)).size === 1,
  )
}

{
  // Genuinely ambiguous: several DIFFERENT variants hold the value.
  const resolution = resolveProvenance({
    field: 'acCharging',
    proposedValue: '11',
    claimedRecordId: asRecordId('rec-u87', SOURCE_IDS),
    candidates: CANDIDATES,
  })
  check(
    '   a figure five different trims share is AMBIGUOUS at vehicle level too',
    resolution.vehicleAttribution === 'ambiguous' && resolution.holderVariants.length === 5,
    `${resolution.holderVariants.length} variants`,
  )
}

// ─── 5. Phase 4.1 identity gates are untouched ────────────────────────

console.log('\n5. Phase 4.1 identity gates are unchanged by this module')

{
  const declared = identityFromCar(CATALOGUE)
  const competing = CANDIDATES.map((r) => r.variant)

  for (const record of CANDIDATES) {
    const verdict = assessIdentity({
      source: identityFromSource({
        brand: 'BYD',
        model: 'SEAL',
        variant: record.variant,
        modelYear: null,
        externalId: record.externalId,
      }),
      car: declared,
      competingSourceVariants: competing,
    }).verdict

    const shouldBeProven = record.variant === CATALOGUE.variant
    check(
      `   ${record.variant} → ${verdict}`,
      shouldBeProven ? verdict === 'proven' : verdict === 'mismatch',
    )
  }

  const undeclared = identityFromCar({ ...CATALOGUE, variant: null, trim: null })
  const against87 = assessIdentity({
    source: identityFromSource({
      brand: 'BYD', model: 'SEAL', variant: 'U 87 kWh Design', modelYear: null, externalId: '7085ed02',
    }),
    car: undeclared,
    competingSourceVariants: competing,
  })
  check(
    '   an undeclared row still refuses a variant-stating record (unproven/ambiguous)',
    against87.verdict !== 'proven' && against87.blocksVariantSensitive,
    `verdict=${against87.verdict}`,
  )
}

/** Loose equality for the "claimed holds something else" assertion. */
function sameish(a: unknown, b: unknown): boolean {
  return typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) < 0.0001 : a === b
}

// ─── Summary ──────────────────────────────────────────────────────────

console.log(`\n${failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`} — ${checks} checks\n`)
process.exitCode = failures === 0 ? 0 : 1
