# plugpk — setup guide

How to get plugpk running on a new computer, and how to move it to a different
backend (database, file storage or host). Follow the parts in order the first
time; each one ends with a check so you know it worked before moving on.

| Part | When you need it |
| --- | --- |
| [1. What you need](#1-what-you-need) | always |
| [2. Get the code](#2-get-the-code) | always — from GitHub or from the project zip |
| [3. Create `.env`](#3-create-env) | always |
| [4. Build the database](#4-build-the-database) | always |
| [5. Run it](#5-run-it) | always |
| [6. Become an admin](#6-become-an-admin) | to use `/admin` |
| [7. Change the backend](#7-change-the-backend) | moving to another database, file store or host |
| [8. Troubleshooting](#8-troubleshooting) | when something does not start |

**The stack, in one line:** Next.js 14 (App Router) and TypeScript, one app that
is both the frontend and the backend (pages, API routes and server actions live
together in `src/`), Prisma on PostgreSQL, Tailwind CSS, GSAP and Lenis for
motion.

---

## 1. What you need

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | 18.17 or newer (developed on 24) | includes `npm` |
| Git | any recent | only if you clone from GitHub |
| PostgreSQL | any 14+ | **not needed locally** — `npm run db:local` downloads its own |
| An SMTP mailbox | — | sign-up emails a 6-digit code; Gmail with an app password works |

Windows, macOS and Linux all work. Commands below are for a terminal in the
project folder (Git Bash, PowerShell, or a macOS/Linux shell).

---

## 2. Get the code

**From GitHub:**

```bash
git clone https://github.com/alisalman81r-ai/PlugPK.git plugpk
cd plugpk
npm install
```

**From the project zip** (`plugpk-project.zip`): unzip it, open the `plug.pk`
folder in a terminal, then still run:

```bash
npm install
```

The zip already carries `node_modules`, `.env` and `.env.local`, but some
packages (Prisma's engine, the image library `sharp`, the local Postgres binary)
are built for the computer they were installed on. `npm install` repairs them for
the new one and regenerates the Prisma client (`postinstall` runs
`prisma generate`). It is quick when `node_modules` is already there.

**Check:** `npx next --version` prints `Next.js v14.x`.

---

## 3. Create `.env`

`.env` holds the secrets and switches. It is never committed. (The zip has the
owner's copy — keep that zip private.)

```bash
cp .env.example .env
```

`.env.example` documents every variable in detail. Fill in at least these:

```ini
# ── Database ─────────────────────────────────────────────────────
# Local: printed by `npm run db:local` (step 4). Hosted: from Neon / Supabase.
DATABASE_URL="postgresql://plugpk:plugpk@127.0.0.1:55432/plugpk"
# The unpooled URL, used only for migrations. Locally, the same value.
DIRECT_URL="postgresql://plugpk:plugpk@127.0.0.1:55432/plugpk"

# ── Sign-in ──────────────────────────────────────────────────────
# Signs every login cookie. Generate one:
#   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
SESSION_SECRET=paste-the-generated-value-here

# ── Email (sign-up codes) ─ required, or sign-up refuses ──────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your-16-character-app-password
MAIL_FROM="plugpk <you@gmail.com>"

# ── Admin portal ─────────────────────────────────────────────────
# Exactly `true`, or every /admin URL is a 404.
ENABLE_ADMIN=true
```

Optional, all documented in `.env.example`:

| Variable | What it does if set |
| --- | --- |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | Google basemap; without them the map uses MapLibre + OpenFreeMap |
| `OPENCHARGEMAP_API_KEY` | lets `npm run import:stations` pull real stations |
| `BLOB_READ_WRITE_TOKEN` | uploads go to Vercel Blob instead of `public/uploads` |
| `LISTING_FEE_PKR`, `PAYMENT_*` | the partner listing fee and the bank / JazzCash / Easypaisa details shown at payment |
| `DEMO_PAYMENT_ENABLED` | `true` adds a test-only payment: code **0000** passes the listing-fee step (no money taken). Testing only, until Stripe is connected — leave empty in production |

**Never put a value behind `NEXT_PUBLIC_` unless it is safe to publish** — those
are sent to every browser.

---

## 4. Build the database

Pick one way.

### A. Local Postgres, one command (recommended for a computer)

In its own terminal:

```bash
npm run db:local
```

The first run downloads a real PostgreSQL server into `.localdb/`, creates a
UTF8 database on port **55432**, applies every migration in `prisma/migrations/`
and imports all the data in `data/db-export/`. Later runs just start it. It
prints the `DATABASE_URL` for `.env`. Ctrl-C stops it; the data stays.

You rarely need to run it by hand: `npm run dev` starts it in the background when
it is not already running (log in `.localdb/server.log`).

### B. A hosted Postgres (Neon, Supabase, your own server)

Put its URLs in `.env` (pooled in `DATABASE_URL`, direct in `DIRECT_URL` — see
[7.1](#71-move-to-another-database)), then:

```bash
npx prisma migrate deploy        # creates every table
npx tsx scripts/import-db.ts     # loads data/db-export/
```

`import-db.ts` refuses to run on a database that already has rows, so it can
never load twice.

### C. Seeds instead of the export (sample content)

```bash
npx prisma migrate deploy
npm run db:seed                  # stations, services, community, clubs
npx tsx scripts/seed-cars.ts     # the car catalogue — db:seed does NOT do cars
```

### What the data folder holds

`data/db-export/` is every row of every table as JSON, one file per table plus
`_manifest.json`. The committed copy is the catalogue and community content with
**no user accounts**. An export you take yourself (as in the project zip) includes
the accounts on that database too — keep such a copy private.

**Check:**

```bash
npx tsx scripts/verify-cars.ts   # prints ALL CHECKS PASSED
```

---

## 5. Run it

```bash
npm run dev                      # http://localhost:3000
```

`npm run dev` runs a preflight first and stops with a clear message if the port
is taken, the database URL answers nothing, or `.env` still points at SQLite.

The first page can take 20–40 s to compile in development; later pages are
faster. For a realistic speed check, run the production build:

```bash
npm run build
npm start                        # http://localhost:3000
```

**Check:** the home page shows the loading screen, then the hero; `/cars`,
`/map` and `/community` load. If `/cars` was empty when the server started,
restart it after loading data — Next caches rendered pages.

---

## 6. Become an admin

Admin access is a flag on an ordinary account; there is no shared admin
password.

1. `ENABLE_ADMIN=true` in `.env`, then restart the server.
2. Sign up at **/signup** (enter the emailed code), then from a terminal:

   ```bash
   npx tsx scripts/promote-admin.ts you@example.com
   ```

3. Sign out and back in at **/login** — you land on **/admin**.

The script is only needed for the first admin. After that, grant or revoke the
role from **Admin → Members → (person) → Role**. Every admin change is recorded
at **/admin/activity**. `--revoke` on the script removes the role.

The **business portal** (`/business`) opens for any account that owns a charger
or service listing; there is no separate switch.

---

## 7. Change the backend

The app is one Next.js project, so "the backend" is three separable pieces. Each
can move on its own.

| Piece | Where it is set | Default |
| --- | --- | --- |
| Database | `DATABASE_URL`, `DIRECT_URL` | local Postgres on :55432 |
| Uploaded files | `BLOB_READ_WRITE_TOKEN` | `public/uploads/` on disk |
| Host (where the app runs) | wherever you deploy | `npm run dev` / `npm start` |

### 7.1 Move to another database

Works for local → hosted, hosted → hosted, or one computer → another.

**1. Export everything from the old database.** With `.env` pointing at the OLD
database:

```bash
npx tsx scripts/export-db.ts     # every table -> data/db-export/
```

**2. Create the new database** (Neon, Supabase, RDS, your own Postgres). Note two
connection strings:

- **Pooled** → `DATABASE_URL`. Used by every request. Behind a pooler (Supabase
  port 6543, Neon `-pooler` host) it **must end with `pgbouncer=true`**, or you
  get random `prepared statement "s0" already exists` errors under load.
- **Direct** → `DIRECT_URL`. Used only by migrations (Supabase port 5432).

On a plain Postgres with no pooler, both are the same URL.

```ini
DATABASE_URL="postgresql://USER:PASS@HOST:6543/DB?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://USER:PASS@HOST:5432/DB?sslmode=require"
```

**3. Point `.env` at the NEW database, then build and load it:**

```bash
npx prisma migrate deploy        # creates the tables
npx tsx scripts/import-db.ts     # loads the export from step 1
```

**4. Check, then restart the app:**

```bash
npx tsx scripts/verify-cars.ts   # ALL CHECKS PASSED
```

Sign in with an existing account to confirm users came across. Every login
cookie keeps working as long as `SESSION_SECRET` is unchanged; change it and
everyone is signed out (safe, just inconvenient).

**Keep the schema in step.** Every later change to `prisma/schema.prisma` ships
as a folder in `prisma/migrations/`. Apply new ones to any database with
`npx prisma migrate deploy`. On Vercel this runs automatically on each
production build when `DIRECT_URL` is set (`scripts/deploy-migrate.mjs`).

> **Never run `npm run db:reset` against a hosted database.** It drops every
> table. It is for the local database only.

### 7.2 Applying catalogue updates to a database

Car data corrections live as reviewed JSON files in `data/research/` and are
written to a database with:

```bash
npx tsx scripts/apply-car-research.ts data/research/<file>.json          # preview
npx tsx scripts/apply-car-research.ts data/research/<file>.json --apply  # write
```

Each write is recorded in the `CarChangeHistory` table. Run the files against a
new or live database to bring its catalogue up to date. Running one twice is
harmless: values already set are skipped.

### 7.3 Move uploaded files

Locally, uploads are written to `public/uploads/` (not in Git). To keep them:

- **Another computer:** copy `public/uploads/` across with the project.
- **To Vercel Blob:** attach a Blob store to the Vercel project (it sets
  `BLOB_READ_WRITE_TOKEN`). New uploads go there. Existing local files are not
  moved automatically; re-upload them, or put their paths into the repository's
  `public/images/` and point the database rows at them.

Car photos shown on the site are already in the repository at
`public/images/cars/`, so they travel with the code.

### 7.4 Move the host

- **Vercel:** follow [docs/VERCEL.md](VERCEL.md). Set every variable from
  [section 3](#3-create-env) in the Vercel project, with the hosted
  database URLs. `ENABLE_ADMIN=true` only if the portal should exist there.
- **Any Node server (VPS, Docker):**

  ```bash
  npm ci
  npx prisma migrate deploy
  npm run build
  npm start                      # set PORT=... to change the port
  ```

  Put it behind HTTPS (nginx, Caddy, a cloud load balancer); login cookies are
  marked `secure` in production and will not be sent over plain HTTP.

**Check after any move:** `/`, `/cars`, `/map`, `/community` load; sign-up sends
an email; sign-in works; an admin can open `/admin`; an image upload in the
admin portal appears.

---

## 8. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `/admin` is a 404 | `ENABLE_ADMIN` is not exactly `true`, or set after the server started | set it, restart |
| `npm run dev` says the port is in use | another dev server is running | stop it, or use that one |
| `npm run db:local` says `postmaster.pid already exists` | a Postgres from an earlier run is still running | it is fine — that database is up; or end the old `postgres` process |
| Sign-up says email is not configured | `SMTP_*` / `MAIL_FROM` missing | fill them in (section 3) |
| Nobody can sign in in production | `SESSION_SECRET` missing | set it |
| `prepared statement "s0" already exists` | pooled URL without `pgbouncer=true` | add it to `DATABASE_URL` |
| Migrations hang or fail on a hosted DB | migrating through the pooler | set `DIRECT_URL` to the direct URL |
| `/cars` empty or 404 after loading data | the server started before the data was there | restart the server |
| Prisma: "client not generated" / engine errors after copying the project | `node_modules` built on another computer | `npm install` (or `npx prisma generate`) |
| `sharp` fails to load | same | `npm install` |
| Pages slow on first open | development compiles on demand | normal; use `npm run build && npm start` to judge speed |
| Uploaded images missing on a new machine | `public/uploads/` is not in Git | copy it across (section 7.3) |

### Useful scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | dev server (starts the local database if needed) |
| `npm run build` / `npm start` | production build / serve it |
| `npm run type-check` / `npm run lint` | TypeScript / ESLint |
| `npm run db:local` | start (or create) the local Postgres |
| `npx tsx scripts/export-db.ts` | every table → `data/db-export/` |
| `npx tsx scripts/import-db.ts` | `data/db-export/` → an empty database |
| `npx prisma migrate deploy` | apply pending schema migrations |
| `npx tsx scripts/promote-admin.ts you@x.com` | make an account an admin |
| `npx tsx scripts/verify-cars.ts` | check the car catalogue end to end |
| `npx tsx scripts/apply-car-research.ts <file> --apply` | apply a catalogue correction file |
| `npm run import:stations` | import real stations (needs `OPENCHARGEMAP_API_KEY`) |
