// scripts/declare-variant-identity.ts
//
// Controlled variant-identity declarations and figure corrections.
//
//   npx tsx scripts/declare-variant-identity.ts                     # dry run
//   npx tsx scripts/declare-variant-identity.ts --apply
//   npx tsx scripts/declare-variant-identity.ts --only byd-seal --apply
//
// ── Why the plan is in the file rather than behind flags ──────────────
//
// This is a data correction, so what matters is that the change is reviewable
// before it happens and readable afterwards. A flag-driven CLI would let anybody
// type any value into the column that governs which crawled figures may reach a
// public page, and would leave no record of the reasoning. A plan in source is
// diffable, has the evidence beside each value, and re-runs to a no-op.
//
// Every entry cites its evidence. Where there is no evidence, the field is absent
// — not filled with a plausible default. That distinction is the whole of Phase
// 4.1: `range` is corrected here and `rangeStandard` is not, because the
// catalogue's authored data has no test-cycle field and every source record says
// `unspecified`.
//
// Writes through src/lib/db/car-identity-store.ts, which is transactional and
// leaves one CarChangeHistory row per changed field. Nothing here touches the
// crawler, the matcher, or the approval gate.

import { declareCarIdentity, type IdentityDeclaration } from '../src/lib/db/car-identity-store'
import { prisma } from '../src/lib/db/client'

interface PlanEntry extends IdentityDeclaration {
  /** Printed above the change, so a reviewer sees the case before the diff. */
  evidence: string[]
  /** Stated explicitly, so an omission reads as a decision rather than a gap. */
  deliberatelyUnset?: string[]
  /**
   * Reviewed, understood, and deliberately not applied yet.
   *
   * A held entry is skipped by `--apply` and needs `--include-held` as well. The
   * alternative — deleting it — would throw away the evidence someone assembled;
   * leaving it ungated would mean the next bare `--apply` silently did a thing
   * that had been decided against.
   *
   * The string is the reason, and it is printed.
   */
  held?: string
}

const DECLARED_BY = 'admin'

const PLAN: PlanEntry[] = [
  // ── byd-seal ───────────────────────────────────────────────────────
  {
    carId: 'byd-seal',
    variant: '61.4 kWh RWD Comfort',
    trim: '61.4 kWh RWD Comfort',
    corrections: {
      batteryCapacity: 61.44,
      range: 650,
      dcCharging: 110,
    },
    reason:
      'Phase 4.1 correction: declaring the trim this row describes, and restoring the two ' +
      'figures that a wrong-variant crawler record overwrote on 2026-08-27. dcCharging set from ' +
      'the source record for this trim, replacing a figure taken from a different variant.',
    declaredBy: DECLARED_BY,
    sourceId: 'openev',
    sourceUrl:
      'https://github.com/KilowattApp/open-ev-data#c2832ebc-649e-47e6-b835-32413c05d260',
    evidence: [
      'variant "61.4 kWh RWD Comfort": the authored catalogue (src/data/cars.ts:522, one of the',
      '  first 28 rows, from a supplied price list whose "figures are exact") states 61.44 kWh.',
      '  Open EV Data publishes five Seal variants; the only one within 0.04 kWh is',
      '  "61.4 kWh RWD Comfort" (record c2832ebc). The others are 71.8, 82.5, 82.5 and 87 kWh.',
      '  This is strong circumstantial evidence, not proof — see the report.',
      'batteryCapacity 61.44: src/data/cars.ts:522, and CarChangeHistory oldValue for the',
      '  2026-08-27 09:35 change (changeId cdb916ec).',
      'range 650: src/data/cars.ts:524, and CarChangeHistory oldValue (changeId 838f7d7a).',
      'dcCharging 110: record c2832ebc for this trim. The authored catalogue never held a DC',
      '  figure (null — the price list did not state one). The live 140 kW came from record',
      '  7085ed02, variant "U 87 kWh Design", which is a different vehicle.',
    ],
    deliberatelyUnset: [
      'rangeStandard: NO EVIDENCE. The authored data has no test-cycle field at all, and every',
      '  Open EV Data record for this car reports rangeStandard null or "unspecified". Left null.',
      '  Consequence: range proposals stay refused as incomparable, which is correct.',
      'modelYear: the source record for this trim says 2025, but that is the dataset\'s release',
      '  year for the variant, not evidence of what the Pakistani catalogue row describes.',
      '  The authored row states no year. Left null.',
      'acCharging: left at the live 11 kW. All five variants publish 11, so it does not depend',
      '  on the trim, and reverting a correct figure to null would lose information.',
      'connectors: left at "Type 2, CCS2". Same set as the authored "CCS2,Type 2" in a different',
      '  order — a cosmetic difference, not a data error.',
    ],
  },

  // ── byd-sealion-6: repairing damage the test suite caused ──────────
  //
  // Not a variant declaration. `verify-phase3-fixes.ts` uses this row as its
  // price fixture, and its "(indicative)" qualifier was lost during one of
  // today's runs — the only row of 36 that differs from the authored seed.
  //
  // The suite's teardown compares the row against a snapshot taken at the START
  // of the run, so once the value drifted the check kept passing while the data
  // stayed wrong. The suite is hardened separately to compare against the
  // authored seed instead.
  {
    carId: 'byd-sealion-6',
    priceDisplay: 'PKR 1.09 Cr (indicative)',
    expectPriceMin: 10_900_000,
    expectPriceMax: 10_900_000,
    reason:
      'Restoring the "(indicative)" price qualifier lost by verify-phase3-fixes.ts. The figures ' +
      'themselves were never wrong; only the display string drifted.',
    declaredBy: DECLARED_BY,
    evidence: [
      'src/data/cars.ts:1190 authors price.display as "PKR 1.09 Cr (indicative)".',
      'The live row reads "PKR 1.09 Cr" — the qualifier is missing.',
      'priceMin and priceMax are both 10,900,000, matching crore(1.09) in the seed, so the',
      '  figures are correct and only the string drifted. The repair is guarded on those two',
      '  numbers so a display can never be set to something they contradict.',
      'It is the ONLY row of 36 whose priceDisplay differs from the seed, and it is the fixture',
      '  car verify-phase3-fixes.ts writes to — which is where the loss came from.',
      'The qualifier is load-bearing: docs and the seed header state it travels with the number',
      '  to every surface so the caveat is never dropped into a footnote.',
    ],
    deliberatelyUnset: [
      'variant/trim: NOT declared. There is no evidence of which Sealion 6 trim this row is,',
      '  and this entry exists to repair a string, not to assert an identity.',
    ],
  },

  // ── The three rows carrying a trim inside the model name ───────────
  //
  // Each moves the trailing trim word out of `model` into `variant`. Both fields
  // move together: a row whose model still read "Atto 3 Advanced" while its
  // variant read "Advanced" would fail to match a source publishing model
  // "Atto 3" + variant "Advanced", which is the pairing this is for.
  //
  // `fullName` is left alone deliberately — "BYD Atto 3 Advanced" remains the
  // correct full name of the car, and it is what the matcher's exact-name tier
  // compares against.
  {
    carId: 'byd-atto-3-advanced',
    held:
      'On hold by decision, 2026-08-27. The split is correct as data, but `Car.model` is the '
      + 'public h1 on the detail page, the breadcrumb and the card title — so moving the trim '
      + 'out of it would drop "Advanced" / "GT-Line" from those surfaces unless the display '
      + 'components render the variant alongside the model. Apply together with that change, '
      + 'or accept the shorter titles knowingly.',
    model: 'Atto 3',
    variant: 'Advanced',
    trim: 'Advanced',
    reason:
      'Phase 4.1: moving the trim out of the model name into the variant column, so a source ' +
      'naming a different Atto 3 trim can be recognised as a mismatch rather than a match.',
    declaredBy: DECLARED_BY,
    evidence: [
      'model "Atto 3 Advanced" and slug "byd-atto-3-advanced" both carry the trailing trim word.',
      '  "Advanced" is a published BYD trim designation, and the catalogue separately holds',
      '  byd-atto-2 as model "Atto 2" — so the last word here is qualifying the trim, not part',
      '  of the model name. Authored row 4 of the first 28 (supplied price list).',
      'No source records and no proposals exist for this car, so the split cannot disturb',
      '  anything in flight.',
    ],
    deliberatelyUnset: [
      'fullName: unchanged at "BYD Atto 3 Advanced" — still the correct full name.',
      'modelYear, generation, rangeStandard: no evidence. Left null.',
    ],
  },
  {
    carId: 'byd-sealion-7-advanced',
    held:
      'On hold by decision, 2026-08-27. The split is correct as data, but `Car.model` is the '
      + 'public h1 on the detail page, the breadcrumb and the card title — so moving the trim '
      + 'out of it would drop "Advanced" / "GT-Line" from those surfaces unless the display '
      + 'components render the variant alongside the model. Apply together with that change, '
      + 'or accept the shorter titles knowingly.',
    model: 'Sealion 7',
    variant: 'Advanced',
    trim: 'Advanced',
    reason:
      'Phase 4.1: moving the trim out of the model name into the variant column, so a source ' +
      'naming a different Sealion 7 trim can be recognised as a mismatch rather than a match.',
    declaredBy: DECLARED_BY,
    evidence: [
      'model "Sealion 7 Advanced", slug "byd-sealion-7-advanced". Same pattern as the Atto 3,',
      '  and the catalogue separately holds byd-sealion-6 as model "Sealion 6". Authored row 15.',
      'The model-number guard in match.ts keeps Sealion 6 and Sealion 7 apart independently of',
      '  this, so the split does not weaken that protection.',
      'No source records and no proposals exist for this car.',
    ],
    deliberatelyUnset: [
      'fullName: unchanged at "BYD Sealion 7 Advanced".',
      'modelYear, generation, rangeStandard: no evidence. Left null.',
    ],
  },
  {
    carId: 'kia-ev9-gt-line',
    held:
      'On hold by decision, 2026-08-27. The split is correct as data, but `Car.model` is the '
      + 'public h1 on the detail page, the breadcrumb and the card title — so moving the trim '
      + 'out of it would drop "Advanced" / "GT-Line" from those surfaces unless the display '
      + 'components render the variant alongside the model. Apply together with that change, '
      + 'or accept the shorter titles knowingly.',
    model: 'EV9',
    variant: 'GT-Line',
    trim: 'GT-Line',
    reason:
      'Phase 4.1: moving the trim out of the model name into the variant column, so a source ' +
      'naming a different EV9 trim can be recognised as a mismatch rather than a match.',
    declaredBy: DECLARED_BY,
    evidence: [
      'model "EV9 GT-Line", slug "kia-ev9-gt-line". "GT-Line" is a published Kia trim name used',
      '  across their range, not part of the model designation. Authored row 18.',
      'The catalogue holds kia-ev5 as model "EV5", so "EV9" as a model is consistent with how',
      '  the rest of the Kia rows are named.',
      'No source records and no proposals exist for this car.',
    ],
    deliberatelyUnset: [
      'fullName: unchanged at "KIA EV9 GT-Line".',
      'modelYear, generation, rangeStandard: no evidence. Left null.',
    ],
  },
]

interface Args {
  apply: boolean
  only: string | null
  includeHeld: boolean
}

function parseArgs(argv: string[]): Args {
  const onlyFlag = argv.indexOf('--only')
  return {
    /*
      Dry by default. Declaring a variant decides which source records may ever
      write to a row; it should not happen because somebody ran a file to see
      what it did.
    */
    apply: argv.includes('--apply'),
    only: onlyFlag >= 0 ? (argv[onlyFlag + 1] ?? null) : null,
    includeHeld: argv.includes('--include-held'),
  }
}

const rule = (char = '─') => char.repeat(78)

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2))
  const entries = args.only ? PLAN.filter((entry) => entry.carId === args.only) : PLAN

  if (entries.length === 0) {
    console.error(`No plan entry for "${args.only}". Known: ${PLAN.map((e) => e.carId).join(', ')}`)
    return 1
  }

  console.log(`\n${rule('═')}`)
  console.log(`VARIANT IDENTITY DECLARATIONS — ${args.apply ? 'APPLYING' : 'DRY RUN'}`)
  console.log(rule('═'))

  const carsBefore = await prisma.car.count()
  const historyBefore = await prisma.carChangeHistory.count()

  let applied = 0
  let refused = 0
  let held = 0
  let unchanged = 0

  for (const entry of entries) {
    const car = await prisma.car.findUnique({ where: { id: entry.carId } })
    if (!car) {
      console.log(`\n${entry.carId}: NOT FOUND — skipped`)
      refused += 1
      continue
    }

    console.log(`\n${rule()}`)
    console.log(`${entry.carId}  (${car.brand} ${car.model})`)
    console.log(rule())

    console.log('\n  EVIDENCE')
    for (const line of entry.evidence) console.log(`    ${line}`)

    if (entry.deliberatelyUnset) {
      console.log('\n  DELIBERATELY NOT SET')
      for (const line of entry.deliberatelyUnset) console.log(`    ${line}`)
    }

    if (entry.held) {
      console.log('\n  ON HOLD')
      console.log(`    ${entry.held}`)
    }

    console.log('\n  WOULD CHANGE')
    const preview: [string, unknown, unknown][] = []
    const row = car as unknown as Record<string, unknown>

    /*
      Every field the declaration can move must appear here.

      It did not: `priceDisplay` was missing from this list, so the dry run
      reported "nothing to change" for an entry that would have changed it. A
      preview that under-reports is worse than none — the whole point of the dry
      run is that somebody approves the diff before it happens.
    */
    for (const key of [
      'model',
      'fullName',
      'variant',
      'trim',
      'modelYear',
      'generation',
      'rangeStandard',
      'electricRangeStandard',
      'priceDisplay',
    ] as const) {
      if (entry[key] === undefined) continue
      preview.push([key, row[key], entry[key]])
    }
    for (const [field, value] of Object.entries(entry.corrections ?? {})) {
      preview.push([field, row[field], value])
    }

    let anyDiff = false
    for (const [field, from, to] of preview) {
      const same = String(from ?? 'null') === String(to ?? 'null')
      if (!same) anyDiff = true
      console.log(
        `    ${field.padEnd(22)} ${String(from ?? 'null').padEnd(22)} -> ${String(to ?? 'null')}${same ? '   (already)' : ''}`,
      )
    }
    if (!anyDiff) console.log('    (nothing — the row already reads this way)')

    if (!args.apply) continue

    /*
      A held entry needs both flags. `--apply` alone is the command somebody runs
      to action the plan; it must not action the part of the plan that was
      decided against.
    */
    if (entry.held && !args.includeHeld) {
      console.log('\n  SKIPPED — on hold. Pass --include-held as well to apply it anyway.')
      held += 1
      continue
    }

    const result = await declareCarIdentity(entry)
    if (!result.ok) {
      console.log(`\n  REFUSED: ${result.message}`)
      refused += 1
      continue
    }

    console.log(`\n  ${result.message}`)
    for (const [field, [from, to]] of Object.entries(result.changed)) {
      console.log(`    ${field.padEnd(22)} ${String(from)} -> ${String(to)}   (history row written)`)
    }
    /*
      Counted only when something actually moved.

      A re-run of this script is a no-op by design, and reporting "applied to 2
      cars" when it wrote nothing would make the summary of an audit tool untrue
      in exactly the way that matters — somebody reading the log later could not
      tell a real correction from a repeat invocation.
    */
    if (Object.keys(result.changed).length > 0) applied += 1
    else unchanged += 1
  }

  // ── Integrity ─────────────────────────────────────────────────────
  console.log(`\n${rule('═')}`)
  const carsAfter = await prisma.car.count()
  const historyAfter = await prisma.carChangeHistory.count()

  if (args.apply) {
    console.log(
      `Applied to ${applied} car(s), already correct ${unchanged}, refused ${refused}, held ${held}.`,
    )
    console.log(`Catalogue rows: ${carsBefore} -> ${carsAfter} (must be unchanged)`)
    console.log(`History rows:   ${historyBefore} -> ${historyAfter} (must only grow)`)
    if (carsAfter !== carsBefore) console.log('WARNING: the row count changed. Investigate.')
    if (historyAfter < historyBefore) console.log('WARNING: history rows were lost. Investigate.')
    console.log('\nRevalidate the public pages by restarting the dev server or rebuilding.')
  } else {
    const heldCount = entries.filter((entry) => entry.held).length
    console.log('Dry run — nothing was written. Re-run with --apply.')
    if (heldCount > 0) {
      console.log(
        `${heldCount} of these ${heldCount === 1 ? 'is' : 'are'} ON HOLD and would be skipped ` +
          `even by --apply. See the reason above each.`,
      )
    }
  }
  console.log('')

  await prisma.$disconnect()
  return refused > 0 ? 1 : 0
}

main()
  .then((code) => {
    process.exitCode = code
  })
  .catch((error: unknown) => {
    console.error('\nFailed:', error)
    process.exitCode = 1
  })
