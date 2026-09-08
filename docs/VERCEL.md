# Deploying plug.pk to Vercel

Status: **not deployable as it stands.** Two things in the application are
built on a writable local filesystem, which Vercel does not have. Everything
else is ready, and this file says exactly what the two are, why they block, and
what each costs to fix.

Read the blockers before scheduling the deploy. Neither is a configuration
setting — both are decisions about where data lives, and one of them needs a
provider account before any code can be written.

---

## Blocker 1 — the database is SQLite on disk

```
prisma/schema.prisma   provider = "sqlite"
.env                   DATABASE_URL="file:./dev.db"
.gitignore             prisma/dev.db
```

A Vercel function's filesystem is read-only apart from `/tmp`, and `/tmp` is
per-invocation — it is not shared between requests, does not survive a cold
start, and is not visible to any other function. So:

- Every write fails. Sign-up, reviews, saved cars, every admin edit.
- Reads fail too, because `prisma/dev.db` is gitignored and never uploaded.
  There is no database file in the deployment at all.

Seeding into `/tmp` at boot does not rescue this. Each function instance would
get its own copy, they would diverge immediately, and all of them would vanish.

**The fix is a hosted Postgres.** Vercel Postgres, Neon and Supabase all work;
Neon and Supabase have usable free tiers and both speak plain Postgres, so the
choice does not change the code.

Once a database exists:

1. `provider = "postgresql"` in `prisma/schema.prisma`.
2. `DATABASE_URL` in Vercel's environment settings (Production, Preview and
   Development each need their own).
3. **Delete `prisma/migrations/` and generate one fresh initial migration.**
   The 19 migrations in there were written against SQLite —
   `migration_lock.toml` declares `provider = "sqlite"` and the SQL uses
   `PRAGMA` and `DATETIME`, neither of which Postgres accepts. `prisma migrate
   deploy` does not translate them; it replays them verbatim and fails on the
   first one. The history is not worth keeping across an engine change: what
   matters is that the schema is reproducible, and `prisma migrate dev --name
   init` against the new database gives exactly that.
4. Move the data across. It is a small amount — 48 cars, 6 stations, 23
   reviews, no users. `data/catalogue-snapshot.json` plus
   `scripts/fill-car-gaps.ts` restores the catalogue; the rest lives only in
   `prisma/dev.db` and needs exporting first.

**Check the SQLite-isms before assuming a clean swap.** Postgres is stricter,
and two differences in this schema are worth looking at specifically: SQLite
has no native `DateTime`, so anything relying on string ordering of dates
changes behaviour, and SQLite's `contains` is case-insensitive by default while
Postgres's is not — `searchCars()` in `src/lib/cars.ts` and the crawler's
matching both filter on `contains`. Budget time to test search and the crawler,
not just the build.

## Blocker 2 — admin uploads write to `public/uploads`

`src/lib/db/upload-actions.ts` does `mkdir` and `writeFile` under
`public/uploads` and stores the path in the row. Same filesystem, same problem:
the write throws in production, and anything already written locally is
gitignored so it is not in the deployment either.

**The fix is object storage** — Vercel Blob is the least work here, S3 or
Cloudflare R2 if you want it portable. The change is contained: the upload
action returns a URL instead of a path, and `next.config.mjs` gains a
`remotePatterns` entry for the bucket host so `next/image` will serve from it.

Existing images are fine either way. The 48 catalogue photographs are committed
under `data/catalogue-images/` and served from `public/images/cars/`, so the
public site does not depend on the upload path — only the admin portal does.

---

## What is already done

- **`postinstall: prisma generate`.** Vercel restores `node_modules` from cache
  without re-running installs, so Prisma Client has to be generated explicitly
  or the build gets a stale one.
- **Build verified.** `NEXT_DIST_DIR=.next-verify npm run build` compiles clean
  and prerenders 137 pages.
- **Fonts are local.** `src/app/fonts/` with `next/font/local`, so the build
  makes no request to fonts.googleapis.com and cannot fail or silently fall back
  on a network hiccup. See the note in `src/app/layout.tsx`.
- **No `vercel.json` needed.** Framework detection, the build command and the
  output directory are all correct by default for App Router.

## Environment variables to set in Vercel

Everything in `.env.example`, and these in particular:

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | The Postgres URL from blocker 1. |
| `SESSION_SECRET` | Signs user and admin cookies. Generate a fresh one — do not reuse the local value. |
| `ADMIN_PASSWORD` | Admin portal login. |
| `ENABLE_ADMIN` | Leave unset in production unless the portal is meant to be reachable. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Public by nature — restrict it by HTTP referrer to the deployed domain. |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | Map styling. |
| `CRAWLER_ENABLED` | Off unless the crawler is wanted in production. |
| `CRAWLER_TRIGGER_SECRET` | Required if the crawler endpoint is exposed. |

`NEXT_PUBLIC_` values are compiled into the client bundle and readable by
anyone. That is correct for the Maps key and wrong for everything else, so do
not rename a secret into that prefix to make it reachable in a component.

## Order to do it in

1. Provision Postgres, set `DATABASE_URL`, switch the provider, run
   `migrate deploy`.
2. Move the data across and test search and the crawler against Postgres.
3. Deploy. The public site works at this point.
4. Move uploads to blob storage before anyone uses the admin portal.
