// scripts/report-variant-identity.ts
//
// Which catalogue rows declare a variant, which do not, and what the model name
// suggests the split might be.
//
//   npx tsx scripts/report-variant-identity.ts
//
// ── This script proposes. It never writes ─────────────────────────────
//
// Variant currently lives inside `model` as free text — "Atto 3 Advanced", "EV9
// GT-Line", "Tiggo 7 PHEV". Splitting that into model + variant looks mechanical
// and is not: whether "Advanced" is a trim, whether "PHEV" is a trim or a
// powertrain, and whether the local car is the trim the name implies are all
// judgements about what is actually sold in this market.
//
// So this prints a suggestion and a confidence in words, and every change is made
// by a person in the car editor. A migration that guessed the split would be doing
// exactly what Phase 4.1 exists to prevent: inventing variant identity.
//
// Why it matters that the columns are filled in: until a row declares its variant,
// every variant-sensitive figure from a variant-declaring source is refused as
// unproven. That is the safe behaviour, and it is also a stalled queue. Declaring
// the variant is what turns "unproven" into either "proven" or an outright
// "mismatch" — which is the whole point.

import { isVariantSensitive } from '../crawler/identity'

import { prisma } from '../src/lib/db/client'

/**
 * Words that appear at the end of a model name and are probably a trim.
 *
 * A deliberately short, hand-checked list rather than a rule. "Advanced",
 * "Premium" and "GT-Line" are trims wherever they appear; "PHEV", "HEV", "REEV"
 * and "BEV" are powertrains that this catalogue uses to distinguish separate
 * entries, which is a different thing and is called out separately below.
 *
 * Anything not on either list is reported as "no suggestion" rather than being
 * reasoned about.
 */
const LIKELY_TRIM_WORDS = new Set([
  'advanced',
  'premium',
  'design',
  'excellence',
  'comfort',
  'flagship',
  'gt',
  'gt-line',
  'gtline',
  'ultra',
  'pro',
  'max',
  'plus',
  'luxury',
  'dynamic',
  'performance',
  'long',
  'range',
  'standard',
])

/** Suffixes this catalogue uses to separate powertrains, not trims. */
const POWERTRAIN_WORDS = new Set(['phev', 'hev', 'reev', 'bev', 'ev', 'hybrid', 'dm-i', 'dmi'])

interface Suggestion {
  kind: 'trim' | 'powertrain' | 'none'
  model: string
  variant: string | null
  note: string
}

/**
 * What the model name suggests, with the reasoning stated.
 *
 * Returns `kind: 'none'` freely. A suggestion nobody can check is worse than no
 * suggestion, because it invites a person to accept it without thinking.
 */
function suggest(model: string): Suggestion {
  const words = model.trim().split(/\s+/)
  if (words.length < 2) {
    return { kind: 'none', model, variant: null, note: 'a single word — nothing to split' }
  }

  const last = words[words.length - 1]!.toLowerCase()

  if (POWERTRAIN_WORDS.has(last)) {
    return {
      kind: 'powertrain',
      model,
      variant: null,
      note:
        `"${words[words.length - 1]}" is a powertrain, not a trim. This catalogue uses it to ` +
        `separate entries (H6 Hybrid vs H6 PHEV), which is legitimate — leave the model as it is. ` +
        `The variant column is still empty, so declare the trim if you know it.`,
    }
  }

  if (LIKELY_TRIM_WORDS.has(last)) {
    /*
      Take only the final word, and only when it is on the list.

      "Sealion 7 Advanced" gives model "Sealion 7" and variant "Advanced". Taking
      more would risk eating a model number, and the number guard in match.ts
      depends on model numbers staying with the model.
    */
    return {
      kind: 'trim',
      model: words.slice(0, -1).join(' '),
      variant: words[words.length - 1]!,
      note: 'the last word looks like a trim — confirm it is the trim sold here',
    }
  }

  return {
    kind: 'none',
    model,
    variant: null,
    note: 'no recognised trim word — set the variant by hand if this row is a specific trim',
  }
}

async function main(): Promise<number> {
  const cars = await prisma.car.findMany({
    orderBy: [{ brand: 'asc' }, { model: 'asc' }],
    select: {
      id: true,
      slug: true,
      brand: true,
      model: true,
      variant: true,
      trim: true,
      modelYear: true,
      generation: true,
      range: true,
      rangeStandard: true,
      electricRange: true,
      electricRangeStandard: true,
    },
  })

  const declared = cars.filter((car) => car.variant !== null)
  const undeclared = cars.filter((car) => car.variant === null)

  console.log('\n══ VARIANT IDENTITY ═══════════════════════════════════════════════')
  console.log(`${cars.length} cars · ${declared.length} declare a variant · ${undeclared.length} do not`)
  console.log('═══════════════════════════════════════════════════════════════════\n')

  if (declared.length > 0) {
    console.log('DECLARED — variant-sensitive figures from a matching source can be applied\n')
    for (const car of declared) {
      console.log(
        `  ${car.slug.padEnd(28)} model ${JSON.stringify(car.model).padEnd(24)} variant ${JSON.stringify(car.variant)}`,
      )
    }
    console.log('')
  }

  console.log('NOT DECLARED — variant-sensitive figures are refused as unproven\n')

  const trimCandidates: { slug: string; from: string; model: string; variant: string }[] = []

  for (const car of undeclared) {
    const suggestion = suggest(car.model)
    const marker = suggestion.kind === 'trim' ? 'SPLIT?' : suggestion.kind === 'powertrain' ? 'powertrain' : '—'

    console.log(`  ${car.slug}`)
    console.log(`    model now   ${JSON.stringify(car.model)}`)
    console.log(`    suggestion  ${marker}`)
    if (suggestion.kind === 'trim') {
      console.log(`                model ${JSON.stringify(suggestion.model)} + variant ${JSON.stringify(suggestion.variant)}`)
      trimCandidates.push({
        slug: car.slug,
        from: car.model,
        model: suggestion.model,
        variant: suggestion.variant!,
      })
    }
    console.log(`    note        ${suggestion.note}`)
    console.log('')
  }

  // ── Range cycles, the other half of the same problem ─────────────
  const missingCycle = cars.filter(
    (car) => (car.range !== null && car.rangeStandard === null) ||
      (car.electricRange !== null && car.electricRangeStandard === null),
  )

  console.log('══ RANGE TEST CYCLES ══════════════════════════════════════════════\n')
  if (missingCycle.length === 0) {
    console.log('  Every car with a range figure states its test cycle.\n')
  } else {
    console.log(
      `  ${missingCycle.length} car(s) hold a range figure with no test cycle recorded.\n` +
        '  Until a cycle is set, a range from any source is refused: two figures of\n' +
        '  unknown provenance cannot be shown to measure the same thing.\n',
    )
    for (const car of missingCycle) {
      const parts: string[] = []
      if (car.range !== null && car.rangeStandard === null) parts.push(`range ${car.range} km`)
      if (car.electricRange !== null && car.electricRangeStandard === null) {
        parts.push(`electricRange ${car.electricRange} km`)
      }
      console.log(`  ${car.slug.padEnd(28)} ${parts.join(', ')}`)
    }
    console.log('')
  }

  // ── What to do ───────────────────────────────────────────────────
  console.log('══ WHAT TO DO ═════════════════════════════════════════════════════\n')
  console.log('  Nothing is broken by leaving these blank: the pipeline refuses rather than')
  console.log('  guesses, which is the correct default. Filling them in is what lets correct')
  console.log('  figures through and turns wrong-variant records into outright mismatches.\n')
  console.log('  Priority order:\n')
  console.log('    1. Any car with pending variant-sensitive proposals — declare its variant')
  console.log('       and its range cycle, then revisit the queue.')
  console.log('    2. byd-seal, which is the row this phase was created for. The catalogue')
  console.log('       figure of 61.44 kWh matches the source variant "61.4 kWh RWD Comfort"')
  console.log('       almost exactly, which is evidence — not proof — of which trim it is.')
  console.log(`    3. The ${trimCandidates.length} row(s) marked SPLIT? above, if the suggestion is right.\n`)

  const pending = await prisma.carFieldChange.groupBy({
    by: ['carId'],
    where: { status: 'pending', variantSensitive: true },
    _count: { _all: true },
  })

  if (pending.length > 0) {
    console.log('  Cars with pending variant-sensitive proposals right now:\n')
    for (const row of pending) {
      console.log(`    ${row.carId.padEnd(28)} ${row._count._all} proposal(s)`)
    }
    console.log('')
  } else {
    console.log('  No pending variant-sensitive proposals at the moment.\n')
  }

  /*
    A sanity check on the field classification itself, printed rather than
    asserted: if a column ever moves between the model-level and variant-sensitive
    sets, this is where somebody would notice.
  */
  const sample = ['batteryCapacity', 'range', 'dcCharging', 'connectors', 'seats']
  console.log('  Field classification in force:')
  for (const field of sample) {
    console.log(`    ${field.padEnd(18)} ${isVariantSensitive(field) ? 'variant-sensitive' : 'model-level'}`)
  }
  console.log('')

  await prisma.$disconnect()
  return 0
}

main()
  .then((code) => {
    process.exitCode = code
  })
  .catch((error: unknown) => {
    console.error('\nFailed:', error)
    process.exitCode = 1
  })
