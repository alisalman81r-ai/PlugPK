# The car data crawler

How external EV data reaches this catalogue, and what stops it reaching it by
accident.

The short version: a crawler reads published data, compares it against what the
catalogue holds, and files the differences as **proposals**. A person approves
each one. Nothing a source publishes appears on the public site without somebody
deciding it should.

---

## The one rule

**Crawled data never writes to `Car`.**

Every table the crawler writes to is a staging or history table. Exactly one
function in the codebase writes to `Car` — `applyChange` in
`src/lib/db/car-review-store.ts` — and it runs only when an operator approves a
proposal at `/admin/cars/review`, with an admin session, a validated value, and a
`CarChangeHistory` row written in the same transaction.

This is enforced by types, not by convention. `crawler/pipeline.ts` takes its
database access through a `PipelineStore` interface that has no method capable of
writing a car. If somebody adds one, the diff will say so.

---

## The pipeline

```
scheduler
   ↓
source health check          is this source due, enabled, permitted?
   ↓
access / robots check        may we fetch at all?  refuses before any request
   ↓
conditional request          If-None-Match → often a 304 and no work
   ↓
raw source record            CarSourceRecord, append-only
   ↓
normalisation                units, names, connector spellings
   ↓
validation                   is this figure possible?
   ↓
car matching                 which catalogue car is this about?
   ↓
field comparison             what differs, and do sources disagree?
   ↓
confidence calculation       how much should we believe it?
   ↓
change detection             is this news, or yesterday's payload again?
   ↓
review proposal              CarFieldChange — a proposal, never an edit
   ↓
── a person decides ──       /admin/cars/review
   ↓
car update                   applyChange, with history
   ↓
targeted revalidation        only the pages that actually changed
```

Each arrow is a module in `crawler/`. The orchestration that walks them is
`crawler/pipeline.ts`, and it is driven by tests in `crawler/verify-daily.ts` —
including the cases a real source will not perform on request: timing out,
answering 304, returning half a payload, throwing inside its own access check.

---

## Deployment: what this project actually is

**Read this before choosing a scheduler.** It is the part most likely to be
assumed wrongly.

This is a Next.js 14 App Router application with **Prisma on SQLite**, and it has
**no deployment configuration at all** — no `vercel.json`, no `Dockerfile`, no
`.github/workflows`, no CI. It is currently run with `npm run dev` on a Windows
workstation, and the database is a file at `prisma/dev.db`.

The SQLite file is the decisive fact:

- **A serverless host will not work for writes.** On Vercel, Netlify Functions or
  Lambda, the filesystem is ephemeral and per-invocation. A crawl would write
  1,300 staging rows to a disk that is discarded when the function returns, and
  the review queue would be empty every time you looked at it. This is not a
  configuration problem; it is the wrong shape of host for the database this
  project has.
- **Any host with a persistent disk and a long-lived process works.** A small VPS
  running `next start` behind nginx, a container with a mounted volume, or the
  workstation it is on now.

So the honest position is: **the deployment target has not been chosen yet**, and
the scheduler cannot be chosen for you. What is provided instead is a scheduler
for each of the plausible answers, plus a trigger that works when none of them
apply.

### Option 1 — Windows Task Scheduler (the machine this was built on)

```powershell
# See exactly what would be registered. Writes nothing.
powershell -ExecutionPolicy Bypass -File deploy\windows\register-task.ps1

# Dry-run crawls every morning at 06:00 — exercises everything, writes nothing:
powershell -ExecutionPolicy Bypass -File deploy\windows\register-task.ps1 -Activate -Dry

# The real thing:
powershell -ExecutionPolicy Bypass -File deploy\windows\register-task.ps1 -Activate

# Remove it:
powershell -ExecutionPolicy Bypass -File deploy\windows\register-task.ps1 -Activate -Unregister
```

Task Scheduler is a real scheduler: it survives reboots, retries on failure, and
runs missed jobs when the machine wakes. What it cannot do is run while the
machine is off or the user is logged out. If the catalogue must be current every
morning regardless of one laptop, this is the wrong host — see option 2.

Logs land in `logs/crawler/crawl-<date>.log`, pruned after 30 days.

### Option 2 — systemd timer (a Linux server)

```bash
cp deploy/linux/plugpk-crawler.{service,timer} /etc/systemd/system/
# edit the User, WorkingDirectory and EnvironmentFile in the .service first
systemctl daemon-reload
systemctl start plugpk-crawler.service     # one run, now, to watch it
journalctl -u plugpk-crawler -f

systemctl enable --now plugpk-crawler.timer   # ← this is the activation switch
```

Preferred where there is a choice. `Persistent=true` makes up a missed run
instead of silently skipping the day, `RandomizedDelaySec` keeps this off the top
of the hour, and the journal is the whole history without a log file to prune.
The unit file is hardened (`ProtectSystem=strict`, no new privileges, IPv4/IPv6
only) because a process that reaches the public internet and writes to a database
should not be able to do much else.

`deploy/linux/crontab.example` covers hosts without systemd.

### Option 3 — HTTP trigger (a host with no shell)

```
POST /api/crawler/daily
Authorization: Bearer $CRAWLER_TRIGGER_SECRET
{ "dry": true }
```

For a hosted scheduler, an uptime monitor, or anything else that can make a POST.
It runs the same `crawler/pipeline.ts` as the command — there is deliberately no
second implementation, because the one running unattended must not be the one
nobody tested.

Two gates, both off by default:

| Variable | Effect |
| --- | --- |
| `CRAWLER_ENABLED` | Anything other than exactly `true` makes the route return **404**, identical to a path that was never built. **This is the activation switch.** |
| `CRAWLER_TRIGGER_SECRET` | Bearer token, minimum 32 characters, compared in constant time. Never accepted as a query parameter — a secret in a URL is written to every access log it passes through. |

Generate the secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

One run at a time per process: a scheduler that retries on timeout will fire this
twice, and two writers against one SQLite file is not a thing to allow.

---

## Commands

Every one of these is safe to run twice. A record whose payload has not changed is
skipped, and a run that fails leaves the catalogue exactly as it was.

| Command | What it does |
| --- | --- |
| `npm run crawl:status` | What would run, and what is stale. **Contacts nothing, writes nothing.** |
| `npm run crawl:dry` | A full pass — fetches, matches, classifies — and **writes nothing**. Reports what *would* change. |
| `npm run crawl:daily` | Every source that is due. Proposals only. |
| `npm run crawl:all` | Every *enabled* source, ignoring cadence. Does not override the enabled switch. |
| `npm run crawl:car -- byd-seal` | One car, by slug or name. |
| `npm run crawl:daily -- --source openev` | One source, ignoring its cadence but never its access check. |
| `npm run crawl:daily -- --cars a,b,c` | Several named cars. |
| `npm run crawl:daily -- --budget 200` | Stop after 200 records per source. The rest are **deferred**, not dropped — the next run takes them first. |
| `npm run crawl:daily -- --limit 20` | Ask the source for at most 20 records. |
| `npm run crawl:verify-all` | All five verification suites. |
| `npm run db:collapse-duplicates` | Supersedes older duplicate pending proposals. Dry by default; `--apply` to write. |
| `npm run db:variant-identity` | Which cars declare a variant, which do not, and suggested splits. Read-only. |
| `npm run db:analyse-seal` | The variant analysis of the approved `byd-seal` changes. Read-only unless `--mark-review`. |
| `npm run crawl:verify-variant` | The Phase 4.1 suite: 108 checks over variant identity. |
| `npm run db:remove-test-sources` | Removes anything left behind by a test source. |

A dry run **reads**. It looks up stored payload hashes so it can tell you how many
records would actually change, and it runs the matcher and the discovery
classifier so it can tell you how many would land in the review queue versus the
candidate queue. Only writing is suppressed. (This was the other way round at
first, and made the rehearsal useless: every record came back classified as new.)

---

## Sources, and what each one permits

Cadence is **per source** and configurable from `/admin/cars/updates`. Nothing is
crawled daily because daily is the default — it is crawled daily because its
publisher's terms permit it.

| Source | Access | Cadence | Status |
| --- | --- | --- | --- |
| **Open EV Data** | Published JSON dataset, MIT + attribution. One request for the whole set. No credentials, no scraping. | Daily, conditional — an ETag usually makes it a 304. | **Live.** The only connected source. |
| **EV Database (evdb)** | No public API and no licence permitting bulk reuse. `access()` refuses; `fetch()` throws. | — | Blocked in code, with what would be needed recorded in `crawler/sources/evdb.ts`. |
| **vehdb** | Domain did not resolve when investigated. | — | Blocked in code. |
| **evspecsx** | Would need permission and a licence. | — | Blocked in code. |

A blocked adapter is still worth having: it records in code what was
investigated and what would be required, instead of in somebody's memory of a
conversation.

**There is still no Pakistani source.** It is the pipeline's largest gap. Open EV
Data holds no Pakistani pricing or availability and is trusted for none of it —
`fieldTrust.pakistanPrice` is `0`, so it cannot overwrite a local figure even if
it published one. A distributor's published price list would be worth more than
any aggregator.

### Respecting the terms

- `robots.txt` is checked before any request, stored on the source, and a status
  other than `allowed` blocks the crawl. `unchecked` is not permission.
- An access check that **throws** is treated as a refusal, not as permission. A
  network blip inside `access()` must not become a request we were not entitled
  to make.
- Requests are spaced by the source's own `requestDelayMs` (default 1.5s), one at
  a time per source.
- Retries are bounded: three attempts, exponential backoff with jitter. A 4xx is
  never retried — repeating it changes nothing except the host's opinion of us.
  429 is the exception, because it explicitly asks us to wait.
- After a failure the interval **doubles**, capped at 8×. A source that is down
  does not become available faster for being asked more often. One success resets
  it.

---

## Variant identity

A confident match establishes the **model**. It says nothing about the **trim**,
and a battery capacity, a range, a power figure and a price all belong to a trim.

That distinction was missing until Phase 4.1, and it cost a wrong figure on a
public page: five Open EV Data records for five BYD Seal variants all matched the
one `byd-seal` row with equal confidence, and an 87 kWh figure overwrote the
61.44 kWh the catalogue held.

- `crawler/identity.ts` decides whether the variant is **proven**, **unproven**,
  **ambiguous** or a **mismatch**. Exact comparisons only — no edit distance, no
  similarity score, and a variant is never inferred from a name or a battery size.
- A variant-sensitive field (battery, range, power, charging, price, model year) is
  **refused** while the variant is unproven — not merely flagged. A risk label was
  in place when the incident happened and was approved through anyway.
- `Car.variant` being null means *this row does not declare a variant*, never
  *any variant*. All 36 rows are in that state today, so run
  `npm run db:variant-identity` and declare the trims you can confirm.
- Identity is re-checked at approval time, so declaring a variant unblocks a
  pending proposal immediately with no re-crawl.

A range figure also carries its test cycle — WLTP, EPA, CLTC, NEDC, JC08 or
unspecified — and figures from different cycles are never swapped for one another.
There is no conversion between cycles, because there is no honest one.

Full detail: **[PHASE4.1-VARIANT-IDENTITY.md](PHASE4.1-VARIANT-IDENTITY.md)**.

---

## Licences and attribution

Two of the licences this site depends on require visible credit. `/credits` is
where it is given, linked from the footer of every page.

This is enforced, not documented. `src/data/dataSources.ts` holds each source's
licence and the exact credit line it asks for, and `applyChange` refuses to
publish a proposal from a source that is not in it:

> Not applied — No licence has been recorded for the source "x". Add it to
> `src/data/dataSources.ts`, having read its terms, before publishing its data.

A source missing from that file is not a source with no licence; it is a source
whose licence nobody has recorded reading, and those look identical from the
approval screen. The `/credits` page renders the same array the gate checks, so a
source that *can* be published from is necessarily one that *is* credited — there
is no second list to keep in sync.

**Adding a source means adding its entry at the same time**, having read its
terms. Failing to costs you one entry in a file; assuming costs a licence breach
on a commercial site, found by the licensor.

---

## Failure behaviour

The property that makes an unattended daily job safe: **a failed crawl leaves the
catalogue byte-identical to before it.**

| What happens | What the crawler does |
| --- | --- |
| Source unreachable | Run closed `failed`, failure count incremented, validators cleared. **No car touched. No price nulled. No record marked missing. No candidate withdrawn.** |
| Some records fail, some arrive | Run closed `partial`. Counts as a **success** for health — the source is plainly reachable — so a working source is not put into backoff over one bad row. The ETag is *not* stored, so the failed records are retried tomorrow. |
| `robots.txt` disallows | Run closed `blocked`. **Not a failure** — declining to fetch is the system working, and counting it as a failure would grow a backoff against our own decision. |
| Source answers 304 | Run closed `completed` with 0 records. Counts as a **success**, so a source with no news does not go stale. Does not move `lastChangedAt`. |
| Database write fails on a record | That record is counted failed; the run continues. |
| Database disappears mid-run | Bookkeeping failures are collected and reported rather than raised, so the remaining sources still run and a report still comes back. |
| The process is killed | The `CrawlRun` row stays marked `running`. It holds no lock and wrote nothing to the catalogue. `/admin/cars/updates` reports it as unfinished rather than tidying the interruption away. |
| A source has no adapter | Skipped, writing nothing at all — not recorded as a failure, so an unimplemented source does not drift into looking stale. |

### Stale is a label, never a deletion

Staleness is measured from the last **success**, never the last attempt. A source
failing every morning for a week has a fresh `lastCrawledAt` and week-old data,
and only the success timestamp tells them apart. A stale source keeps every figure
it has already contributed: an outage must never empty a catalogue.

The dashboard distinguishes `healthy` / `degraded` / `failing` / `stale` /
`blocked` / `never-run`, worst-first.

---

## Idempotency

Every record's normalised payload is hashed, with volatile provenance stripped
first. `fetchedAt` is the whole of that list and the whole of the problem: hashing
it verbatim gave a different hash every morning for a byte-identical car, and
change detection reported all 8 of 8 records as changed on a re-run minutes apart.

An unchanged payload is skipped **entirely** — not re-stored, not re-compared, not
re-proposed, and its image is not re-fetched. On a daily schedule that is most
records, which is why a run can be cheap.

Nothing is ever destroyed. A re-crawl accumulates as history:
`CarSourceRecord` is keyed on `(sourceId, sourceUrl, runId)` so "this price
changed last Tuesday" stays answerable.

---

## Incremental scope

Two mechanisms, in order of value:

1. **Conditional requests.** The ETag and `Last-Modified` from the last
   successful fetch are replayed as `If-None-Match` / `If-Modified-Since`. The
   cheapest possible run is one the source answers 304 — no payload, no hashing,
   no work. Validators are cleared after any failure and after any run that left
   work undone, so a recovered source cannot answer 304 to a token from before an
   outage and record a clean success having fetched nothing.
2. **Priority ordering and a budget.** When there *is* a payload, records are
   processed worst-news-first: never-seen, then changed, then stale, then
   unchanged. A `--budget` caps the run, and what it leaves is **reported as
   deferred** and taken first next time. A silently truncated run reads as full
   coverage, which is the most misleading thing a capped crawl can do.

Targeted runs (`--car`) deliberately send no validators: `--car byd-seal` wants
that car's current data, and a 304 for the whole dataset is a true statement and a
useless answer.

---

## Where to look

| Path | |
| --- | --- |
| `crawler/pipeline.ts` | the orchestration; takes its dependencies as interfaces |
| `crawler/daily.ts` | the command line over it |
| `crawler/live-deps.ts` | the real Prisma/adapter/limiter wiring |
| `crawler/schedule.ts` | cadences, due-ness, backoff — the only place an interval is written down |
| `crawler/health.ts` | what a run does to a source's health, as pure functions |
| `crawler/incremental.ts` | priority ordering and budgets |
| `crawler/limiter.ts` | concurrency, spacing, timeouts, retries |
| `crawler/logger.ts` | structured logging, with redaction that is not optional |
| `crawler/discover.ts` | what to do with a record that matched nothing |
| `crawler/policy.ts` | how risky a proposed change is |
| `crawler/verify-daily.ts` | the nineteen things that must be true of an unattended run |
| `deploy/` | the schedulers |
| `/admin/cars/updates` | today's crawl, health, runs, candidates, failures |
| `/admin/cars/review` | the queue where a person decides |
| `/credits` | the licence obligations, discharged |

---

## Secrets

No API key, token or password is in source. Everything comes from the
environment, and `crawler/logger.ts` redacts anything shaped like a credential at
the single point where logging happens — message, error text and URL — rather than
leaving each caller to remember. A log table is exactly where a credential leaks
and stays: it is written by the least carefully reviewed code path, read by the
most widely shared one, and kept indefinitely. The redaction is tested.

Crawler writes are server-side only. Nothing in the browser bundle can reach them.
