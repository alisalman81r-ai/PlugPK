# Plug.pk

Pakistan's EV ecosystem platform — a charging map, a route planner with charging
stops, an electrified car catalogue, an owners' community, and a directory of
services and partner venues. Next.js 14 App Router, TypeScript, Prisma on
PostgreSQL, Tailwind.

There was no README in the repository until now, only a workspace note sitting
outside it — so a clone opened with no idea what to run first. Start here.

## Getting it running

```bash
npm install
npm run db:local                  # in its own terminal — a real Postgres on :55432
cp .env.example .env              # then paste the DATABASE_URL it printed
npm run dev
```

`npm run db:local` downloads a Postgres server into `.localdb/` on first run,
creates a UTF8 cluster, applies the migration and imports all 155 rows from
`data/db-export/`. Later runs just start it. Ctrl-C stops it and keeps the data.

Prefer a hosted database (Neon, Supabase)? Point `DATABASE_URL` at it and run:

```bash
npx prisma migrate deploy
npx tsx scripts/import-db.ts      # -> 155 rows imported in 1 pass
```

**[docs/SETUP.md](docs/SETUP.md) is the full version**, including why `/admin`
returns 404 on a fresh clone and how to turn it on.

**Deploying to Vercel?** [docs/VERCEL.md](docs/VERCEL.md) is the runbook, and
**[docs/CLAUDE-VERCEL-PROMPTS.md](docs/CLAUDE-VERCEL-PROMPTS.md)** is the same
work expressed as prompts to hand to Claude Code, in Roman Urdu with the
copy-paste blocks in English.

## What is where

| Path | |
| --- | --- |
| `src/app/(main)/` | the public site — map, routes, cars, community, partners |
| `src/app/admin/` | operator portal, gated by `ENABLE_ADMIN` + a password |
| `src/lib/db/` | every Prisma query and server action |
| `src/data/cars.ts` | the authored car seed, with provenance in comments |
| `prisma/` | schema and the Postgres migration |
| `data/db-export/` | every row of every table, as JSON — the deploy's data load |
| `docs/` | setup, the Vercel runbook, and the Claude prompt pack |
| `scripts/` | seeds, the export/import pair, verification, image fetching, screenshots |

## Scripts

| Command | |
| --- | --- |
| `npm run db:local` | a local Postgres with the data already in it |
| `npm run dev` | dev server on :3000 |
| `npm run build` | production build |
| `npm run type-check` | `tsc --noEmit` |
| `npm run db:seed` | stations, services, community, clubs, from mock-data.ts |
| `npx tsx scripts/seed-cars.ts` | the car catalogue, from src/data/cars.ts |
| `npx tsx scripts/import-db.ts` | load data/db-export/ into an empty database |
| `npx tsx scripts/verify-cars.ts` | exercises the catalogue's logic |
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
applied to `Car` only through the reviewed, validated write path. The crawler
itself has been removed from the project; its staging tables remain in the
schema, still holding the rows it left behind, and nothing reads them now.

## Things a clone does not have

`.env`, `public/uploads/`, `node_modules/`, `.localdb/` and Playwright's browser
binary — all deliberately untracked. All are rebuilt with `npm install`,
`npm run db:local` and `npx playwright install chromium`.
