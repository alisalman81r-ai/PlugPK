# Running Plug.pk on another machine

A fresh clone will not show the admin portal, and `/admin` will return **404**
rather than a login page. That is deliberate, not a bug: the portal is switched
off unless an environment variable turns it on, and `.env` is not in the repo.

Two things a clone is missing, both on purpose:

| Missing | Why | Fix |
| --- | --- | --- |
| `.env` | holds the admin password and the session secret | create it, step 2 |
| `prisma/dev.db` | the database is a file; committing it would publish real user data | rebuild it, step 3 |

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

Then edit `.env` so it contains at least these four lines:

```ini
DATABASE_URL="file:./dev.db"

# Without this, /admin returns 404 — the portal is not merely hidden, the
# routes refuse to resolve. This is what keeps it out of a production build.
ENABLE_ADMIN=true

# The admin portal's shared password. Choose your own; it is not stored
# anywhere else and there is no reset flow.
ADMIN_PASSWORD=choose-something-long

# Signs the login cookie for business owners. Generate a fresh one:
#   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
SESSION_SECRET=paste-the-generated-value-here
```

## 3. Build the database

The migrations are committed, so the schema rebuilds from them. The seed fills
in stations, services and community posts:

```bash
npx prisma migrate deploy
npx prisma generate
npm run db:seed
```

## 4. Run

```bash
npm run dev
```

Then open **http://localhost:3000/admin/login** and enter the `ADMIN_PASSWORD`
you chose. The portal covers stations, connectors, services, community,
businesses, meetings and members.

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

## Two things that do not travel

**Uploaded images.** Charger photos and profile pictures are written to
`public/uploads`, which is not in the repo. A clone starts with none, and any
listing that referenced one will show its fallback instead.

**Accounts.** The database is rebuilt from migrations and the seed, so it has
no user accounts. Sign up on the new machine, or copy `prisma/dev.db` across by
hand — it is a single file, and it holds real data, so treat it accordingly.
