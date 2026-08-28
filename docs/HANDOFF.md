# PlugPK crawler — handoff summary

State as of **2026-08-27**. Written to be pasted into another assistant as context.

---

## 1. The project

**plug.pk** — Pakistan EV ecosystem platform: charging map, route planner with
charging stops, electrified car catalogue, owners' community, services/partners
directory.

| | |
| --- | --- |
| Stack | Next.js 14.2 App Router, TypeScript, **Prisma on SQLite**, Tailwind |
| Database | `prisma/dev.db` (a file — ~733 KB), 17 migrations |
| Run | `npm run dev` on a Windows 10 workstation |
| Repo | `github.com/alisalman81r-ai/PlugPK`, branch `main` |
| Deployment | **None configured.** No `vercel.json`, no Dockerfile, no CI, no host chosen |
| Catalogue | 36 cars, authored in `src/data/cars.ts`, seeded into `Car` |
| Admin | `/admin`, gated by `ENABLE_ADMIN=true` + a single shared `ADMIN_PASSWORD` |

**The SQLite file is a hard constraint:** serverless hosts (Vercel/Lambda) cannot
work for writes — an ephemeral filesystem discards the staging rows. Any host with
a persistent disk and a long-lived process works.

---

## 2. What the crawler is, and the one rule

An external-data pipeline that reads published EV data, compares it against the
catalogue, and files differences as **proposals** for a human to approve.

> **THE ONE RULE: crawled data never writes to `Car`.**

Exactly one function writes to `Car` — `applyChange` in
`src/lib/db/car-review-store.ts` — and only on operator approval at
`/admin/cars/review`, with a `CarChangeHistory` row in the same transaction.
Enforced by types: `crawler/pipeline.ts` takes its DB access through a
`PipelineStore` interface with no method capable of writing a car.

```
scheduler → source health → robots/access check → conditional request
  → raw record (CarSourceRecord) → normalise → validate → match
  → field compare → confidence → change detection → proposal (CarFieldChange)
  → ── A PERSON DECIDES ── → applyChange (+ history) → targeted revalidation
```

Never `CRAWL → ASSUME VARIANT → OVERWRITE`.

---

## 3. Phase status

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Fetch, extract, normalise, stage | Done |
| 2 | Match to catalogue, source priority, licences | Done |
| 3 | Compare, confidence, propose, review queue | Done (+ fixes 2026-08-26) |
| 4 | Schedule, health, idempotency, discovery, dashboard | **Built, NOT activated** |
| 4.1 | Variant-level identity | **Built, NOT activated** |

**Seven verify suites, all green.** `tsc --noEmit`, `next lint`, `next build` all clean.

```
crawl:verify            Phase 1 pipeline, adapters, access refusals
crawl:verify-review     Phase 2/3 review, price display, history
crawl:verify-fixes      Phase 3 against the real DB + the apply-time variant gate
crawl:verify-schedule   Phase 4 units: schedule, health, limiter, redaction
crawl:verify-daily      Phase 4 end-to-end — 144 checks, 23 scenarios
crawl:verify-variant    Phase 4.1 — 108 checks, 15 scenarios + critical regression
crawl:verify-provenance Provenance resolution — 60 checks; a source id cannot
                        masquerade as a source record, and a refuted claim
                        yields no trusted variant
```

`npm run crawl:verify-all` runs all seven.

---

## 4. Phase 4 — the daily pipeline

### Already existed (2026-08-25 session)
`CrawlRun` model with every tracked field, source health + staleness grading,
content-hash idempotency, retries/exponential backoff/jitter/limiter, new-car
candidates, price history, secret redaction, `/admin/cars/updates`.

### Built in this session
- **`crawler/pipeline.ts`** — the orchestration, extracted out of `daily.ts` behind
  interfaces so it can be tested. Previously `daily.ts` was a script calling
  `main()` at module scope, so none of the orchestration was testable — "a failed
  source does not modify Car" was an assertion in a comment.
- **`crawler/live-deps.ts`** — the one place the real Prisma/adapter/limiter wiring
  lives. The command and the HTTP trigger both build deps here, so there is no
  second implementation of "the live pipeline".
- **`crawler/report.ts`** — run report as text (terminal/log) and as JSON (trigger).
- **`crawler/incremental.ts`** — priority ordering (unseen → changed → stale →
  unchanged) and per-run budgets. A budget **defers and reports**, never silently
  truncates.
- **Conditional requests** — ETag / `If-None-Match` on Open EV Data. A 304 is a
  *success* (moves `lastSuccessAt`, not `lastChangedAt`). Validators are cleared
  after any failure or any run that left work undone, so a recovered source cannot
  answer 304 to a stale token and record a clean success having fetched nothing.
- **Three schedulers** (see §7), none activated.
- **Dashboard filters** on `/admin/cars/updates` — source, status, date, car,
  confidence, change type; all applied in the query, never to fetched rows.
- **`/credits` page + `src/data/dataSources.ts`** — discharges the Open EV Data
  attribution obligation (MIT + attribution) that had been outstanding since Phase
  2, and **enforces it**: `applyChange` refuses to publish from any source absent
  from the registry.
- **Migration `20260827090000_add_conditional_fetch_columns`** — 4 nullable/defaulted
  columns on `CarSource` (`lastEtag`, `lastModifiedHttp`, `lastSeenModified`,
  `recordBudget`).

### Dry-run result (real, against the live source)
```
fetched 1321 · new/changed 1313 · unchanged 8 · failed 0
matched 7 records about a car the catalogue carries
candidates 1303 possible new cars
Car table untouched: 36 rows
```
4 seconds, one HTTP request. **2 requests/day** expected in production
(HEAD access check + conditional GET).

### Cleanup done
`scratch-inspect.ts` and `scratch-collapse.ts` removed; the collapse logic promoted
to `scripts/collapse-duplicate-proposals.ts` (dry-run by default). The 15 duplicate
proposals resolved — 10 superseded, **nothing deleted**. `testA`/`testB` verified
absent across nine tables.

---

## 5. THE INCIDENT — and Phase 4.1

### What happened
On **2026-08-27 at 09:35**, five proposals on `byd-seal` were approved via
`/admin/cars/review` (by `admin` — the shared password, so no person is named) and
applied to the live catalogue:

| Field | Old | New (live now) |
| --- | --- | --- |
| `batteryCapacity` | 61.44 | **87** |
| `range` | 650 | **425** |
| `dcCharging` | — | **140** |
| `acCharging` | — | 11 |
| `connectors` | `CCS2,Type 2` | `Type 2, CCS2` |

### Root causes (five, compounding)

**A1. `Car` had no `variant` / `trim` / `modelYear` / `generation` columns.** Variant
lived inside `model` as free text — `"Atto 3 Advanced"`, `"EV9 GT-Line"`,
`"Tiggo 7 PHEV"`. `byd-seal`'s model was just `"Seal"` — no trim at all.

**A2. The matcher's tier 3 claimed to check the variant and did not.** The comment
read *"brand, model and variant all agree exactly"*; the code compared brand and
model. Score 90 crosses the `>=85` confidence threshold, so **five different Seal
variants each came back `confident`**:

```
"U 87 kWh Design"          87 kWh   425 km  140 kW   exact-parts/90  confident
"61.4 kWh RWD Comfort"     61.4     370     110      exact-parts/90  confident
"U 71.8 kWh Comfort"       71.8     360     115      exact-parts/90  confident
"82.5 kWh RWD Design"      82.5      —      150      exact-parts/90  confident
"82.5 kWh AWD Excellence"  82.5      —      150      exact-parts/90  confident
```
The catalogue held 61.44 kWh — the second row, to within 0.04 kWh.

**A3. The model-year guard was dead code** — `yearGuard(source.modelYear, null)`,
literal null, because `Car` had no year column. Read as working in every inspection.

**A4. Ambiguity was measured per record**, so five records claiming one row was
invisible. It surfaced downstream as `changeType: 'conflicting'` with the reason
**"sources disagree"** — the sentence the reviewer read. It was *one* source
describing five vehicles, and the system had no vocabulary for that.

**A5. Provenance was attributed to the wrong record.** `FieldComparison.winner` is a
*source* id; `proposeForCar` did
`contributors.find(r => r.sourceId === comparison.winner)`, which returns the
**first** record from that source, not the one whose value won (claims rank by trust
then record confidence; contributors stay in DB order). **All five proposals are
stamped `61.4 kWh RWD Comfort` while three applied the 87 kWh record's figures** —
an audit trail naming the wrong vehicle, worse than none because it reads as
corroboration.

### The fix

**`crawler/identity.ts`** — variant identity as a first-class question, separate
from "which car". Strict tiers, **no edit distance / trigram / "close enough"
anywhere**:

| Tier | Verdict |
| --- | --- |
| `external-id` (human-confirmed previously) | proven |
| `brand-model-variant-year` | proven |
| `brand-model-variant` | proven |
| `brand-model-year` | unproven |
| `brand-model` | unproven or **ambiguous** |
| `none` (contradiction) | **mismatch** |

Four verdicts: **proven** (allowed) · **unproven** (blocked — model matched, trim
not established) · **ambiguous** (blocked — several variants positively competing) ·
**mismatch** (blocked — both state a variant and they differ).

Two rules worth preserving:
- **Uniqueness is not proof.** One `BYD Seal` row means a model-only record matches
  *uniquely* — and that says nothing about which trim. "Refuse when several variants
  exist" would not have caught this; there is one.
- **The weakest contributor governs.** Taking the best would let one well-named
  record launder four unnamed ones.

**`crawler/range-standard.ts`** — six cycles (WLTP, EPA, CLTC, NEDC, JC08,
UNSPECIFIED). Comparable only when both sides state the *same known* cycle. **Two
unspecified figures are NOT comparable** — "neither of us knows" is not agreement.
**No conversion between cycles, ever** (CLTC reads ~⅓ higher than WLTP; a rule of
thumb applied to a published spec becomes a fabricated spec).

**A hard gate in `applyChange`, not just a risk label.** The policy layer already
graded these `high-risk` + `excludeFromBulk` — that was in place on 2026-08-27 and
they were approved individually anyway. So variant-level fields are now **refused**
at the point of publication. **Identity is recomputed at approval time**, not read
from the stored verdict — so declaring a variant in the car editor unblocks a
pending proposal immediately, no re-crawl.

**Variant-sensitive** (blocked while unproven): `batteryCapacity`,
`usableBatteryCapacity`, `range`, `rangeMax`, `electricRange`, `electricRangeMax`,
`power`, `torque`, `acceleration`, `topSpeed`, `dcCharging`, `acCharging`,
`priceMin`, `priceMax`, `priceDisplay`, `modelYear`.
**Model-level** (never blocked): `brand`, `model`, `fullName`, `category`,
`bodyType`, `seats`, `connectors`, `engineCapacity`, `image`, `notes`.
Anything unrecognised is treated as variant-sensitive (fails closed).

**Migration `20260827120000_add_variant_identity`** — 19 nullable/defaulted columns
across `Car`, `CarSourceRecord`, `CarFieldChange` + 3 indexes. Additive only.

### The five changes, analysed (`npm run db:analyse-seal`)

**Not reverted.** All 5 still `approved`, all 5 `CarChangeHistory` rows intact; four
now carry a `PHASE 4.1 REVIEW REQUIRED` note (appended, status unchanged).

| Field | Recorded source variant | Variant that actually supplied the value | Verdict |
| --- | --- | --- | --- |
| `batteryCapacity` 61.44→87 | `61.4 kWh RWD Comfort` | **`U 87 kWh Design`** | REVIEW REQUIRED |
| `range` 650→425 | `61.4 kWh RWD Comfort` | **`U 87 kWh Design`** (correct record says **370**) | REVIEW REQUIRED |
| `dcCharging` →140 | `61.4 kWh RWD Comfort` | **`U 87 kWh Design`** (correct says **110**) | REVIEW REQUIRED |
| `acCharging` →11 | `61.4 kWh RWD Comfort` | all variants agree — probably correct | REVIEW REQUIRED |
| `connectors` | — | model-level | OK |

`range` fails twice over: wrong variant **and** incomparable cycles (source says
`unspecified`; the catalogue's 650 has no recorded cycle either).

---

## 6. Current database state (verified)

```
Cars                 36     (0 declare a variant)
Source records       24
Field changes        15     → 5 approved, 10 superseded
Change history        5     (append-only, intact)
Price history         0
Candidates            2
Crawl runs            4
Log lines            60

byd-seal LIVE NOW: variant=null, batteryCapacity=87, range=425,
                   rangeStandard=null, dcCharging=140, acCharging=11,
                   connectors="Type 2, CCS2"

Fixture residue: verify-fixture 0, testA 0, testB 0
Sources: openev (ON, daily, allowed, trust 70) · evdb (off, unchecked)
```

---

## 7. Schedulers — all built, NONE activated

| Option | Where | Activation command |
| --- | --- | --- |
| Windows Task Scheduler | `deploy/windows/register-task.ps1` | `... register-task.ps1 -Activate` |
| systemd timer (**recommended**) | `deploy/linux/plugpk-crawler.{service,timer}` | `systemctl enable --now plugpk-crawler.timer` |
| HTTP trigger | `POST /api/crawler/daily` | set `CRAWLER_ENABLED=true` + 32-char `CRAWLER_TRIGGER_SECRET` |
| cron fallback | `deploy/linux/crontab.example` | `crontab -u plugpk ...` |

Schedule would be **06:00 local daily** (not midnight — that is when every job on
the internet fires; also finishes before anyone opens the queue). Missed runs are
made up, not skipped. All three drive the same `crawler/pipeline.ts`.

**Verified not active:** no scheduled task registered, `CRAWLER_ENABLED` absent from
`.env` so the route returns **404 to every method** (GET included — an earlier 405
leaked the route's existence and was fixed).

The Windows wrapper and the HTTP trigger were both tested end-to-end in dry mode
(trigger returns 401 without/with a wrong secret, 404 when disabled, and a valid dry
run returning figures identical to the CLI).

---

## 8. Commands

```bash
# Inspect / rehearse — safe
npm run crawl:status          # what would run + what is stale. Contacts nothing
npm run crawl:dry             # full pass, fetches + matches + classifies, writes NOTHING
npm run db:variant-identity   # which cars declare a variant; suggested splits (read-only)
npm run db:analyse-seal       # the byd-seal variant analysis (read-only unless --mark-review)

# Run
npm run crawl:daily                        # every source that is due
npm run crawl:all                          # every enabled source, cadence ignored
npm run crawl:car -- byd-seal              # one car
npm run crawl:daily -- --source openev     # one source
npm run crawl:daily -- --budget 200        # cap; the rest are DEFERRED, not dropped

# Verify
npm run crawl:verify-all      # all six suites
npm run type-check
npx next lint
NEXT_DIST_DIR=.next-verify npx next build  # separate dist so it can't disturb a dev server

# Maintenance
npm run db:collapse-duplicates   # dry by default; --apply to write
npm run db:remove-test-sources
```

A **dry run reads** (hashes, matcher, discovery classifier) so it reports what
*would* change. Only writing is suppressed. This was backwards at first and made the
rehearsal useless — every record came back classified as new.

---

## 9. File map

**New this session**
```
crawler/pipeline.ts          the orchestration, dependencies injected
crawler/live-deps.ts         the real Prisma/adapter/limiter wiring
crawler/report.ts            run report as text and as JSON
crawler/incremental.ts       priority ordering + budgets
crawler/identity.ts          ★ variant identity: tiers, verdicts, field sets
crawler/range-standard.ts    ★ six cycles, comparability, no conversion
crawler/match-input.ts       pure mapping, split out of adapters.ts
crawler/verify-daily.ts      144 checks
crawler/verify-variant.ts    ★ 108 checks
src/lib/crawler-trigger.ts   trigger auth + enable gate
src/app/api/crawler/daily/   the HTTP trigger
src/app/(main)/credits/      the licence credits page
src/data/dataSources.ts      licence registry — enforced by applyChange
src/components/admin/UpdatesFilters.tsx
scripts/collapse-duplicate-proposals.ts
scripts/analyse-seal-changes.ts
scripts/report-variant-identity.ts
deploy/windows/{crawl-daily,register-task}.ps1
deploy/linux/plugpk-crawler.{service,timer}, crontab.example
docs/CRAWLER.md, PHASE4-PRODUCTION-CHECK.md, PHASE4.1-VARIANT-IDENTITY.md
prisma/migrations/20260827090000_add_conditional_fetch_columns/
prisma/migrations/20260827120000_add_variant_identity/
```

**Changed**
```
prisma/schema.prisma              23 additive columns total
crawler/match.ts                  real variant tiers (98/94), live year guard
crawler/policy.ts                 the variant rule + range-cycle rule, fail-closed
crawler/proposals.ts              identity per field, competing variants, winner by RECORD id
crawler/compare.ts                SourceClaim.recordId, FieldComparison.winnerRecordId
crawler/model.ts                  RangeStandard unified onto one definition
crawler/daily.ts                  thin CLI over pipeline.ts
crawler/sources/{types,openev}.ts FetchOutcome + conditional GET
src/lib/db/car-review-store.ts    ★ the apply-time variant gate + licence gate
src/lib/db/car-source-store.ts    identity columns, dashboard queries
src/components/admin/ReviewQueue.tsx   variant evidence ON THE ROW
src/app/admin/(protected)/cars/{review,updates}/page.tsx
src/components/layout/Footer.tsx  /credits link (licence obligation)
crawler/verify-{review,phase3-fixes,daily}.ts   fixtures declare identity
```

**Nothing is committed.** ~54 files changed/untracked. `git push` to
`alisalman81r-ai/PlugPK` is **403 on credentials** — none of this is backed up off
the machine.

---

## 10. Open decisions — these need the user, not an assistant

1. ~~**`byd-seal` is still live with the wrong figures** (87 kWh / 425 km / 140 kW).~~
   **DONE 2026-08-27.** The row was corrected through
   `scripts/declare-variant-identity.ts` → `src/lib/db/car-identity-store.ts`
   (transactional, one `CarChangeHistory` row per changed field, `changeId` null to
   mark a hand edit). The five original crawler history rows are untouched.

   The live row now holds:

   | Field | Value |
   | --- | --- |
   | `variant` | `61.4 kWh RWD Comfort` |
   | `batteryCapacity` | 61.44 kWh |
   | `range` | 650 km |
   | `dcCharging` | 110 kW |
   | `rangeStandard` | **null — still no evidence anywhere** |

   Two things are still open, and neither is a revert:

   - **The 650 km range is unresolved and unattributed.** No test cycle is proven
     for it, it matches no source record for any Seal variant (the source
     publishes 360, 370 and 425), and the record for the declared trim states
     **370 km**. Audited 2026-08-27; nothing changed, because substituting 370
     would swap one uncycled figure for another. See
     `docs/PHASE4.1-VARIANT-IDENTITY.md`.
   - **The `PKR 1.48–1.70 Cr` price span** is authored, never crawled
     (`pakistanPrice` is null on all 15 records, and openev's trust for price is
     0), and neither endpoint is attributed to a trim anywhere. A span on a row
     that now declares one trim is unexplained.

   **The five crawler approvals were not reverted: five human approvals are not an
   assistant's to undo.** They are superseded by the correction, which is a
   different thing and is what the history records.

2. **0 of 36 cars declare a variant.** Safe but stalled — every variant-sensitive
   figure is refused as unproven. `npm run db:variant-identity` lists all 36 with
   suggestions for the 3 whose model name ends in a trim word, and flags 30 cars
   holding a range figure with no cycle recorded.

3. **1,303 new-car candidates** on a first live run (1,321 fetched, only 7 match a
   catalogue car — a global dataset against a 36-car Pakistani catalogue). Three
   costed options in `docs/PHASE4-PRODUCTION-CHECK.md` §N.1; recommendation is
   `--budget 200` first, then decide.

4. **No Pakistani source.** The pipeline's biggest gap. Open EV Data holds no local
   pricing and is trusted for none (`fieldTrust.pakistanPrice = 0`). A distributor's
   published price list would be worth more than any aggregator.

5. **No variant alias table.** Spellings will not match between sources
   (`"61.4 kWh RWD Comfort"` vs however a local distributor writes it) → every pair
   returns `unproven`. `MatchInput.aliases` / `confirmedExternalIds` exist as
   plumbing, unbacked. Deliberately not built — designing aliases before a second
   source exists would be guessing.

6. **Approvals cannot name a person.** One shared `ADMIN_PASSWORD`; the session
   cookie carries no subject, so `CarChangeHistory.approvedBy` is the constant
   `'admin'`. Reviewed and deliberately left honest — an env-var operator name was
   rejected because two people sharing one password would both be recorded as
   whoever the variable named, and an audit trail that can name the *wrong* person is
   worse than one admitting it does not know. Needs real per-user accounts
   (`src/lib/admin-auth.ts` + `/admin/login`).

---

## 11. HARD RULES for whoever continues

1. **DO NOT activate scheduled crawling.** No task, no timer, no `CRAWLER_ENABLED`.
   Activation is the user's explicit decision.
2. **DO NOT revert the five `byd-seal` approvals** automatically. **DO NOT delete any
   `CarChangeHistory`, `CarSourceRecord`, or `CarPriceHistory` row** — all three are
   append-only by design.
3. **DO NOT add fuzzy/edit-distance/similarity matching** anywhere. Exact comparison
   over normalised text only. A differently-spelled variant is a `mismatch`, not a
   near-match.
4. **DO NOT guess a variant, trim, generation, or model year.** `Car.variant = null`
   means *"declares no variant"*, never *"any variant"*. Do not auto-split `model`
   into model+variant in a migration — that is a market judgement a person makes.
5. **DO NOT loosen the `applyChange` variant gate** to unblock the queue. Declaring
   variants is the intended path; re-derivation at approval time exists so that works
   without a re-crawl.
6. **DO NOT infer a model year from a crawl date.** Absent stays null.
7. **DO NOT convert between range test cycles.** There is no honest factor.
8. **Migrations stay additive.** `ADD COLUMN` (nullable or defaulted) and
   `CREATE TABLE` only. No `DROP`, no column type changes.
9. **Nothing may write to `Car` except `applyChange`.** If a second writer appears,
   the guarantee that every catalogue change has an approver and a history row is
   gone.
10. **Add a source's licence to `src/data/dataSources.ts` at the same time as its
    adapter.** `applyChange` refuses to publish from an unregistered source, and
    `/credits` renders the same array the gate checks.
11. **When a suite fails after a change, check whether the fixture is wrong before
    the code.** Several Phase 3/4 fixtures had to start declaring identity; two tests
    passed for the wrong reason and had to be strengthened.

---

## 12. Read these first

| Doc | |
| --- | --- |
| `docs/CRAWLER.md` | the whole pipeline, scheduler choice, source terms, failure behaviour |
| `docs/PHASE4-PRODUCTION-CHECK.md` | A–N production report: request/write volumes, storage, rollback, blockers |
| `docs/PHASE4.1-VARIANT-IDENTITY.md` | A–M report: the five root causes, matching rules, the byd-seal analysis |
| `docs/SETUP.md` | environment, why `/admin` 404s on a fresh clone |
| `crawler/README.md` | directory map and conventions |

---

# THE DAILY CRAWLER IS BUILT BUT NOT ACTIVATED
