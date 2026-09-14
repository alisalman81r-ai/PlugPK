# Vercel par Plug.pk — Claude ke liye step-by-step prompts

Ye file aap ke liye hai: har step ka ek prompt hai jo aap **Claude Code** (terminal wale
Claude), ya VS Code / Cursor ke Claude mein **as-it-is paste** kar sakte hain. Claude
project folder (`F:\plugPK` ya jahan bhi clone ho) mein khula hona chahiye, kyunke usay
files parhne, commands chalane aur code badalne ki zarurat paregi.

Har prompt ke baad Claude kuch report deta hai. Aap woh parh kar agla prompt paste karein.

**Roman Urdu samajhne ke liye:** har step ke shuru mein chhota Urdu note hai, phir English
prompt block hai. Prompt English mein isliye hai ke Claude usay sabse theek se follow karta
hai — aap ko usay translate karne ki zarurat nahi.

---

## Pehle: asal picture (2 minute mein parh lein)

Aap ka project **zyada tar already deploy-ready hai**. Ye cheezein repo mein maujood hain:

| Cheez | Status |
| --- | --- |
| Next.js 14 App Router + TypeScript build | Ready — `npm run build` documented as passing |
| Database engine | Postgres (`provider = "postgresql"`), ek migration, 25 tables |
| Data ka safar (155 rows) | `data/db-export/` mein JSON, plus `scripts/import-db.ts` |
| Uploads | Vercel Blob jab `BLOB_READ_WRITE_TOKEN` set ho, warna local disk |
| Admin portal ka gate | `ENABLE_ADMIN` middleware mein — off ho to `/admin` 404 |
| Runbook | `docs/VERCEL.md` — step-by-step, pehle se likha hua |
| Local Postgres | `npm run db:local` — account ki zarurat nahi |

Yani code likhne ka kaam baaki nahi hai. Baaki ye hai — aur **ye aap khud karenge, Claude
aap ke Vercel account mein login nahi kar sakta**:

1. Neon (ya Supabase) par ek free Postgres banana
2. Us database mein schema + data daalna *(ye Claude karwa dega — Step 4)*
3. Vercel par repo import karna aur environment variables daalna *(Step 5 + Appendix B)*
4. Blob store attach karna (admin uploads ke liye)
5. Deploy ke baad site check karna *(Step 6)*

### Teen rules jo kabhi na todein

**1. Data pehle, deploy baad mein.** `/cars`, `/community` aur `/station/[slug]` build ke
waqt render ho kar static HTML ban jate hain. Agar pehli build khaali database ke khilaf ho
gayi, to site "0 cars" wali static HTML serve karti rahegi jab tak dobara deploy na ho.
Isliye: Step 4 (data load) → phir Step 5 (Vercel) → phir deploy.

**2. Sirf `main` branch se deploy.** Vercel ka production branch `main` hai. Aap ka
AutoSync khud `main` par push karta hai, to ye already theek hai.

**3. Secrets kabhi `NEXT_PUBLIC_` na banayein.** `NEXT_PUBLIC_` wali value browser bundle
mein chali jati hai. Sirf Google Maps key public hai — baqi sab server par rehti hain.

---

## Step 1 — Deploy-readiness audit (read-only, kuch change nahi hota)

**Maqsad:** Claude poora repo parh kar bataye ke Vercel deploy mein kya kya block ho sakta
hai. Is step mein woh kuch change nahi karega — sirf report.

```
Read these files in this repository: docs/VERCEL.md, docs/SETUP.md, README.md,
package.json, next.config.mjs, prisma/schema.prisma, the single folder under
prisma/migrations/, src/middleware.ts, src/lib/db/client.ts, src/lib/db/availability.ts,
src/lib/db/build-params.ts, src/lib/db/upload-actions.ts, src/lib/admin-auth.ts and
src/lib/user-auth.ts.

Context: this is a Next.js 14 App Router + Prisma + Postgres application that is about to be
deployed to Vercel from the main branch, with a hosted Postgres (Neon or Supabase) and a
Vercel Blob store for uploads. Do NOT change any file in this step.

Produce a report with these five sections:

1. Deployment requirements table. One row per requirement, with a verdict and file:line
   evidence: Postgres datasource (no SQLite anywhere); the committed migration matches the
   models in schema.prisma (count them both); `prisma generate` runs on install; the build
   does not require a database to exist; uploads go to Vercel Blob when BLOB_READ_WRITE_TOKEN
   is set and nowhere else writes to the local filesystem at request time; `/admin` is gated
   by ENABLE_ADMIN before any page code runs; next/image is configured to accept the Vercel
   Blob hostname.

2. Static prerender list. Every route that has no `dynamic`/`revalidate` directive and reads
   no searchParams/cookies/headers, and therefore bakes database rows into the build output.
   I believe /cars, /community and /station/[slug] are three of them; confirm or correct that
   and list the complete set.

3. Environment variables. A table of every variable the code reads: name, file:line where it
   is read, required in production (yes/no), and whether it ends up in the client bundle.

4. Blockers. Anything that would fail a Vercel build or produce a broken page in production,
   with file:line and the smallest fix. If there is nothing, say so plainly — do not invent
   issues, and do not list style preferences as blockers.

5. Documentation contradictions. Anything in README.md, docs/SETUP.md or docs/VERCEL.md that
   is no longer true of the code.

Be brief per item. English. Quote file paths and line numbers.
```

**Aap kya dekhein:** Section 4 khaali ho to aage barhein. Agar wahan kuch ho, Step 2 usay
fix karega.

---

## Step 2 — Jo audit mein Nikla, Woh Fix Karna

**Maqsad:** Sirf asli blockers fix karwana, bina kisi refactor ke. Claude is repo mein
comment-heavy style follow karta hai — woh barqarar rahe.

```
Act on the findings from your audit. For each real deployment blocker, apply the smallest
change that fixes it, and nothing else.

Rules — these matter more than the fix itself:
- Do not refactor. Do not upgrade or add dependencies. Do not touch styling, copy or
  component structure. Do not add features.
- Follow the conventions already in this codebase: a non-obvious change gets a short comment
  explaining WHY it is that way, in the same voice as the file headers around it. Comments
  that restate the code are not wanted.
- Nothing may be invented. No placeholder data, no guessed numbers, no fake fallbacks.
- If a finding is a documentation contradiction rather than a code defect, fix the document,
  not the code.
- If a finding needs a product or security decision from me, stop and ask me instead of
  choosing on my behalf.
- Everything you change must keep `npm run type-check` clean.

When you are done: run `npm run type-check` and report the result, then list every file you
changed with a one-line reason each.
```

**Aap kya dekhein:** Changed files ki list + `type-check` clean. Koi bara diff ho to Claude
se poochein "ye change kyun zaruri tha?" — jawab file ke comment mein hona chahiye.

---

## Step 3 — Local production build + poora smoke test

**Maqsad:** Vercel par jane se pehle apni machine par wahi build chalwana jo Vercel chalayega,
aur asli Postgres data ke saath saare routes check karwana. Ye step sabse zyada bharosa deta
hai.

```
Goal: prove that the production build succeeds and that the app serves real rows from a real
Postgres, before anything reaches Vercel.

Do this in order and show me the actual command output at each stage:

1. Start the local Postgres in its own background process:
     npm run db:local
   Its first run downloads a server into .localdb/, creates a UTF8 cluster, applies the
   migration and imports 155 rows from data/db-export/. It prints a DATABASE_URL. If it is
   already running, just use the URL it printed. Do not stop it until I say so.

2. Create .env from .env.example (if it does not exist) containing:
   - DATABASE_URL = the URL from step 1
   - ENABLE_ADMIN=true
   - ADMIN_PASSWORD = a long throwaway password for this test, and tell me what it is
   - SESSION_SECRET = output of:
       node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   .env is gitignored — never commit it and never print SESSION_SECRET or DATABASE_URL into
   any file you write.

3. Run the production build into a separate output directory, so it cannot disturb a dev
   server: NEXT_DIST_DIR=.next-verify npm run build
   (On PowerShell: $env:NEXT_DIST_DIR=".next-verify"; npm run build)
   Report: exit status, how many routes were prerendered, and every warning line that
   mentions the database. Fix type or lint errors only if they block the build.

4. Start that build: NEXT_DIST_DIR=.next-verify npx next start -p 3100
   (the env var has to be set for `next start` too, or it looks in .next).
   Then request each of these and report HTTP status plus one concrete piece of expected
   content you actually saw in the body (a car name, a station name, a count — not "looks
   fine"):
     /                                   homepage, stats bar
     /cars                               must list 48 cars
     /cars/byd-seal                      a detail page with its specification table
     /cars/compare?ids=byd-seal,kia-ev5  comparison rows filled
     /map                                must show 6 stations (see the note below)
     /station/mall-road-ev-hub-lahore    connectors and reviews present
     /services                           must list 12 services
     /community                          must list 12 posts
     /community/clubs                    must list 8 clubs
     /routes                             planner loads
     /credits                            attribution page
     /admin                              with ENABLE_ADMIN=true this must redirect to login
     /admin/login                        must return 200 with a password form
     /api/businesses                     JSON, whatever the route is meant to return
     /this-page-does-not-exist           must be 404

5. Prove the admin gate works in both positions, and say which you tested:
   - with ENABLE_ADMIN=true: /admin redirects to /admin/login; a wrong password is rejected;
     the right password reaches the dashboard.
   - Restart with ENABLE_ADMIN unset and confirm every /admin URL returns 404 (not a login
     page, not a redirect).

6. Check one next/image request returns an optimised image (200, content-type image/webp),
   e.g. take an <img> src from /cars HTML and request its /_next/image?url=... form.

Two notes so the results are not over-read:
- /map draws its pins from the stations bundled in the app plus approved partner stations it
  fetches from /api/businesses — it is not a database read. The database-backed pages are
  /cars, /cars/[slug], /station/[slug], /services, /community and the homepage.
- /cars search filters in the browser over rows rendered into the page, so it will not appear
  in this list as a query-string test.

Report everything as a table: route or check | result | evidence | pass/fail. Stop the server
when done, but leave the database running. Change nothing in the repository in this step
except fixes required to make the build pass — and tell me if you had to.
```

**Aap kya dekhein:** Sab rows PASS hone chahiye. `/cars` par 48, `/map` par 6 — ye figures
`docs/VERCEL.md` se match karte hain, isliye kisi bhi mismatch ka matlab data import adhoora
hai.

---

## Step 4 — Hosted database: schema + data (deploy se PEHLE)

**Ye step aap ke account wale kaam par depend karta hai.** Pehle Neon (ya Supabase) par ek
free project banayein, phir Claude ko chalane dein. Neon: dashboard → **New Project** →
region Singapore/Frankfurt (Pakistan ke liye Singapore theek hai) → connection string copy.
Neon do strings deta hai: **pooled** (host mein `-pooler`) aur **direct**. Dono chahiye.

```
I have created a hosted Postgres (Neon or Supabase). I will paste the connection strings
when you ask for them. Treat them as secrets: never write them into a file in the repository,
never commit them, and mask the password whenever you print a connection string.

Do this in order:

1. Ask me for the two connection strings and tell me which one is the pooled one and which is
   the direct one. For Neon, the pooled URL has "-pooler" in the hostname. For Supabase, the
   pooled URL uses port 6543 with pgbouncer. If I only have one string, say which one to use
   for what, and continue.

2. Before writing anything: confirm the database is UTF8 by running
     SELECT pg_encoding_to_char(encoding) FROM pg_database WHERE datname = current_database();
   It must say UTF8. This matters: the catalogue contains "≈" (U+2248) in one car's notes, and
   importing into a non-UTF8 cluster fails on exactly one row of 155 with SQLSTATE 22P05,
   which looks like a corrupt export rather than a cluster setting.

3. Apply the schema against the DIRECT connection string:
     npx prisma migrate deploy
   Expect one migration applied and 25 tables created. If it fails, show me the full error
   and stop.

4. Load the data, again against the direct URL:
     npx tsx scripts/import-db.ts
   It refuses to run against a database that already has rows, so it cannot double up. It
   works out insert order by retrying rows whose parents are not in yet. Expect it to report
   155 rows imported.

5. Verify against data/db-export/_manifest.json. Every table's row count must match exactly.
   The non-zero ones are: Car 48, Station 6, Connector 14, Review 23, EVService 12,
   CommunityPost 12, Comment 23, Club 8, CarSourceRecord 5, CarSource 2, CrawlRun 2. The
   other 14 tables are 0 and are supposed to be. Report the comparison as a table.

6. Verify the behaviour the app depends on — case-insensitive search. Run the same query with
   'byd', 'BYD' and 'Byd':
     SELECT count(*) FROM "Car" WHERE brand ILIKE '%byd%' OR model ILIKE '%byd%'
       OR "fullName" ILIKE '%byd%';
   All three must return the same number. On Postgres this is what Prisma's
   mode: 'insensitive' compiles to; the app's /cars search breaks silently if it is not true.

7. Confirm the approximation glyph survived: read the notes of the car with id
   'alektra-solar-mini-x4' and show me the character, not just "true".

8. Put the POOLED connection string into .env as DATABASE_URL, then run the production build
   once against the hosted database: NEXT_DIST_DIR=.next-verify npm run build
   This is the prerender against production data. Report the exit status and any database
   warning. Do not start a server against production data.

Finally, tell me in two sentences, in plain words: which connection string goes into Vercel
and why the other one is only for migrations.
```

**Aap kya dekhein:** "155 rows" + saari table counts match + tino BYD queries ka same number.
Agar connection fail ho, to Neon mein "Connection pooling" on hona chahiye, aur Prisma ko
pooled URL ke saath `?sslmode=require` chahiye.

---

## Step 5 — Vercel ke liye values tayyar karna

**Maqsad:** Dashboard mein paste karne ke liye exact values, aur ek check ke koi secret client
bundle mein leak na ho raha ho.

```
Goal: prepare exactly what I have to paste into the Vercel dashboard, and prove nothing
secret leaks into the browser bundle. Change no application code in this step.

1. Generate a fresh SESSION_SECRET:
     node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   Print it once. Say plainly that the local development value must not be reused, and that
   this value must not be committed anywhere.

2. Give me a table of every environment variable, in the order I should paste them, with:
   the exact name, the value or where the value comes from, which Vercel environments it
   needs (Production / Preview / Development), and what breaks if it is missing. Cover at
   least: DATABASE_URL, SESSION_SECRET, ADMIN_PASSWORD, ENABLE_ADMIN,
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID, BLOB_READ_WRITE_TOKEN,
   OPENCHARGEMAP_API_KEY.
   For BLOB_READ_WRITE_TOKEN: explain that Vercel sets it itself once a Blob store is
   attached to the project, and that it must NOT be created by hand.

3. For each variable, state whether it is safe in the client bundle. Then prove it: search
   every file that starts with 'use client' for process.env and report the list of names
   found. Anything that is not NEXT_PUBLIC_* is a leak and must be fixed.

4. Confirm no vercel.json is needed, and state what Vercel's defaults must be: install
   command `npm install` (its postinstall runs `prisma generate`), build command `next build`,
   output directory `.next`, Node version 18.18 or newer. Explain what to do if the framework
   preset is not detected as Next.js.

5. State clearly which value goes into DATABASE_URL in Vercel (the pooled one) and where the
   direct one is used (migrations and the data import, from my machine).

6. Tell me whether anything here needs a redeploy after a change: which variables are baked
   in at build time (NEXT_PUBLIC_*) and which are read at request time.
```

---

## Step 6 — Deploy ke baad live site ki verification

Yahan tak aap Vercel par import + env vars + Blob store kar chuke honge aur deploy ho chuka
hoga (Appendix B mein clicks wale steps hain). Ab URL Claude ko dein.

```
The deployment is live at https://<my-domain>.vercel.app — I have loaded the production
database and set every environment variable. Verify the deployment from the outside. Do not
modify application code in this step; if you find a defect, report it with a proposed fix and
wait for my go-ahead.

1. Request each of these against the live URL and report status + one concrete piece of
   expected content from the body:
     /   /cars (48 cars)   /cars/byd-seal   /cars/compare?ids=byd-seal,kia-ev5
     /map (6 stations)   /station/mall-road-ev-hub-lahore   /services (12)
     /community (12 posts)   /community/clubs (8 clubs)   /routes   /credits
     /api/businesses   /this-page-does-not-exist (must be 404)
2. Prove the catalogue really came from the production database: the /cars HTML must contain
   all five BYD cars (byd-atto-2, byd-atto-3-advanced, byd-seal, byd-sealion-6,
   byd-sealion-7-advanced) and the page must say 48 cars. Note in your report that the search
   box on /cars filters in the browser over those rows, so it cannot be exercised with curl —
   I will type "byd" and "BYD" myself and confirm both give five cars.
3. Confirm next/image works in production: pull an image URL out of the /cars HTML, request
   its /_next/image?url=...&w=...&q=... form, and report status and content-type. A 400 here
   means the remote hostname is not allowed in next.config.mjs; say which host it was.
4. Admin gate: /admin must redirect to the login page, and /admin with a wrong password must
   stay out. (I will test the correct password myself.)
5. Check the response headers of / for anything that should not be public: no API keys, no
   stack traces, no server versions.
6. Report a single table: check | live result | expected | pass or fail. For every failure,
   give the most likely cause and the exact string to search for in the Vercel function logs.
```

**Aap khud ye bhi karein:** Vercel dashboard → Functions → logs, aur ek asli admin login +
ek tasveer upload (Blob store test). Upload 4MB se chhoti ho — is se bari file platform
khud reject kar deta hai.

---

## Step 7 — Optional: launch ke baad ki safai (jab sab chal raha ho)

```
Post-launch hardening, no redesigns. Ask me before each item; do them one at a time.

1. Google Maps key hygiene: my NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is readable by anyone. Walk me
   through restricting it in Google Cloud Console to my deployed domains (HTTP referrer
   restriction) and confirm the map falls back to MapLibre + OpenFreeMap when the key is
   absent or restricted — read the code and tell me exactly which component chooses the
   renderer.
2. Confirm /robots.txt and a sitemap exist, or tell me what is missing; this site is a
   directory and should be crawlable.
3. Database backup: what does Neon's free tier give me, and what is the shortest safe way to
   take a copy of the production database myself.
4. Uploads: confirm that admin image uploads land in the Blob store in production and not on
   the filesystem, and that a deleted image is removed from the store too.
5. Write a short OPERATIONS.md in docs/: which Vercel project and which database this deploys
   to, the env var names (names only, never values), how to run a migration against
   production, how to load data into a fresh database, and what a redeploy does to static
   pages. Written for the person who comes back in six months.
```

---

## Appendix A — Ek hi prompt (agar sab ek saath karwana ho)

Agar aap step-by-step nahi chalana chahte, ye ek prompt poora kaam ek turn mein karwata hai.
Haan, ye lamba hai — magar Claude Code ise theek se handle karta hai, aur beech mein jab
connection string mangi jaaye to aap woh paste kar dein.

```
You are preparing a Next.js 14 App Router + Prisma + Postgres application in this repository
for its first Vercel deployment. The public site and an admin portal are already built and
work locally. Read docs/VERCEL.md, docs/SETUP.md, README.md and prisma/schema.prisma first,
then work through the phases below IN ORDER. Announce each phase before starting it. Never
invent data, never upgrade dependencies, never refactor beyond what the deployment requires,
and follow this codebase's comment convention — explain why, not what.

PHASE 1 — Audit, read-only. Report: deployment requirements and whether the repo satisfies
each; every route that is statically prerendered at build time and therefore bakes database
rows into the build output; every environment variable the code reads, with required-in-
production and client-bundle exposure; anything that would fail a Vercel build or break in
production, with file:line; and any documentation that no longer matches the code.

PHASE 2 — Fix only the real blockers found in Phase 1, with the smallest possible change.
Fix documents rather than code where the defect is a document. Ask me before any change that
is a product or security decision. Leave `npm run type-check` clean and report every file
changed with a one-line reason.

PHASE 3 — Prove it locally. Start `npm run db:local` (a real Postgres with all 155 rows),
create .env from .env.example, build with NEXT_DIST_DIR=.next-verify npm run build, serve it
with `NEXT_DIST_DIR=.next-verify npx next start -p 3100`, and check every public route plus
the admin gate. Expect /cars to list 48 cars, /map 6 stations, /services 12, /community 12
posts and 8 clubs. Report a pass/fail table with real evidence from the responses.

PHASE 4 — Production database. Ask me for the pooled and direct connection strings for a
hosted Postgres (I will create it). Confirm the cluster is UTF8; apply `prisma migrate
deploy` and `npx tsx scripts/import-db.ts` against the DIRECT URL; verify every table count
against data/db-export/_manifest.json (155 rows total, 25 tables); verify 'byd', 'BYD' and
'Byd' all return the same cars; confirm the ≈ character survived in car id
alektra-solar-mini-x4. Then put the POOLED URL in .env and run the production build once
against the hosted database. Never write a connection string into the repository.

PHASE 5 — Prepare the Vercel handoff. Generate a fresh SESSION_SECRET; list every environment
variable for the dashboard with its production value, which environments it needs, and what
breaks without it; prove no non-NEXT_PUBLIC variable is read from a 'use client' file;
confirm Vercel's default install/build commands are correct and that no vercel.json is
needed; state which connection string goes into Vercel and why.

PHASE 6 — After I deploy, I will paste the live URL. Then verify the live site: every public
route, case-insensitive search, next/image in production, the admin gate, and that no secret
appears in the HTML or response headers. Report pass/fail with the likely cause for each
failure and what to search for in the Vercel logs.

Start with Phase 1 and stop after its report.
```

---

## Appendix B — Vercel dashboard wale kaam (ye aap khud karenge)

Claude aap ke Vercel ya Neon account mein login nahi kar sakta, isliye ye clicks aap ke
hain. Har step 1–3 minute ka hai.

**1. Neon par database (5 min)**

1. neon.tech → Sign up (GitHub se) → **New Project**
2. Name: `plugpk`, region: **Singapore** (Pakistan ke liye sabse qareeb), Postgres 16+
3. **Connection string** khol kar dono copy karein:
   - **Pooled** — host mein `-pooler` likha hota hai → ye Vercel mein jayega
   - **Direct** (pooled checkbox off) → ye migrations aur import ke liye
4. String ke aakhir mein `?sslmode=require` ho — Neon khud laga deta hai.

> Supabase use kar rahe hain? **Project Settings → Database → Connection string** se
> "Transaction pooler" (port 6543) aur "Direct connection" (port 5432) lein. Pooler ke saath
> Prisma ko `?pgbouncer=true` chahiye hota hai.

**2. Vercel par import (2 min)**

1. vercel.com → Sign up with GitHub
2. **Add New… → Project** → `alisalman81r-ai/PlugPK` → **Import**
3. Framework preset: **Next.js** (khud detect ho jata hai), root directory: default,
   build command: `next build`, install command: `npm install` — kuch change na karein
4. **Environment Variables** khol kar Step 5 wali table ke hisaab se daalein:

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | Neon ka **pooled** string |
   | `SESSION_SECRET` | Step 5 mein generate hua |
   | `ADMIN_PASSWORD` | aap ka chuna hua portal password (lamba rakhein) |
   | `ENABLE_ADMIN` | `true` — warna `/admin` 404 dega |
   | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | optional (khaali chhorein to MapLibre chalta hai) |
   | `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | optional |

   Har variable ko **Production**, **Preview** aur **Development** — teeno par tick karein,
   siwaye Google Maps key ke (wo sirf Production/Preview par bhi theek hai).

5. **Deploy** dabayein. Pehli build 3–5 minute leti hai.

**3. Blob store — admin uploads ke liye (1 min)**

Project → **Storage** → **Create Database… → Blob** → project se attach karein.
`BLOB_READ_WRITE_TOKEN` khud ban jata hai. Iske bina site chalti hai, magar admin portal se
koi tasveer upload karte waqt error aayega (serverless par likhne wali disk nahi hoti).

**4. Deploy ke baad**

- Site khol kar `docs/VERCEL.md` ki "Production verification checklist" par chalein
- Admin test: `https://<aap-ka-domain>/admin/login` → password → dashboard
- Ek **test** station ya car banayein, phir delete karein (asli row nahi)
- Ek tasveer upload karein (4MB se chhoti) — ye Blob store ka asli test hai
- Env var badalne ke baad **Redeploy** karna zaruri hai — khaas kar `NEXT_PUBLIC_*` ke liye,
  kyunke wo build ke waqt bundle mein chali jati hain

> Note: Vercel ka Hobby plan personal/non-commercial projects ke liye hai. Ye site commercial
> business ban rahi ho to Pro plan lena hoga — ek line ka reminder, take baad mein surprise
> na ho.

---

## Appendix C — Masle aur unka hal

| Alamat (symptom) | Asli wajah | Fix |
| --- | --- | --- |
| Build fail: "Failed to collect page data for /cars/[slug]" | Build ke waqt database reachable nahi | `DATABASE_URL` Vercel mein set karein, Neon project active ho; `lib/db/build-params.ts` is halat ko normally survive kar leta hai, isliye agar build phir bhi gire to log mein Prisma ka asli error dekhein |
| Build safal, magar site par "0 cars" / khaali listings | Build khaali database ke khilaf hua — static pages wahi HTML serve kar rahe hain | Data load karein (Step 4), phir Vercel par **Redeploy** |
| `/admin` 404 deta hai (login page bhi nahi) | `ENABLE_ADMIN` set nahi, ya `true` ke bajaye `TRUE`/`1` hai, ya env var add karne ke baad redeploy nahi hua | `ENABLE_ADMIN=true` (exact), phir redeploy |
| `/admin` login par "wrong password" jabke password sahi hai | Value mein trailing space ya newline copy ho gaya | Vercel par value dobara paste karein, bina extra space; redeploy |
| Tasveer upload par error | Blob store attach nahi, ya file 4MB se bari | Storage → Blob attach karein; tasveer 4MB se chhoti karein |
| Uploaded tasveer `next/image` par 400 | Hostname allow nahi | `next.config.mjs` ka `remotePatterns` Blob host cover karta hai — agar Vercel custom blob domain de raha ho to wahi add karna hoga |
| Function timeout / 504 | Database qareeb nahi (region mismatch) ya connection pool khatam | Neon region Singapore/Frankfurt rakhein, pooled URL use karein |
| Poori site par koi database ki value nazar nahi aa rahi | Build khaali ya unreachable database ke khilaf hua aur static pages wahi serve kar rahe hain | `DATA pehle, deploy baad mein` rule — data load karke Vercel par Redeploy |
| Admin mein car edit ki, magar public page par purana data | `/cars` static hai; admin ki write `revalidatePath` chalati hai, lekin env var ya build-level tabdeeli ke liye redeploy chahiye | Page ko hard refresh karein; tasdeeq na ho to Vercel par redeploy |
| `/map` par sirf kuch stations (ya 6 se zyada) | `/map` apne bundled stations + `/api/businesses` se partner stations dikhata hai — ye database read ka test nahi | Database ka asli test `/cars`, `/station/[slug]`, `/services` aur `/community` hain |
| Local `npm run dev` shuru hi nahi hota | Preflight ne rok diya: port busy, ya SQLite URL `.env` mein | Terminal mein likha hua hal karein; `DATABASE_URL` Postgres ka hona chahiye |

---

## Appendix D — "Ho gaya" ka matlab

Deploy mukammal tab hai jab ye 6 cheezein sach hon:

1. Vercel ka production build green hai, aur redeploy bhi pass hota hai
2. `/cars` par 48 cars, `/map` par 6 stations, `/services` par 12, `/community` par 12 posts
   aur 8 clubs — live URL par, localhost par nahi
3. `/cars` search box mein `byd` aur `BYD` — dono paanch BYD cars dikhate hain
4. `/admin` password ke saath khulta hai, aur `ENABLE_ADMIN` hatane par 404 ho jata hai
5. Admin se ek tasveer upload hoti hai aur woh dikhti hai (Blob store zinda hai)
6. Ek naya review ya post public site se submit ho kar reload ke baad bhi maujood hai
   (database mein asli write ho rahi hai)

In chaar ke baad: Google Maps key ko domain tak restrict karein, aur Neon ka backup
(Appendix A, Step 7) set kar lein.
