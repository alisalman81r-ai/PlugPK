# Phase 4.1 — variant-level identity

**Status: implemented and tested. The daily crawler is still NOT activated.**

Nothing runs on a timer. No scheduled task is registered, no systemd timer is
enabled, `CRAWLER_ENABLED` is unset so the HTTP trigger 404s to every method. The
five human approvals on `byd-seal` have **not** been reverted. All
`CarChangeHistory` is intact.

Prepared 2026-08-27, from the live database.

---

## A. Identity weaknesses

Four, and they compounded. The first is the root cause; the fourth I found while
writing this report.

### A1. `Car` had no variant, trim, model year or generation columns at all

Identity was `brand + model + fullName + slug`. Variant lived **inside `model`**
as free text:

| slug | model | what that actually is |
| --- | --- | --- |
| `byd-atto-3-advanced` | `Atto 3 Advanced` | model + trim |
| `byd-sealion-7-advanced` | `Sealion 7 Advanced` | model + trim |
| `kia-ev9-gt-line` | `EV9 GT-Line` | model + trim |
| `chery-tiggo-7-phev` | `Tiggo 7 PHEV` | model + powertrain |
| **`byd-seal`** | **`Seal`** | **model only — no trim at all** |

So when Open EV Data published `variant: "61.4 kWh RWD Comfort"`, there was
nothing to compare it against.

### A2. The matcher's tier 3 claimed to check the variant and did not

```ts
// ── Tier 3 — brand, model and variant all agree exactly ────────
const modelAgrees = sourceModel !== null && nameKey(sourceModel) === nameKey(car.model)
if (brandAgrees && modelAgrees) { … score: 90 … }
```

The comment said variant; the code compared brand and model. Score 90 crosses the
`>= 85` threshold, so **every one of five different Seal variants came back
`confident`**:

```
variant "U 87 kWh Design"           87 kWh   425 km  140 kW   exact-parts/90  confident
variant "61.4 kWh RWD Comfort"      61.4     370     110      exact-parts/90  confident
variant "U 71.8 kWh Comfort"        71.8     360     115      exact-parts/90  confident
variant "82.5 kWh RWD Design"       82.5      —      150      exact-parts/90  confident
variant "82.5 kWh AWD Excellence"   82.5      —      150      exact-parts/90  confident
```

The catalogue row held **61.44 kWh** — the first of those, almost to the decimal.

### A3. The model-year guard was dead code

```ts
const yearProblem = yearGuard(normalised.modelYear, null)  // ← literal null
```

`Car` had no `modelYear`, so the second argument was hard-coded. The guard could
never fire, and read as working in every inspection of the file.

### A4. Ambiguity was measured per record, so five records claiming one row was invisible

`match()` compares one record against many cars, and returns `ambiguous` when two
*cars* score within ten points. Nothing anywhere asked the opposite question —
whether many *records* were claiming one car. Each of the five was judged alone
and each looked fine.

The collision did surface downstream, in the field comparison, as
`changeType: 'conflicting'` with the reason **"sources disagree"**. That is the
sentence the reviewer read before approving. It was one source describing five
different vehicles, and the system had no vocabulary for that.

### A5. Provenance was attributed to the wrong record — found while writing this

`FieldComparison.winner` is a **source id**. `proposeForCar` then did:

```ts
contributors.find((record) => record.sourceId === comparison.winner)
```

With five records all carrying `sourceId: 'openev'`, that returns the **first**
one, not the one whose value won. Claims are ranked by trust then record
confidence; contributors stay in database order. The two differed.

**Result: the stored proposal for the 87 kWh value carries the URL, the variant and
the model year of the 61.4 kWh record.** An audit trail naming the wrong vehicle,
which is worse than naming none — it reads as corroboration. You can see it in
section I: every one of the five changes is stamped `61.4 kWh RWD Comfort`, and
three of them applied another variant's figures.

---

## B. Schema changes

One additive migration: `20260827120000_add_variant_identity`. **Nineteen
`ADD COLUMN`s, all nullable or defaulted, plus three indexes. No `DROP`, no
`ALTER` of an existing column, no data rewritten, no history touched.**

**`Car`** — the identity the catalogue asserts about itself:

| Column | Type | |
| --- | --- | --- |
| `variant` | `String?` | the trim, declared rather than parsed out of `model` |
| `trim` | `String?` | |
| `modelYear` | `Int?` | null means unknown, never "this year" |
| `generation` | `String?` | |
| `rangeStandard` | `String?` | the cycle `range` was measured on |
| `electricRangeStandard` | `String?` | the cycle `electricRange` was measured on |

**`CarSourceRecord`** — the identity the source published, lifted out of the
payload so it is queryable: `variant`, `trim`, `modelYear`, `generation`,
`variantVerdict`, `identityTier`.

**`CarFieldChange`** — the evidence beside the value, for the person deciding:
`variantVerdict`, `identityTier`, `sourceVariant`, `sourceModelYear`,
`variantSensitive`, `currentRangeStandard`, `proposedRangeStandard`.

### Every new identity column is left NULL, deliberately

`NULL` on `Car.variant` means **"this row does not declare a variant"** — a true
statement about all 36 rows today. The matcher reads it as *not proven*, never as
*matches anything*. So the safe behaviour is the default from the moment the
migration lands, with no follow-up step needed to be safe.

A migration that split `"Atto 3 Advanced"` into model + variant would be inventing
variant identity, which is the thing this phase exists to stop. `Advanced` is
probably a trim; `PHEV` is a powertrain this catalogue uses to separate entries;
whether the locally-sold car is the trim the name implies is a market judgement.
So nothing guesses — `npm run db:variant-identity` proposes the splits and a person
confirms them in the car editor.

---

## C. Matching rules

Strict tiers, exact comparisons only. **No edit distance, no trigram score, no
"close enough" anywhere.** Two things are now decided separately, which is the
core of the fix:

- **Which car** — `crawler/match.ts`, as before, plus a live year guard and a
  variant-contradiction guard.
- **Which variant** — `crawler/identity.ts`, new. A confident match establishes the
  *model*; it says nothing about the *trim*.

### Identity tiers

| Tier | Requires | Verdict | Rank |
| --- | --- | --- | --- |
| `external-id` | a source id a person previously confirmed against this car | **proven** | 100 |
| `brand-model-variant-year` | all four agree exactly | **proven** | 95 |
| `brand-model-variant` | brand, model, variant agree exactly | **proven** | 90 |
| `brand-model-year` | brand, model, year agree; variant not established | **unproven** | 70 |
| `brand-model` | brand and model agree only | **unproven** or **ambiguous** | 50 |
| `none` | brand or model disagree, or a stated contradiction | **mismatch** | 0 |

### The four verdicts

| Verdict | Meaning | Variant-sensitive fields |
| --- | --- | --- |
| **proven** | both sides state a variant and they agree, or an external id settled it | **allowed** |
| **unproven** | model matched; variant not established — either side silent, or spelled differently | **blocked** |
| **ambiguous** | several distinct variants are positively competing for this row | **blocked** |
| **mismatch** | both sides state a variant and they differ | **blocked** |

`unproven` is the verdict that had to exist. It is the `byd-seal` case: the source
names a specific vehicle, the catalogue row leaves the trim open, the model
matches. Very likely the right *row*; not established to be the right *variant*.

### Two rules worth calling out

**Uniqueness is not proof.** There is exactly one `BYD Seal` row, so a model-only
record matches it *uniquely* — and uniqueness says nothing about which trim the
source was describing. This is the trap the old code fell into, and it is why
"refuse when the catalogue holds several variants" would not have been enough on
its own: it holds one.

**The weakest contributor governs.** A field proposed on the strength of several
records agreeing is only as identified as the least identified of them. Taking the
best would let one well-named record launder four unnamed ones — which is exactly
the shape of what happened.

### Never guessed

- A variant is never inferred from a battery size, a name, or anything else.
- A differently-spelled variant is `mismatch`, not a near-match:
  `"Comfort 61.4 kWh RWD"` does not match `"61.4 kWh RWD Comfort"`. Slower than a
  similarity score, and it cannot be wrong the way a score can.
- Comparison is insensitive to case and punctuation only — `"GT-Line"` matches
  `"gt line"`.

---

## D. Variant-sensitive fields

The test applied to each: **could two trims of the same model differ here?**

**Variant-sensitive — blocked while the variant is unproven:**
`batteryCapacity`, `usableBatteryCapacity`, `range`, `rangeMax`, `electricRange`,
`electricRangeMax`, `power`, `torque`, `acceleration`, `topSpeed`, `dcCharging`,
`acCharging`, `priceMin`, `priceMax`, `priceDisplay`, `modelYear`.

`dcCharging` and `acCharging` are on the list less obviously than the rest, and
they matter: the Seal's 110 kW / 140 kW / 150 kW spread is a trim difference, and
`dcCharging` was one of the three wrong figures applied.

**Model-level — never blocked on variant grounds:**
`brand`, `model`, `fullName`, `category`, `bodyType`, `seats`, `connectors`,
`engineCapacity`, `image`, `notes`.

`connectors` is model-level with a stated caveat: every variant sold here uses the
same plug, and blocking the harmless `"CCS2, Type 2"` → `"Type 2, CCS2"` reorder on
variant grounds would be wrong. If a model ever ships different plugs by trim, it
moves.

**Anything unrecognised is treated as variant-sensitive.** The two failure modes
are not symmetric: wrongly requiring review costs a reviewer ten seconds, wrongly
permitting a write puts another variant's figure on a public page.

---

## E. Range-standard handling

`crawler/range-standard.ts`. Six cycles: **WLTP, EPA, CLTC, NEDC, JC08,
UNSPECIFIED**.

Comparability, and only the first case permits an automatic comparison:

| Case | Comparable? |
| --- | --- |
| same known cycle | **yes** |
| different known cycles | no — different measurements, not different values |
| one side unspecified | no — one side's cycle is unknown |
| **both unspecified** | **no** — "neither of us knows" is not agreement |

**No conversion between cycles, ever.** There is no honest factor, only rules of
thumb, and a rule of thumb applied to a published specification becomes a
fabricated specification. CLTC reads roughly a third higher than WLTP for the same
car.

So `425 km unspecified` cannot replace `650 km unspecified` — and this rule
survives a *proven* variant, because two figures for the same trim on different
cycles are still not interchangeable.

> **Corrected 2026-08-27.** This sentence originally read
> "`425 km unspecified` cannot replace `650 km CLTC`". **The catalogue's 650 km
> has no proven test cycle**: `rangeStandard` is null on the row, and no source
> record for any Seal variant states a cycle — all 15 carry `null` or
> `'unspecified'`. Naming it CLTC here was an inference, and an unevidenced cycle
> label in the document that defines cycle discipline is exactly the mistake the
> rule forbids. The rule itself is unaffected and if anything stronger: *neither*
> figure states a cycle, which is why `compareStandards` refuses the pair
> outright. The original wording is quoted rather than deleted. An unrecognised label becomes `unspecified`, never a
guess: defaulting to WLTP because most figures are WLTP would make an unknown
figure look comparable to a known one.

**A name collision fixed along the way.** `crawler/model.ts` declared its own
`RangeStandard` — uppercase, no JC08, plus an unused `'real-world'`. Two types with
one name and different members, a few files from the module holding the
comparability rules. `model.ts` now re-exports the canonical one.

---

## F. Model-year handling

**Never inferred from the crawl date.** A record fetched today says nothing about
the model year of the car it describes. Absent stays `null`.

An invented year would be worse than none: the year guard compares it, so a wrong
year produces a *false mismatch* as readily as a false match, and it would look
published rather than made up.

The guard fires only when **both** sides state a year — one side being silent is
not evidence either way, and treating it as a contradiction would block every
record from a source that omits the year.

---

## G. Generation handling

`Car.generation` and `CarSourceRecord.generation` exist and are carried through
identity. Nothing populates them: no connected source publishes generation data,
so **nothing invents it**. When a source does, the column is there and the identity
comparison already reads it.

---

## H. Ambiguous-variant handling

Nothing is auto-matched when the variant cannot be established. What happens
instead, at four layers:

1. **The matcher** still identifies the model, and now says so explicitly:
   *"brand and model match exactly — the source names variant 'U 87 kWh Design',
   which this row does not declare, so the trim is not established."*
2. **The risk policy** grades any variant-sensitive field `high-risk` and
   `excludeFromBulk`, with the reason and the remedy.
3. **The review screen** shows the two variants side by side, **on the row**, not
   behind the "Why" button — and labels every competing claim with its own trim.
4. **`applyChange` refuses outright.** This is the important one.

### Why a risk label was not enough

The policy layer already graded these `high-risk` and excluded them from bulk
approval. **That is what was in place on 2026-08-27, and five proposals were
approved individually through the UI anyway.** `high-risk` means "probably refuse,
and give a reason if you don't" — it advises. So there is now a hard gate at the
point of publication:

> Not applied — batteryCapacity depends on which variant this is, and the source
> describes variant "61.4 kWh RWD Comfort" but the catalogue row declares no
> variant, so it is not established that they are the same vehicle. The catalogue
> row is declared as no particular variant; the source described "61.4 kWh RWD
> Comfort". Set this car's variant in the editor if you can confirm which trim it
> is, then approve again. Nothing on the public site changed.

**Identity is recomputed at approval time**, not read from the stored verdict. Two
reasons, and the second is the point: the stored value is a crawl-time snapshot,
and re-checking is what makes the fix *actionable*. Declare the variant in the
editor and the blocked proposal becomes approvable immediately, with no re-crawl.

The advice differs by verdict, because the remedies are opposites: an unproven
variant is a gap that declaring the trim fills; a **mismatch** is not a gap, and
telling somebody to set a variant they have already set would send them in a
circle — so it advises rejection instead.

---

## I. Analysis of the five BYD Seal changes

`npx tsx scripts/analyse-seal-changes.ts` produces this in full. **Nothing was
reverted.** All five remain `approved`, all five history rows are intact, and the
four unsubstantiated ones now carry a `PHASE 4.1 REVIEW REQUIRED` note on the
proposal row — appended, never replacing what was there, and the status left at
`approved` because a person did approve them and erasing that would destroy the
history this system exists to keep.

Approved by `admin` between 09:35:00 and 09:35:07 on 2026-08-27, via
`/admin/cars/review`.

| Field | Old | New (live now) | Source variant *as recorded* | The variant that actually supplied the value | Verdict |
| --- | --- | --- | --- | --- | --- |
| `batteryCapacity` | 61.44 | **87** | `61.4 kWh RWD Comfort` | `U 87 kWh Design` | **REVIEW REQUIRED** |
| `range` | 650 | **425** | `61.4 kWh RWD Comfort` | `U 87 kWh Design` | **REVIEW REQUIRED** |
| `dcCharging` | — | **140** | `61.4 kWh RWD Comfort` | `U 87 kWh Design` | **REVIEW REQUIRED** |
| `acCharging` | — | **11** | `61.4 kWh RWD Comfort` | all variants agree | **REVIEW REQUIRED** (identity ambiguous, value probably right) |
| `connectors` | `CCS2,Type 2` | `Type 2, CCS2` | `61.4 kWh RWD Comfort` | model-level | **OK** |

The gap between columns four and five is defect A5. Every proposal is stamped with
the 61.4 kWh record; three of them applied the 87 kWh record's figures.

Common evidence for all five: source `openev`, run `12ba0f51`, record
`16500aa6`, fetched 2026-08-25T13:47:11Z, model year 2025, range standard
`unspecified`, five variants competing, identity verdict **ambiguous**, tier
`brand-model`.

### The two specifically asked about

**61.44 → 87 kWh.** 61.44 kWh is the Seal Dynamic's pack — the variant sold here,
and what `src/data/cars.ts` authored deliberately. The source's own
`61.4 kWh RWD Comfort` record agrees with the catalogue to within 0.04 kWh. 87 kWh
came from `U 87 kWh Design`, a different vehicle. **These figures do not belong to
the same variant, and it cannot be proven that 87 kWh describes this car.** The
evidence points the other way.

**650 → 425 km.** Two separate problems. The variant is wrong for the same reason
as above — the correct record says **370 km**, not 425. And the cycles are not
comparable: the source states `unspecified`, and the catalogue's 650 has no
recorded cycle either, so *neither* figure's provenance is known. `compareStandards`
now refuses this outright: "neither figure states a test cycle, so it cannot be
established that they measure the same thing."

**`acCharging` 11 kW is almost certainly correct** — every Seal variant charges at
11 kW AC, so it is arguably model-level. It is flagged only because the record it
came from could not be identified, and the honest verdict on a figure from an
unidentified record is that it is unverified rather than wrong.

### RESOLVED 2026-08-27 — the row has been corrected

Done as a controlled, audited data correction through
`scripts/declare-variant-identity.ts` → `src/lib/db/car-identity-store.ts`
(transactional, one `CarChangeHistory` row per changed field, `changeId` null to
mark a hand edit). The five original crawler history rows are untouched.

| Field | Was | Now | Basis |
| --- | --- | --- | --- |
| `variant` | null | `61.4 kWh RWD Comfort` | 61.44 kWh authored vs the only source variant within 0.04 kWh |
| `batteryCapacity` | 87 | **61.44** | `src/data/cars.ts:522` + history oldValue |
| `range` | 425 | **650** | `src/data/cars.ts:524` + history oldValue — restoring the authored value, **not** evidence for it |
| `dcCharging` | 140 | **110** | source record `c2832ebc`, the trim's own record |
| `rangeStandard` | null | **still null** | no evidence anywhere — left unresolved |

The four wrong-variant records are now blocked at the **matcher**, not merely
downgraded: `match: none`, `blocked: variants differ`. Only `c2832ebc` matches, at
tier `exact-variant`, score 94, identity **proven**.

Two things remain open and are reported in the session notes rather than fixed
here: the range test cycle (no evidence), and the fact that 650 km from 61.44 kWh
is ~9.4 kWh/100 km, which is not physically plausible — so the *authored* 650
deserves its own review independently of this correction.

> **Audited 2026-08-27, still open.** The 650 km figure is **unresolved and
> unattributed**: no test cycle is proven anywhere for it, it matches no source
> record for any Seal variant (the source publishes 360, 370 and 425), and the
> record for the declared `61.4 kWh RWD Comfort` trim states **370 km**. It was
> authored by hand in commit `1c03db3` from a supplied price list that is not in
> this repository. It is also not an isolated outlier — six of the twenty
> authored EVs imply under 12 kWh/100 km, so the dataset mixes cycles and 30 rows
> hold a range with no cycle recorded. Nothing was changed: substituting 370 would
> replace one uncycled figure with another, which is the judgement
> `compareStandards` exists to refuse.

### The original guidance, kept for the record

1. Decide which variant `byd-seal` is. The evidence says `61.4 kWh RWD Comfort`.
2. Set it in the car editor. That alone makes the matcher strict and turns the
   87 kWh record into an outright `mismatch`.
3. Restore the figures that belonged to another variant. Old values are in
   `CarChangeHistory` (`carId = 'byd-seal'`, 2026-08-27 09:35) and in the table
   above. Restoring writes its own history rows, as it should.
4. Also record the test cycle for the range, or every future range proposal will
   be refused as incomparable — correctly.

---

## J. Files modified

**New**

| File | |
| --- | --- |
| `crawler/identity.ts` | variant identity: tiers, verdicts, the variant-sensitive field sets |
| `crawler/range-standard.ts` | six cycles, comparability, no conversion |
| `crawler/verify-variant.ts` | 108 checks over the 15 scenarios + the critical regression |
| `scripts/analyse-seal-changes.ts` | the section I report; `--mark-review` to record it |
| `scripts/report-variant-identity.ts` | proposes variant splits for a person to confirm |
| `prisma/migrations/20260827120000_add_variant_identity/` | the additive migration |
| `docs/PHASE4.1-VARIANT-IDENTITY.md` | this |

**Changed**

| File | What |
| --- | --- |
| `prisma/schema.prisma` | 19 additive columns across three models |
| `crawler/match.ts` | real variant tiers (98/94), live year guard, variant guard |
| `crawler/policy.ts` | the variant rule and the range-cycle rule, both fail-closed |
| `crawler/proposals.ts` | identity per field, competing-variant detection, winner by **record** id |
| `crawler/compare.ts` | `SourceClaim.recordId`, `FieldComparison.winnerRecordId` |
| `crawler/model.ts` | `RangeStandard` unified onto one definition |
| `crawler/pipeline.ts` | stores identity columns; assesses against the batch |
| `crawler/live-deps.ts` | selects the identity columns; passes siblings |
| `src/lib/db/car-review-store.ts` | **the apply-time gate**; proposal identity columns |
| `src/lib/db/car-source-store.ts` | record identity columns |
| `src/components/admin/ReviewQueue.tsx` | variant evidence on the row; per-claim variants |
| `src/app/admin/(protected)/cars/review/page.tsx` | maps the evidence through |
| `crawler/verify-review.ts`, `verify-phase3-fixes.ts`, `verify-daily.ts` | fixtures declare identity; new gate tests |
| `package.json` | `crawl:verify-variant`, `db:variant-identity`, `db:analyse-seal` |

---

## K. Migration details

`20260827120000_add_variant_identity` — **applied**.

Additive only, per the standing constraint that crawler migrations stay additive:
an `ADD COLUMN` cannot damage a live catalogue, a `DROP` can. Every column is
nullable or has a default, so it cannot fail on an existing row and cannot lose
one. SQLite runs each as a metadata-only change; no table rewrite.

Three indexes: `Car(brand, model, variant)`,
`CarSourceRecord(variantVerdict)`, `CarFieldChange(variantSensitive, status)`.

**Rollback:** revert the code and the columns sit unused and harmless. Nothing
reads them that does not tolerate null.

**Data preserved, verified after the fact:** 36 cars, 24 source records, 15 field
changes, **5 change-history rows**, 2 candidates, 4 crawl runs, 60 log lines. No
row deleted by this phase. Live `byd-seal` values untouched.

---

## L. Test results

| Suite | Checks | Result |
| --- | --- | --- |
| `crawl:verify` | Phase 1 pipeline | **Pass** |
| `crawl:verify-review` | Phase 2/3 + the new fail-closed policy test | **Pass** |
| `crawl:verify-fixes` | Phase 3 against the real DB + **the apply-time gate** | **Pass** |
| `crawl:verify-schedule` | Phase 4 units | **Pass** |
| `crawl:verify-daily` | Phase 4 end to end | **144, pass** |
| `crawl:verify-variant` | **Phase 4.1** | **108, pass** |
| `tsc --noEmit` | whole project | **Clean** |
| `next lint` | whole project | **Clean** |
| `next build` | whole site | **Clean** |

All fifteen requested scenarios, plus three more:

1. BYD Seal with multiple variants · 2. source without variant · 3. source with
exact variant · 4. same model, different year · 5. same model, different battery ·
6. different range standards · 7. unknown range standard · 8. exact external ID ·
9. model-only source · 10. ambiguous variant · 11. variant-sensitive field ·
12. shared model-level field · 13. PHEV variants · 14. duplicate source ·
15. conflicting sources · 16. the weakest contributor governs · 17. provenance
attribution (defect A5) · **the critical regression**

### The critical regression

> *A source for BYD Seal with 87 kWh must NOT modify a 61.44 kWh BYD Seal
> catalogue entry unless the exact variant identity is proven.*

Asserted at both layers, because the policy layer alone was demonstrably
insufficient:

- **Policy** (`verify-variant.ts`): the 87 kWh proposal is `high-risk`,
  `excludeFromBulk`, verdict `ambiguous`, and the reason states that five variants
  are competing. Same for `range` and `dcCharging`.
- **Apply** (`verify-phase3-fixes.ts`, real database): `applyChange` **refuses**;
  the catalogue value does not move; the proposal stays `pending`; **no history row
  is written for a change that did not happen**.
- **And the fix unblocks the right answer:** declaring the variant makes the same
  proposal apply, with a history row naming the old value — while the wrong-variant
  record becomes an outright `mismatch`.

Two tests were deliberately strengthened after first passing for the wrong reason:
the attribution test (the 87 kWh record happened to be first, so the buggy lookup
was right by accident) and the range-cycle test (needed a proven variant so it was
testing the cycle rule rather than the variant rule).

---

## M. Remaining risks

### 1. No catalogue row declares a variant yet — 0 of 36

This is the honest starting state, and it is *safe but stalled*: every
variant-sensitive figure from a variant-declaring source is now refused as
unproven. Correct, and it means the review queue will fill with rows that cannot be
approved until someone declares trims.

`npm run db:variant-identity` lists all 36 with a suggestion for the 3 whose model
name ends in a recognisable trim word, and flags 30 cars holding a range figure
with no test cycle recorded. Start with `byd-seal`.

### 2. Variant spellings will not match between sources

`"61.4 kWh RWD Comfort"` from Open EV Data is unlikely to be exactly how a
Pakistani distributor writes the same trim. Every such pair returns `unproven` and
waits for a person — safe, and it will be repetitive once a second source is
connected.

The intended remedy is an **alias table**: a person confirms a spelling once and it
is recorded. `MatchInput.aliases` and `confirmedExternalIds` already exist as
plumbing; neither is backed by a table. **Not built, deliberately** — building an
alias system before there is a second source would be guessing at what the aliases
need to be.

### 3. The 1,303-candidate question from Phase 4 is still open

Unchanged and still needing your decision. See
`docs/PHASE4-PRODUCTION-CHECK.md` §N.1.

### 4. `acCharging` is classified variant-sensitive and is probably model-level here

Every Seal variant charges at 11 kW AC. The classification is conservative on
purpose, and the cost is that a correct, uncontested AC figure needs a variant
declared before it can be written. If that proves annoying in practice, moving
`acCharging` to `MODEL_LEVEL_FIELDS` is a one-line change with a test.

### 5. Approvals still cannot name a person

Unchanged from Phase 4 §N.3. `CarChangeHistory.approvedBy` records the constant
`'admin'` because the portal is one shared password. It is why this report can say
*when* the five changes were approved and not *by whom*.

### 6. Nothing is backed up off this machine

`git push` to `alisalman81r-ai/PlugPK` is still 403 on credentials. Neither Phase 4
nor Phase 4.1 is committed or pushed.

---

## The architecture, unchanged

```
CRAWL → STORE → MATCH → VALIDATE → REVIEW → APPROVE → UPDATE
```

Never `CRAWL → ASSUME VARIANT → OVERWRITE`. There are now two independent gates
between a crawled figure and a public page — the licence check and the variant
check — and both refuse rather than warn.

---

# THE DAILY CRAWLER IS BUILT BUT NOT ACTIVATED

No scheduled task registered. No systemd timer enabled. `CRAWLER_ENABLED` unset,
so `/api/crawler/daily` returns 404 to every method. The five `byd-seal` approvals
are untouched and every history row is intact.

Before activating, settle §M.1 (declare `byd-seal`'s variant and restore its
figures) and §M.3 (the 1,303 candidates).
