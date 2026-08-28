# Crawler

External EV data gathering. Lives apart from the application on purpose: nothing
in `src/` imports from here, and this directory imports from `src/lib/db` only —
never from a component, a page or a server action. So the crawler can be run,
changed or thrown away without the site noticing.

**→ [../docs/CRAWLER.md](../docs/CRAWLER.md) is the full documentation**: the
pipeline, the deployment and scheduler choice, what each source permits, the
failure behaviour, and the licence obligations. This file covers the directory
itself.

## Status

All four phases are built. **Scheduled crawling is not switched on** — see
[../docs/PHASE4-PRODUCTION-CHECK.md](../docs/PHASE4-PRODUCTION-CHECK.md).

| Phase | | |
| --- | --- | --- |
| 1 | Fetch, extract, normalise, stage | ✅ |
| 2 | Match to catalogue cars, source priority, licences | ✅ |
| 3 | Compare, score confidence, propose, review queue | ✅ |
| 4 | Schedule, health, idempotency, discovery, dashboard | ✅ built, **not activated** |

The one rule, unchanged since phase 1: **crawled data never writes to `Car`.**
Every value becomes a proposal, and a person approves it. `crawler/pipeline.ts`
takes its database access through an interface with no method capable of writing a
car, so this is checked by the compiler rather than by review.

## The one rule's corollaries

Nothing here deletes anything, ever — including cars a source has stopped listing.
Nothing here fetches a source whose access check did not return `allowed`. And a
failed crawl leaves the catalogue byte-identical to before it: no field is nulled,
no record marked missing, no candidate withdrawn. An outage must never empty a
catalogue.

## Layout

| File | |
| --- | --- |
| `pipeline.ts` | the orchestration, with its dependencies as interfaces |
| `daily.ts` | the command line over it |
| `live-deps.ts` | the real Prisma / adapter / limiter wiring |
| `run.ts` | one source, on demand |
| `propose.ts` | turn staged records into proposals, on demand |
| `sources/` | one adapter per source, including the ones that refuse |
| `adapters.ts` | the registry. Does nothing when imported |
| `schedule.ts` | cadences, due-ness, backoff — an interval is written down once |
| `health.ts` | what a run does to a source's health, as pure functions |
| `incremental.ts` | priority ordering and per-run budgets |
| `limiter.ts` | concurrency, spacing, timeouts, bounded retries |
| `logger.ts` | structured logging, with redaction that is not optional |
| `robots.ts` | robots.txt parsing |
| `normalise.ts`, `units.ts`, `model.ts` | into the internal vehicle shape |
| `match.ts`, `match-input.ts` | which catalogue car is this about |
| `compare.ts`, `confidence.ts`, `policy.ts`, `priority-config.ts` | what differs, how much to believe it, how risky it is |
| `discover.ts` | what to do with a record that matched nothing |
| `proposals.ts` | staged records → reviewable proposals |
| `report.ts` | a run report as text, for a terminal or a log |

## Verification

Five suites. The first four need no network; `verify-fixes` and `verify-review`
use the real database and clean up after themselves.

```bash
npm run crawl:verify-all          # all five

npm run crawl:verify             # phase 1: fixtures, adapters, access refusals
npm run crawl:verify-review      # phases 2–3: review, price display, history
npm run crawl:verify-fixes       # phase 3 fixes, against the database
npm run crawl:verify-schedule    # phase 4 units: schedule, health, limiter, redaction
npm run crawl:verify-daily       # phase 4 end to end: 144 checks, 23 scenarios
```

`verify-daily.ts` drives `pipeline.ts` — the same orchestration the command and
the HTTP trigger run — against a fake store, fake adapters and a fixed clock. That
is the only way to test the cases a real source will not perform on request:
timing out, answering 304, returning half a payload, failing a database write on
one record, throwing inside its own access check.

Before that suite existed, the tests covered the pure functions around the loop —
which is to say everything except the loop. "A failed source does not modify
`Car`" was an assertion in a comment.

## Running a crawl

```bash
npm run crawl:status    # what would run, and what is stale. Contacts nothing
npm run crawl:dry       # a full pass that writes nothing
npm run crawl:daily     # every source that is due
```

A dry run **reads** — it looks up stored hashes and runs the matcher, so it can
tell you what *would* change rather than only how much data exists. Only writing
is suppressed. The full command list is in
[../docs/CRAWLER.md](../docs/CRAWLER.md).

## The smoke test

```bash
npm run crawl:smoke                          # against example.com
npm run crawl:smoke -- https://example.org   # against any other URL
```

Playwright, kept from phase 1 and still useful: it proves a real browser works
here, which matters for any future source that needs one. No connected source
does — Open EV Data publishes JSON, and scraping a rendered page for data the
maintainer publishes as a file would be slower, more fragile and ruder.

It checks five things and exits non-zero if any fail, so it works in a `&&` chain
without anyone reading the output:

1. Chromium launches
2. The page opens with a 2xx/3xx status
3. The title is readable
4. The DOM is queryable — an `h1` has text
5. The browser closes

Step 4 matters more than it looks. `page.title()` can succeed against a page that
never rendered, because the title is available straight from the markup; querying
an element is what proves a DOM was actually built, which is the only reason to
use a browser instead of `fetch()`.

**Why `example.com`:** IANA reserves it for documentation and testing, so pointing
a browser at it raises no terms-of-service or rate-limit question. It is also
small and unusually stable — which is what a smoke test needs, so a failure means
the problem is local rather than remote.

## Conventions this follows

**TypeScript run through `tsx`**, with no build step, matching `db:seed` and
`import:stations` in `package.json`.

**Type-checked with everything else.** The root `tsconfig.json` includes
`**/*.ts`, so files here are covered by `npm run type-check` and by `next build`.
Nothing extra was configured to achieve that, and nothing was excluded to avoid
it.

**Modules that do nothing when imported.** `adapters.ts` exists because the
registry used to live in `run.ts`, which calls `main()` at module scope — so
importing the registry from the scheduled runner would have run the single-source
command as a side effect of starting the daily one.

**Never leaves a browser running.** `smoke.ts` closes the browser in a `finally`,
whichever step throws. Headless Chromium leaves nothing on screen to say it is
still there, so a leak is invisible until the machine is out of memory.

**Says who it is.** Requests carry a `PlugPK-crawler/0.1` user agent with a
contact address. It is the first thing a site operator will look at when deciding
whether to block us.

**No secrets, anywhere.** Nothing here reads a credential from source, and
`logger.ts` redacts anything shaped like one at the single point where logging
happens — message, error text and URL alike. A log table is exactly where a
credential leaks and stays: written by the least reviewed code path, read by the
most widely shared one, kept indefinitely.
