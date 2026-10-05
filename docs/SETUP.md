# Running Plug.pk on another machine

A fresh clone will not show the admin portal, and `/admin` will return **404**
rather than a login page. That is deliberate, not a bug: the portal is switched
off unless an environment variable turns it on, and `.env` is not in the repo.

Two things a clone is missing, both on purpose:

| Missing | Why | Fix |
| --- | --- | --- |
| `.env` | holds the database URL, the admin switch and the session secret | create it, step 2 |
| a database | it holds real data, so neither the file nor a dump is committed | rebuild it, step 3 |

Since the move off SQLite the engine is **PostgreSQL**, with no fallback —
`contains` is case-insensitive on Postgres and was case-sensitive on a hosted
one, which is exactly the class of bug that only shows up in production.

## 1. Install

```bash
git clone https://github.com/alisalman81r-ai/PlugPK.git
cd PlugPK
npm install
```

## 2. Create `.env`

Copy the template and fill it in:

```bash
cp .env.example .env
```

`.env.example` documents every variable. The four that matter locally:

```ini
# Printed by `npm run db:local` in step 3, or from Neon / Supabase.
DATABASE_URL="postgresql://plugpk:plugpk@127.0.0.1:55432/plugpk"

# Without this, /admin returns 404 — the portal is not merely hidden, the
# routes refuse to resolve. This is what keeps it out of a production build.
ENABLE_ADMIN=true

# Signs every sign-in cookie, members and admins alike. Generate a fresh one:
#   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
# Required in production: without it nobody can sign in (it fails closed rather
# than signing cookies with a guessable key).
SESSION_SECRET=paste-the-generated-value-here

# Optional, local development only. If SESSION_SECRET is unset on your own
# machine, this is used as the signing key instead. It is NOT a password for
# anything any more, and it is ignored in production.
# ADMIN_PASSWORD=
```

## 3. Build the database

Two ways. The first needs no account and no configuration.

**A local Postgres, one command.** In its own terminal:

```bash
npm run db:local
```

First run downloads a Postgres server into `.localdb/` (gitignored), creates a
UTF8 cluster, applies the migration and imports all 155 rows from
`data/db-export/`. Later runs just start it, and it prints the `DATABASE_URL` to
paste into `.env`. Ctrl-C stops it; the data stays.

It is a real PostgreSQL, not an emulation, so `contains`, collation and
constraints behave exactly as they will in production.

**Or a hosted database.** Point `DATABASE_URL` at Neon or Supabase and run:

```bash
npx prisma migrate deploy
npx tsx scripts/import-db.ts      # -> 155 rows imported in 1 pass
```

`import-db.ts` refuses to run against a database that already has rows, so it
cannot double up. It works out insert order by retrying rows whose parents are
not in yet.

**Or the seeds, if you want empty-ish content rather than the export:**

```bash
npx prisma migrate deploy
npx prisma generate
npm run db:seed                # stations, services, community, clubs
npx tsx scripts/seed-cars.ts   # the car catalogue
```

**Both seeds are needed** if you take this route. `db:seed` does not touch the
`Car` table — cars live in their own seed, loaded from `src/data/cars.ts`. Run
only the first and the site comes up with an entirely empty `/cars`, which looks
like a broken build rather than a missing command.

### Check it worked

```bash
npx tsx scripts/verify-cars.ts
```

Prints `ALL CHECKS PASSED` and exercises the catalogue's filters, sorts and
price formatting against whatever is actually in the table. If the car seed did
not run, this is where you find out.

**Restart the dev server after loading data.** Next caches rendered routes, so a
server that was running while the table was empty keeps serving a 404 for
`/cars` afterwards — which looks exactly like a seed that failed. It was
verified here: `/cars` returned 404 against a freshly populated database until
the server was restarted, then 200.

## 4. Run

```bash
npm run dev
```

`npm run dev` runs a preflight check first and refuses to start on a state that
would fail confusingly later: a port already serving, a SQLite URL left in
`.env`, or a database URL nothing answers on. Each says what is wrong and what
to run.

### Becoming an admin

There is no admin password and no separate admin login. Admin access is a flag
on an ordinary account, and it takes two things:

1. `ENABLE_ADMIN=true` in `.env` (above), so the `/admin` routes exist; and
2. an account with `isAdmin` set. Sign up at **http://localhost:3000/signup**
   like any member, then promote that account from a terminal:

   ```bash
   npx tsx scripts/promote-admin.ts you@example.com
   ```

Sign out and back in at **/login** and you land on **/admin**. The portal covers
stations, connectors, services, community, reviews, businesses, meetings,
members and cars.

The script is only needed for the **first** admin (and for recovery if every
admin is locked out). After that, an admin grants or revokes the role from the
member's page in the portal — **Members → open someone → Role**. The portal
refuses to change your own role and refuses to remove the last admin. Revoking
signs that person out everywhere immediately. `--revoke` on the script does the
same from the command line.

### What the portal records and limits

- **Activity log, at /admin/activity.** Every change an admin makes — editing a
  station, approving a business, resetting a password, deleting a review — is
  written to the `AdminAuditLog` table after it succeeds, with the operator's
  account and a one-line summary. Member and business pages show their own
  recent activity. The log is read-only in the portal. Changes made with
  `scripts/promote-admin.ts` are not logged, because there is no signed-in
  operator to attribute them to.
- **Sessions are revocable.** A password reset by an admin, a revoked role or an
  anonymised account ends every session that account has open, on its next
  request.
- **Rate limits.** Sign-in, sign-up, uploads and the public forms (reviews,
  posts, business and service applications, meeting requests) are throttled per
  client in the `RateLimit` table, so they work across serverless instances. If
  the table cannot be reached the request is allowed rather than locking
  everyone out.

## If /admin still 404s

The gate is a single check in `src/middleware.ts`. In order of likelihood:

1. `ENABLE_ADMIN` is missing, or set to something other than the exact string
   `true` — `TRUE` and `1` will not work.
2. `.env` was created after the dev server started. Next reads it at boot;
   restart the server.
3. The file is named `.env.local` and something else is overriding it, or it
   sits outside the project root.

Check what the server actually loaded:

```bash
node -e "require('dotenv').config(); console.log('ENABLE_ADMIN =', JSON.stringify(process.env.ENABLE_ADMIN))"
```

## 5. Optional: screenshots

Not needed to run the site.

`@playwright/test` is in `package.json`, but the browser it drives is roughly
115 MB and is not — and should never be — committed:

```bash
npx playwright install chromium
node scripts/shoot.mjs login          # writes to .screenshots/
```

## Who changed what

Admin access used to be one shared password, and nothing could say which person
made a change. It is now per-account: every operator signs in as themselves, and
every admin write is recorded in `/admin/activity` against that account.

Rows written before the change — such as `CarChangeHistory.approvedBy = 'admin'`
from the old crawler review queue — still say `admin`, because that is all that
was known at the time. No name has been back-filled into them.

## Three things that do not travel

**Uploaded images.** Charger photos, car photographs and profile pictures are
written to `public/uploads` locally, or to Vercel Blob once
`BLOB_READ_WRITE_TOKEN` is set. Neither directory is in the repo, so a clone
starts with none and any listing that referenced one shows its fallback
instead.

**Accounts.** The database is rebuilt from the migration and the export, and the
export contains no users — it is the catalogue and the community content, not
anyone's credentials. Sign up on the new machine.

**Uploads over 4 MB.** The cap is below Vercel's 4.5 MB serverless request-body
limit on purpose; a larger file would be refused by the platform before the
action could explain why. See `src/lib/db/upload-actions.ts`.
