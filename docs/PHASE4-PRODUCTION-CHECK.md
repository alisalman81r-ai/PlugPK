# Phase 4 — production safety check

**Status: the daily crawler is built and tested. It is not activated.**

Nothing runs on a timer. No scheduled task is registered, no systemd timer is
enabled, and the HTTP trigger returns 404 because `CRAWLER_ENABLED` is unset.
Every figure in the system came from a command somebody typed.

Prepared 2026-08-27, from a real dry run against the live source. Measurements are
from this machine and this database, not estimates.

---

## A. Actual deployment environment

**Investigated rather than assumed.** The absences are the finding.

| Checked for | Present? |
| --- | --- |
| `vercel.json` | No |
| `Dockerfile` / `docker-compose.yml` | No |
| `.github/` workflows | No |
| Any CI configuration | No |
| Any process manager config | No |

What is actually there: Next.js 14.2 App Router, TypeScript, **Prisma on SQLite**
(`DATABASE_URL="file:./dev.db"`, 733 KB today), Tailwind, run with `npm run dev`
on Windows 10. Git remote `github.com/alisalman81r-ai/PlugPK`, branch `main`.

**The project has no deployment target yet.** That is the honest answer, and it
governs everything below.

The SQLite file is the decisive constraint:

- **Serverless will not work for writes.** Vercel, Netlify Functions and Lambda
  give each invocation an ephemeral filesystem. A crawl would write its staging
  rows to a disk discarded when the function returns, and the review queue would
  be empty every time you opened it. This is not a configuration gap — it is the
  wrong shape of host for this database.
- **A persistent disk plus a long-lived process works.** A small VPS running
  `next start`, a container with a mounted volume, or this workstation.

Because the target is unchosen, a single scheduler could not be selected for you.
One is provided for each plausible answer, and none is switched on.

---

## B. Scheduler selected

**Recommended: a systemd timer on a small VPS**, once a host exists. It is the
only option that runs whether or not anyone is at a desk, makes up a missed run
rather than skipping the day, and needs no log file to prune.

All three are implemented and ready:

| Option | Where | Activation | Fit |
| --- | --- | --- | --- |
| **Windows Task Scheduler** | `deploy/windows/register-task.ps1` | `-Activate` | Works today, on this machine. Cannot run while it is off or logged out. |
| **systemd timer** | `deploy/linux/plugpk-crawler.{service,timer}` | `systemctl enable --now plugpk-crawler.timer` | **Recommended.** Needs a Linux host. |
| **HTTP trigger** | `POST /api/crawler/daily` | `CRAWLER_ENABLED=true` + a 32-char bearer secret | For a host with no shell; fired by a hosted scheduler or uptime monitor. |

`deploy/linux/crontab.example` covers hosts without systemd.

All three drive the same `crawler/pipeline.ts`. There is deliberately no second
implementation: the copy running unattended must not be the copy nobody tested.

**Nothing is a fake local-only scheduler.** The standalone command is the unit of
work, and it is triggerable by a real OS scheduler on either platform or over
authenticated HTTP.

---

## C. Exact daily schedule

**06:00 local time, daily**, with up to 20 minutes of jitter on Linux.

Not midnight: that is when every scheduled job on the internet fires, so a public
dataset is slowest and quickest to rate-limit precisely then. 06:00 also finishes
before anybody opens the review queue, and keeps a run inside one calendar day so
"today's crawl" on the dashboard means what it says.

Missed runs are made up, not skipped — `StartWhenAvailable` on Windows,
`Persistent=true` on systemd. A machine asleep at 06:00 crawls when it wakes.

Execution time limit 4 hours, then killed. A killed run leaves its `CrawlRun` row
marked `running`; the row holds no lock and wrote nothing to the catalogue, and
`/admin/cars/updates` reports it as unfinished rather than tidying it away.

---

## D. Schedule per source

| Source | Cadence | Why | Enabled |
| --- | --- | --- | --- |
| **openev** (Open EV Data) | **Daily**, conditional | Published JSON dataset, MIT + attribution. One request for the whole set; an ETag means most days are a 304. Daily is well within anything the licence or GitHub's terms restrict. | **Yes** |
| **evdb** (EV Database) | n/a | No public API and no licence permitting bulk reuse. `access()` refuses before any request. | No |
| **vehdb** | n/a | Domain did not resolve when investigated. | No source row |
| **evspecsx** | n/a | Would require permission and a licence. | No source row |

Cadence is per source and editable at `/admin/cars/updates`: `daily`,
`every-3-days`, `weekly`, `monthly`, `manual`. Nothing is daily by default —
`manual` is the fallback for an unrecognised value, so a misspelling stops a
source being crawled rather than quietly starting to crawl it every day.

**Sources that do not permit daily automated access, reported separately as
asked:** `evdb`, `vehdb` and `evspecsx`. None is crawled at any frequency. Each
has an adapter that refuses in code and records what would be required —
`crawler/sources/evdb.ts` and siblings. A blocked adapter throws rather than
returning empty, so a refusal can never be recorded as a successful run that found
no cars.

---

## E. Expected requests per day

**2 requests/day**, both to `api.github.com`.

| Request | When |
| --- | --- |
| `HEAD` on the dataset | The access check, before every run. Confirms reachability; the licence is already known from having read it. |
| `GET` on the dataset (conditional) | The fetch. Carries `If-None-Match`, so on most days this is a 304 with no body. |

Zero requests from the three blocked sources — they never fetch.

Ceiling with retries: 3 attempts on a retryable failure, so a worst-case morning
of timeouts is **6 requests**. A 4xx is never retried. Spacing is 1.5s, one
request at a time per source.

GitHub does not count a 304 against the API rate limit, and 2 requests/day sits
about four orders of magnitude below the 60/hour unauthenticated limit.

---

## F. Expected database writes per day

Measured from the current database.

**Quiet day — the source answers 304 (expected to be most days):**

| Write | Rows |
| --- | --- |
| `CrawlRun` open + close | 1 row, 2 writes |
| `CarSource` health | 1 write |
| `CarSource` robots status | 1 write |
| `CrawlLogEntry` | 1 row |
| **Total** | **~5 writes, ~2 rows** |

**A day where the dataset changed, per changed record:** 1 `CarSourceRecord`, 1–2
`CrawlLogEntry`, and then either up to 11 `CarFieldChange` rows (a matched car) or
1 `CarCandidate` upsert (an unmatched one). Log lines are batched 200 at a time —
5,000 individual inserts against a single-writer SQLite file would cost more than
the crawling.

**The first live run is not a typical day.** See section M.

Concurrency: one writer. One source at a time, one request at a time, and the HTTP
trigger refuses a second concurrent run in the same process. Multi-record writes
that must move together are transactional — an approved price writes `priceMin`,
`priceMax` and `priceDisplay` in one transaction or not at all.

---

## G. Expected storage growth

Measured, not guessed: 24 `CarSourceRecord` rows averaging **2,871 bytes** of
payload; `CrawlLogEntry` ≈ 152 bytes; `CarCandidate` ≈ 1,671 bytes.

| Scenario | Growth |
| --- | --- |
| Quiet day (304) | **< 1 KB** |
| A record changes | ~3 KB per record |
| First live full run | **~6 MB** (see M) |
| Steady state after that, assuming the dataset changes a handful of records a week | **~1–2 MB/year** |

Nothing prunes itself. `CarSourceRecord`, `CarChangeHistory` and `CarPriceHistory`
are append-only by design — a price that changed in March is not wrong, it is
previous. `pruneLog(days)` exists for `CrawlLogEntry` and is called by hand and on
purpose: a crawler that quietly deletes its own audit trail as a side effect of
running is not auditable.

At these rates SQLite is comfortable for years. The thing that would change the
picture is connecting a source that publishes tens of thousands of records daily,
at which point `recordBudget` and a Postgres migration are the conversation.

---

## H. Source access requirements

| Source | Requires |
| --- | --- |
| **openev** | Network access to `api.github.com`. No credentials. MIT + attribution — **the attribution obligation is now discharged**, see K. |
| **evdb** | A licence permitting bulk reuse, or an official API. Neither exists publicly. |
| **vehdb** | A domain that resolves, then terms to read. |
| **evspecsx** | Written permission and a licence. |

`robots.txt` is checked before any request and stored on the source; a status
other than `allowed` blocks the crawl, and `unchecked` is not permission. An
access check that *throws* is treated as a refusal, never as permission — a
network blip inside `access()` must not become a request we were not entitled to
make. That case is tested (`verify-daily.ts` §19).

---

## I. Environment variables required

| Variable | Needed for the crawl? | Notes |
| --- | --- | --- |
| `DATABASE_URL` | **Yes** | Already set. |
| `ENABLE_ADMIN` | For the review queue | Must be `true` to reach `/admin`. |
| `ADMIN_PASSWORD` | For the review queue | Shared password; see the caveat in N. |
| `CRAWLER_ENABLED` | Only for the HTTP trigger | **Currently unset — the trigger 404s. This is the activation switch.** |
| `CRAWLER_TRIGGER_SECRET` | Only for the HTTP trigger | Minimum 32 characters. Bearer token only, never a query parameter. |
| `SESSION_SECRET` | No | Community-side sessions. |
| `OPENCHARGEMAP_API_KEY` | No | Station import, run by hand. |

**No secret is required for the crawl itself.** The command-line path needs
neither crawler variable, which is the main reason it is the recommended way to
run a schedule where a shell exists.

No key, token or password appears in source. `crawler/logger.ts` redacts anything
shaped like a credential — labelled values, `Authorization` headers, credentials
embedded in a URL, query-string secrets, and recognisable token shapes — at the
single exit point where logging happens, rather than leaving each caller to
remember. Tested in `verify-schedule.ts` §15.

---

## J. Rate limits

| Control | Value | Where |
| --- | --- | --- |
| Concurrency | **1** per source | `crawler/limiter.ts` |
| Courtesy delay | **1,500 ms** between request starts, per source | `CarSource.requestDelayMs` |
| Timeout | **30 s** per attempt | `crawler/limiter.ts` |
| Retries | **3** attempts total | exponential backoff, 2s/4s/8s + up to 1s jitter |
| Retryable | 429, 500, 502, 503, 504, timeouts, connection resets | — |
| Never retried | 400, 401, 403, 404, 410, 451 | repeating a 4xx changes nothing except the host's opinion of us |
| Failure backoff | interval **doubles per consecutive failure, capped at 8×** | `crawler/schedule.ts` |

Jitter matters: without it, several sources failing together retry in lockstep
forever and the thundering herd never disperses.

Upstream limits: GitHub allows 60 requests/hour unauthenticated. Two per day is
not close, and 304s are not counted.

---

## K. Licence and attribution — **the oldest outstanding item, now closed**

Open EV Data is published under *MIT License with Attribution Requirement*. Clause
2 requires visible credit where credits are normally shown. This was identified in
Phase 2, recorded in a comment, flagged in two reports — and remained unmet
through Phase 3 and most of Phase 4, because nothing in the code depended on it.

Now three things do:

1. **`/credits`** — a Data and image credits page listing every dataset, its
   licence, and the exact credit line it asks for, rendered verbatim. Also credits
   the 30-odd Wikimedia photographers and OpenStreetMap.
2. **A footer link on every page**, so the credit is reachable from anywhere the
   data appears.
3. **An enforced gate.** `applyChange` refuses to publish a proposal from a source
   absent from `src/data/dataSources.ts`:

   > Not applied — No licence has been recorded for the source "x". Add it to
   > `src/data/dataSources.ts`, having read its terms, before publishing its data.

The page renders the same array the gate checks, so a source that *can* be
published from is necessarily one that *is* credited. There is no second list to
drift.

Scope, stated precisely: the gate governs **publishing**, not crawling. A source
may be read, staged and reviewed with its credit outstanding — nothing is being
distributed. It is approval that makes a figure public, and that is where the
check sits.

---

## L. Rollback strategy

Layered, because the layers fail differently.

**Stop the schedule** — one command, immediately effective:

```powershell
powershell -File deploy\windows\register-task.ps1 -Activate -Unregister   # Windows
```
```bash
systemctl disable --now plugpk-crawler.timer    # Linux
# HTTP trigger: unset CRAWLER_ENABLED and restart — the route 404s again
```

**Undo published data.** Nothing needs undoing unless somebody approved
something, because the crawl only ever writes proposals. If a bad approval did go
out:

- `CarChangeHistory` holds the old value, the new value, the source, the source
  URL and the timestamp for every applied change. Reverting is reading the row and
  putting the old value back through the car editor.
- History is append-only: a correction is a further change with its own row, never
  an edit to the record of the mistake.
- `CarPriceHistory` keeps every price point, so a wrong price never destroys the
  right one.

**Undo the crawl's own writes.** Deleting `CarFieldChange` and `CarSourceRecord`
rows for a run is safe by construction — no `Car` row depends on them. `runId`
identifies everything one run wrote.

**Reject in bulk.** `/admin/cars/review` rejects a filtered selection without
applying anything.

**Roll back the code.** The only schema change in Phase 4 is one additive
migration (`20260827090000_add_conditional_fetch_columns`): four nullable or
defaulted `ADD COLUMN`s on `CarSource`. Reverting the code leaves them unused and
harmless. No `Phase 4` migration drops or alters a column, per the standing
constraint that crawler migrations stay additive — a `CREATE TABLE` or `ADD
COLUMN` cannot damage a live catalogue; a `DROP` can.

**Backups.** The database is a single file. `cp prisma/dev.db prisma/dev.db.bak`
before the first live run is the whole backup story today, and a scheduled copy of
that file is the whole backup story a production host needs.

---

## M. Dry-run results

`npm run crawl:dry`, run 2026-08-27, against the live source. Fetched, matched and
classified; **wrote nothing**.

```
Daily crawl — 2026-08-27T09:31

Schedule
  openev     Daily     healthy    RUN  — due — daily
  evdb       Daily     never-run  skip — the source is switched off

openev — completed
  access: open-dataset — Published JSON dataset under MIT with an
          attribution requirement. One request for the whole set.
  ATTRIBUTION REQUIRED: Open EV Data (https://github.com/KilowattApp/open-ev-data)
  found 1321, new/changed 1313, unchanged 8, failed 0, deferred 0
  7 matched a catalogue car, 1303 candidate(s), 0 proposal(s), 0 price point(s)
  records by priority: 1313 unseen, 8 unchanged

Done in 4.0s
  fetched     1321
  new/changed 1313
  unchanged   8
  failed      0
  matched     7 record(s) about a car the catalogue carries
  candidates  1303 possible new cars

  Car table untouched: 36 rows
```

Reading it:

- The source is healthy, reachable, and the whole dataset arrives in **4 seconds**
  in one request.
- **8 records are already known** and would be skipped without being re-stored.
- **7 records are about cars this catalogue carries.** Those are what would
  produce review proposals — a handful, which is the right size for a person.
- **1,303 records are cars the catalogue does not have**, and would become
  new-car candidates. **This is the finding that needs your decision — see N.1.**
- `Car` untouched, as it is after every run of every kind.

The queue was empty at the time of this run because the five proposals that were
in it had just been approved by hand — see N.4, which is the other item needing
your attention.

`npm run crawl:status` (contacts nothing) reports the same plan.

---

## N. Remaining blockers

### 1. A first live run raises 1,303 new-car candidates — needs your decision

This is the one item that should be settled before scheduling, and it is a policy
question rather than a defect. Discovery works exactly as Phase 4 specified: a car
a source describes that the catalogue lacks becomes a `CarCandidate`, never a
`Car`, and waits for a person.

The trouble is arithmetic. Open EV Data is a global dataset of 1,321 electric
vehicles; this catalogue is 36 cars sold in Pakistan. Almost every record is a car
that is not sold here and never will be, so a first run would deliver a queue of
1,303 rows that are individually correct and collectively unusable — and an
operator who opens that once will not open it again.

Mitigations do not make this go away on their own:

- Candidates **upsert on identity**, so the queue does not grow by 1,303 every
  morning, and a rejection is never re-raised. The flood is once, not daily.
- `--budget` spreads it over days rather than reducing it.

Three real options, for you to choose:

| Option | Effect | Cost |
| --- | --- | --- |
| **(a) Accept it once** | Run live, then reject in bulk at `/admin/cars/updates`, keeping the handful worth adding. | One triage session. Honest, and you see what the source actually holds. |
| **(b) Gate discovery by brand** | Only raise candidates for brands the catalogue already carries. Cuts 1,303 to roughly a dozen. | A small change to `crawler/discover.ts` plus a per-source switch. Risks missing a genuinely new brand entering the market — which is arguably the most valuable thing discovery could find. |
| **(c) Turn discovery off for global sources** | `openev` proposes changes to existing cars only. | Smallest change. Gives up new-car discovery from the only connected source until a Pakistani one exists. |

**My recommendation: (a), with the first live run capped.** Run
`npm run crawl:daily -- --budget 200` for the first few days: the budget takes
never-seen records first, so you see a real sample of what the candidate queue
will contain before committing to triaging all of it — and you can then choose (b)
or (c) knowing what you are choosing against. What you should *not* do is
schedule an unattended run before deciding, because the queue that arrives is the
thing you would then be deciding under pressure.

### 2. Still no Pakistani source

The pipeline's largest gap, unchanged since Phase 2. Open EV Data holds no
Pakistani pricing or availability and is trusted for none of it —
`fieldTrust.pakistanPrice` is `0`, so it cannot overwrite a local figure even if it
published one. The priority configuration is ready for a local source; there is
simply nothing to put in it. **A distributor's published price list would be worth
more than any aggregator**, and is the single highest-value thing that could be
added to this project.

### 3. Approvals cannot name a person

`CarChangeHistory.approvedBy` records the constant `'admin'`, because the portal
authenticates with one shared password and the session cookie carries no subject.
This was reviewed on 2026-08-26 and deliberately left honest rather than papered
over: an env-var operator name was considered and rejected, because two people
sharing one password would both be recorded as whoever the variable named, and an
audit trail that can name the *wrong* person is more dangerous than one that
admits it does not know.

**Before more than one person uses the portal**, admin access needs real per-user
accounts — a change to `src/lib/admin-auth.ts` and the login route, not to the
constant. Documented in `docs/SETUP.md`.

### 4. The five `byd-seal` proposals were approved mid-session, and two look wrong

**This happened during this work, and it is live on the public catalogue now.**

At 09:35 today, all five remaining proposals were approved through
`/admin/cars/review` and applied to `byd-seal`:

| Field | Was | Now | Source |
| --- | --- | --- | --- |
| `batteryCapacity` | 61.44 | **87** | openev |
| `range` | 650 | **425** | openev |
| `dcCharging` | — | 140 | openev |
| `acCharging` | — | 11 | openev |
| `connectors` | CCS2, Type 2 | Type 2, CCS2 | openev |

Not by anything in this phase's work: the approvals carry `approvedBy: 'admin'`,
which only the server actions in `car-review-actions.ts` set — the web UI — and
they are spaced one to three seconds apart, which is somebody clicking five
buttons. The dev server on port 3000 was running throughout. The verification
suites use a fixture source and the collapse script only ever supersedes, so
neither can produce these rows.

Everything about the mechanism worked: an admin session, the licence gate passed
(openev is registered), each write validated, and five `CarChangeHistory` rows
recording the old value, the new value, the source and the timestamp.

**But the two figures I had flagged as suspicious are the two that got applied,
and I think they are wrong.** The evidence:

- `batteryCapacity` 61.44 → 87. **61.44 kWh is the BYD Seal Dynamic's pack** —
  the variant sold in Pakistan, and what `src/data/cars.ts` authored deliberately.
  The long-range Seal is 82.5 kWh usable. **87 kWh is not a documented Seal pack
  size at all**; it looks like a nominal figure for a different variant.
- `range` 650 → 425. openev's adapter sets `rangeStandard` to **`'unspecified'`**
  on purpose, because the dataset does not say which test cycle its range comes
  from. So a 425 whose cycle nobody knows replaced a 650 whose cycle nobody knows
  either. Those two numbers are not comparable, and the swap loses the provenance
  rather than improving the figure.

  > **Corrected 2026-08-27.** This paragraph originally read "a 650 that was
  > almost certainly CLTC". **No test cycle is proven for the 650 km figure, and
  > nothing in this repository supports CLTC or any other cycle.** The audit of
  > that date established: `rangeStandard` is null on the catalogue row; every one
  > of the 15 Open EV Data Seal records carries `rangeStandard` of `null` or
  > `'unspecified'`; and the 650 was authored by hand in the initial commit
  > `1c03db3` from a supplied price list that is not in this repository and
  > recorded no cycle. The phrase "almost certainly CLTC" was an inference, and
  > repeating it in a document that exists to enforce cycle discipline was the
  > wrong place for one. **The 650 km figure is unresolved and unattributed** —
  > it also matches no source record for any Seal variant (the published values
  > are 360, 370 and 425), and the record for the declared
  > `61.4 kWh RWD Comfort` trim states **370 km**. The original wording is quoted
  > here rather than deleted, because the reasoning that followed from it is part
  > of the record.

Together they are the signature of a record matched to the right **car** and the
wrong **variant**. The matcher paired the source record to `byd-seal` on brand and
model — "BYD Seal" — and the Seal is sold in at least two quite different battery
and range configurations.

**This is the underlying gap, and it matters more than the one car:** matching is
brand-and-model, so a source's long-range variant can confidently match a
catalogue entry describing the standard one, and every daily run would re-propose
the same mismatched specifications. `dcCharging` 140 kW and `acCharging` 11 kW
are plausible for either variant and are probably fine; the pack and the range are
not.

> **Update, 2026-08-27 — Phase 4.1 addresses this.** Variant-level identity is now
> implemented and the figures are gated: `applyChange` refuses any variant-level
> field whose trim is unproven, and the five changes below are marked
> REVIEW REQUIRED (not reverted). The diagnosis turned out to be worse than stated
> here — five variants matched this one row, and three of the five applied figures
> came from the wrong one — and there was a second defect that attributed every
> proposal to the wrong record. Full analysis in
> **[PHASE4.1-VARIANT-IDENTITY.md](PHASE4.1-VARIANT-IDENTITY.md)**.

**Recommended, in order:**

1. **Decide on `byd-seal`.** I have not reverted anything — five people-made
   approvals are not mine to undo. The revert is exact and available: every old
   value is in `CarChangeHistory` (`carId = 'byd-seal'`, approved 2026-08-27
   09:35), and putting them back through the car editor writes its own history
   rows. My reading is that 61.44 kWh and 650 km should go back.

   > **Updated 2026-08-27.** Both were put back, through
   > `scripts/declare-variant-identity.ts`. 61.44 kWh is corroborated — the
   > declared trim's own source record states 61.4 kWh. **650 km is not**, and
   > restoring it should be read as undoing a wrong-variant write rather than as
   > establishing the figure. It remains unresolved, with no cycle and no source
   > record stating it. See the correction note above.
2. **Add variant to matching before scheduling.** Otherwise this recurs every
   morning, unattended, on any car sold here in one variant and listed abroad in
   several. `crawler/match.ts` already carries `variant` and `modelYear` through
   `MatchInput` — they are simply not required to agree. Making a variant
   *disagreement* downgrade a match from `confident` to `probable` would route
   these to high-risk instead of `safe`/`review`, which is where they belong.
3. **Consider requiring `rangeStandard` to agree** before a range is proposed. A
   range without its cycle is not comparable to another range, which the adapter
   already knows and the comparison layer does not yet act on.

### 5. Push to the remote is still blocked

`git push` to `alisalman81r-ai/PlugPK` returned 403 on credentials in the previous
session. Nothing in Phase 4 is committed or pushed. Unrelated to the crawler, but
it means none of this work is backed up off this machine.

---

## What was verified

| Suite | Coverage | Result |
| --- | --- | --- |
| `crawl:verify` | Phase 1 pipeline, adapters, access refusals | **Pass** |
| `crawl:verify-review` | Phase 2/3 review, price display, history | **Pass** |
| `crawl:verify-fixes` | Phase 3 fixes, against the real database | **Pass** |
| `crawl:verify-schedule` | Scheduling, backoff, health, staleness, idempotency, rate limiting, redaction, discovery — 18 groups | **Pass** |
| `crawl:verify-daily` | **The daily pipeline end to end — 144 checks** | **Pass** |
| `tsc --noEmit` | Whole project | **Clean** |
| `next build` | Whole site, including `/credits`, `/api/crawler/daily`, the rebuilt dashboard | **Clean** |

`crawl:verify-daily` is new, and is the suite that did not exist before this phase.
It drives `crawler/pipeline.ts` — the same orchestration the command and the
trigger run — against a fake store, fake adapters and a fixed clock, covering all
nineteen scenarios asked for plus four more:

1. daily successful crawl · 2. unchanged crawl · 3. changed specification ·
4. changed price · 5. failed source · 6. partial source failure · 7. retry ·
8. stale source · 9. new car discovery · 10. duplicate discovery ·
11. large price change · 12. dry run · 13. repeated identical crawl ·
14. multiple sources · 15. conflicting sources · 16. robots restriction ·
17. rate limiting · 18. database failure · 19. scheduler failure ·
20. conditional requests · 21. budget and priority · 22. run modes ·
23. attribution before publication

The fake store implements `PipelineStore`, which has **no method that can write to
`Car`**. "The crawler did not touch the catalogue" is therefore not an assertion in
these tests — it is a property the compiler checks on every build.

---

## Cleanup completed

- `scratch-inspect.ts` and `scratch-collapse.ts` — **removed.** Confirmed
  unreferenced one-offs. The collapse logic was promoted to
  `scripts/collapse-duplicate-proposals.ts`, dry-run by default.
- **The 15 duplicate proposals — resolved.** All 15 were 5 fields × 3 identical
  runs on `byd-seal` from `openev` on 2026-08-25. 10 older rows were marked
  `superseded`; **nothing was deleted**, and each keeps its values and its
  reasoning. The 5 genuine proposals that remained were then approved by hand
  through the portal later the same morning — see N.4, which is worth reading. The
  script refuses to collapse duplicates whose proposed values *differ*: that is a
  source changing its mind, not a duplicate, and picking one silently would be
  wrong.
- `testA` / `testB` — **verified absent** across all nine tables that could hold
  them.
- **Open EV Data attribution — discharged**, and now enforced. See K.
- One additive migration applied; four nullable/defaulted columns on `CarSource`.

---

# DAILY CRAWLER IS BUILT BUT NOT ACTIVATED

No scheduled task is registered. No systemd timer is enabled. `CRAWLER_ENABLED` is
unset, so the HTTP trigger returns 404. Activation requires one deliberate command,
documented in section B, and it is yours to give.

Before you give it, settle two things:

- **N.1** — the 1,303-candidate question. Scheduling first would leave you
  triaging that queue under pressure instead of choosing how to shape it.
- **N.4** — variant-level matching. A `byd-seal` record matched the right car and
  the wrong variant, and two questionable figures reached the public catalogue
  this morning as a result. Unattended, that recurs every day.
