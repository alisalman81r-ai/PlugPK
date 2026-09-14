# Plug.pk

Pakistan's EV ecosystem platform — a charging map, a route planner with charging
stops, an electrified car catalogue, an owners' community, and a directory of
services and partner venues. Next.js 14 App Router, TypeScript, Prisma on SQLite,
Tailwind.

There was no README in the repository until now, only a workspace note sitting
outside it — so a clone opened with no idea what to run first. Start here.

## Getting it running

```bash
npm install
cp .env.example .env             # then edit it — see docs/SETUP.md step 2
npx prisma migrate deploy
npx prisma generate
npm run db:seed                  # stations, services, community, clubs
npx tsx scripts/seed-cars.ts     # the 36-car catalogue — a separate seed
npm run dev
```

Both seeds are needed. `db:seed` does not touch the `Car` table, so running only
the first leaves `/cars` completely empty — which looks like a broken build
rather than a missing command.

**[docs/SETUP.md](docs/SETUP.md) is the full version**, including why `/admin`
returns 404 on a fresh clone and how to turn it on.

For the external data pipeline — how it works, what each source permits, and the
schedulers that are built but **not switched on** — see
**[docs/CRAWLER.md](docs/CRAWLER.md)** and
**[docs/PHASE4-PRODUCTION-CHECK.md](docs/PHASE4-PRODUCTION-CHECK.md)**.

## What is where

| Path | |
| --- | --- |
| `src/app/(main)/` | the public site — map, routes, cars, community, partners |
| `src/app/admin/` | operator portal, gated by `ENABLE_ADMIN` + a password |
| `src/lib/db/` | every Prisma query and server action |
| `src/data/cars.ts` | the authored car seed, with provenance in comments |
| `prisma/` | schema and 16 migrations |
| `crawler/` | external data pipeline — imports nothing from `src/` |
| `deploy/` | schedulers for the daily crawl. None is activated |
| `docs/` | setup, the crawler, and the Phase 4 production check |
| `scripts/` | seeds, verification, image fetching, screenshots |

## Scripts

| Command | |
| --- | --- |
| `npm run dev` | dev server on :3000 |
| `npm run build` | production build |
| `npm run type-check` | `tsc --noEmit` — covers `crawler/` too |
| `npm run db:seed` | stations, services, community, clubs |
| `npx tsx scripts/seed-cars.ts` | the car catalogue |
| `npx tsx scripts/verify-cars.ts` | exercises the catalogue's logic |
| `npm run crawl:verify-all` | all five crawler verification suites |
| `npm run crawl:status` | what a scheduled crawl would do. Contacts nothing |
| `npm run crawl:dry` | a full crawl that writes nothing |
| `npm run crawl:source -- openev --limit 5` | fetch a source into staging |
| `node scripts/fetch-car-images.mjs` | licensed car photos from Wikimedia |
| `node scripts/shoot.mjs login` | screenshot a page |

## Two conventions worth knowing before changing anything

**Nothing is invented.** A figure appears on the site only if a source supplied
it. A missing battery capacity is `null`, never a plausible number, and prices
that are not from a dealer list carry `(indicative)` inside the string that gets
printed — so the caveat travels to the card, the comparison and the detail page
rather than sitting in a footnote. Several rounds of this project's history were
spent removing invented member counts and padded statistics; please do not add
more.

**Crawled data does not enter the catalogue directly.** External sources land in
`CarSourceRecord` with their provenance, get matched conservatively, and are
applied to `Car` only through the reviewed, validated write path. See
`crawler/README.md`.

## Things a clone does not have

`.env`, `prisma/dev.db`, `public/uploads/`, `node_modules/`, and Playwright's
browser binary — all deliberately untracked. The first two are covered above; the
rest are rebuilt with `npm install` and `npx playwright install chromium`.
