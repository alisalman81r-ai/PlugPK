# Plug.pk — Features

What the product does today, as built. Checked against the code on 2026-10-30
(commit `aef9748`). Anything partial, placeholder or not yet built is listed
under **Limits** in its section, and gathered again in
[What is not built yet](#11-what-is-not-built-yet).

Companion documents: [DESIGN.md](DESIGN.md) (visual design system),
[README.md](README.md) (running the project), [docs/](docs/) (setup and deploy).

**Contents**

1. [Public website](#1-public-website)
2. [Accounts and sign-in](#2-accounts-and-sign-in)
3. [Member dashboard](#3-member-dashboard)
4. [Business (partner) portal](#4-business-partner-portal)
5. [Admin portal](#5-admin-portal)
6. [Mobile app](#6-mobile-app)
7. [Uploads](#7-uploads)
8. [Data model](#8-data-model)
9. [Deploy and CI](#9-deploy-and-ci)
10. [Who can do what](#10-who-can-do-what)
11. [What is not built yet](#11-what-is-not-built-yet)

---

## 1. Public website

Pages read from Postgres. If the database is unreachable a read returns an empty
result rather than an error page (`src/lib/db/availability.ts`).

### 1.1 Home — `/`

- Station search in the hero, which opens the map with the query filled in.
- Live figures from the database: locations, connector types, reviews, average
  rating, city pins.
- "How it works" built around a real station when one has reviews.
- Previews of services (real counts per category) and community (latest posts,
  three clubs).
- **Limits:** the route-planner promo is an illustrative example trip; the app
  band says "coming soon" with no store links.

### 1.2 Charging map — `/map`

- Pins for stations plus approved partner venues that have a location.
- MapLibre on OpenFreeMap tiles (Google Maps behind an env flag), clustered pins,
  opens framed on all of Pakistan.
- Search by name, city or area with keyboard-driven autocomplete.
- Filters: connector (CCS2, CHAdeMO, Type 2, Type 1, GB/T), speed (Slow, Fast,
  Rapid, Ultra), minimum rating, eight amenities. Mobile filter sheet.
- "Locate me", then sort by nearest, top rated or recently added.
- Preview card: navigate (Google Maps directions), details, save (signed in).
- **Limits:** the six seeded stations are sample data, labelled "Example listing"
  wherever they appear.

### 1.3 Station page — `/station/[slug]`

- Photo gallery with lightbox, about, per-connector specs, amenities, hours
  (hidden when unknown), phone, nearby stations in the same city.
- Navigate, save, share, copy address, report (by email).
- Report a photo — business listings only, goes to the admin queue.
- Reviews: 1–5 stars, comment, optional vehicle. One per member per listing;
  owners cannot review their own. Rating breakdown; sort by recent, helpful,
  highest, lowest.
- Views and direction taps on partner listings feed the owner's analytics.
- **Limits:** the "Helpful" button on a review is not stored.

### 1.4 Route planner — `/routes`

- Origin and destination with city autocomplete, car from the catalogue,
  starting battery.
- Six popular routes, one tap each.
- Plans leg by leg: range taken at 85% for motorway driving, chargers searched in
  a corridor along the way, charge time at each stop. Says plainly when a trip
  cannot be made on listed chargers.
- The plan lives in the URL, so it can be shared. Saving needs sign-in.
- **Limits:** distances come from a fixed table of city pairs and the map draws
  straight lines — there is no road-routing service.

### 1.5 Cars — `/cars`, `/cars/[slug]`, `/cars/compare`

- Catalogue from the database. Search, brand, powertrain (EV, PHEV, REEV, HEV),
  minimum battery / range / power, connector. All filters live in the URL.
- Sort by price, range, battery, power, newest.
- Favourites and a "saved only" view — kept in the browser, no sign-in needed.
- Compare up to four cars: summary, win counts, bars per row, "hide identical
  rows". Shareable via `?ids=`.
- Detail page: a summary written from the car's published figures, price and
  four headline figures, specs by section, similar cars, compare and dealer
  links.
- `/vehicles` redirects to `/cars`.
- Figures appear only when a source supplied them; non-dealer prices carry
  "(indicative)" (see README, "Nothing is invented").

### 1.6 Tools — `/charging-calculator`, `/range-converter`

- **Charging calculator:** car, charge from → to, charger, PKR rate. Live result
  with "ready around" time, cost, a six-charger comparison and a "short on time"
  mode. Settings in the URL.
- **Range converter:** converts between WLTP, EPA, NEDC and CLTC as ranges, adds
  Pakistani road estimates, compares two figures. Settings in the URL.

### 1.7 Community — `/community`, `/community/post/[slug]`, `/community/clubs`

- Paged feed, six categories, search, sort by latest, popular or trending.
- Posting (signed in, five per hour): title, content, category. The draft
  survives the trip to the login page and back.
- Likes and comments (signed in), share, related posts.
- Clubs directory with real member counts; club page with members and join /
  leave (signed in).
- **Limits:** members cannot create clubs.

### 1.8 Services directory — `/services`, `/services/[category]/[slug]`, `/services/list`

- Six categories; only approved listings appear. Search, city filter, sort by
  name or city.
- Detail page: offerings, opening hours, call, WhatsApp, email, directions.
- Apply to be listed (signed in): business and contact details, WhatsApp, social
  page, year established, EV brands served, typical prices, opening hours,
  location picker. Goes to the admin review queue.
- **Limits:** no reviews or ratings for services yet (the page says so).

### 1.9 Partners — `/partners` (`/for-businesses` redirects here)

- Directory of approved partner venues, counts by venue type, how it works.
- Meeting request form (no account needed): name, company, email, phone,
  preferred date and time, note. Recorded as a preference, not a booking.
- Calls to action lead to the business sign-up.
- **Limits:** the pricing tiers (Free, PKR 4,999/month, Enterprise) are
  hard-coded, marked in code as "confirm before going public", and there is no
  payment.

### 1.10 Static pages

Credits (data and photo attribution — Open EV Data, Open Charge Map, CC BY-SA),
Privacy, Terms.

---

## 2. Accounts and sign-in

| | |
| --- | --- |
| Sign-up | Full name, email, password (8–200 chars, strength meter), terms. Refused outright if email sending is not configured, so no account is created that can never be verified. |
| Email verification | Six-digit code by email, not a link. Valid 10 minutes, single use, dies after 5 wrong guesses, 60-second resend cooldown. Only an HMAC of the code is stored. No session until verified. |
| After verifying | Signed in, then a car picker (`/onboarding/vehicle`) to set a primary car. |
| Sign-in | Email and password only — no Google or other OAuth. Admins land on `/admin`; an operator-set temporary password forces a password change first. Signing in unverified sends a fresh code. |
| Password reset | Six-digit code, same rules. Never reveals whether an account exists. A reset signs out every other session. |
| Sessions | Signed `plugpk_session` cookie, httpOnly, 14 days. Checked against the database on every request, so a password change or "sign out everywhere" ends all sessions at once. |
| Rate limits | Sign-up 5/IP/hour · sign-in 8/email and 30/IP per 15 min · resend 5/email/hour · code entry 15/email per 15 min · reset 5/email/hour · password change 10/hour. Stored in Postgres, IPs hashed. |
| Email | nodemailer over SMTP (`SMTP_HOST/PORT/USER/PASS`, `MAIL_FROM`). TLS required; message bodies never logged. |

Pages: `/login`, `/signup`, `/verify-email`, `/forgot-password`,
`/reset-password`. Code: `src/lib/db/auth-actions.ts`,
`src/lib/db/email-verification.ts`, `src/lib/email.ts`.

---

## 3. Member dashboard

`/dashboard`, signed in only.

- **Overview:** welcome, profile-completion meter (details, photo, city,
  vehicle), previews of clubs, posts, saved stations, reviews.
- **Vehicles:** add cars from the catalogue, replace, remove, set primary.
- **Saved stations** and **saved routes:** list and remove.
- **My reviews:** list and delete.
- **My clubs:** joined clubs, leave / join.
- **Settings:** name, city, profile photo (4 MB max), change password (needs the
  current one), sign out everywhere.

---

## 4. Business (partner) portal

`/business/*`, for venues that host chargers. Needs an account; one account can
own several listings, with a switcher.

- **List a charger** (`/business/signup`), four steps:
  1. Phone (`03xx-xxxxxxx`).
  2. Venue type (hotel, restaurant, mall, office, dealership, service centre,
     home), name, city, address, website, map pin (geolocation or coordinates
     inside Pakistan).
  3. Chargers, each with a required photo.
  4. Review and submit.

  Every listing starts **pending** until an admin approves it. Five per account
  and ten per IP per hour.
- **Dashboard:** status of each listing (under review / live / not approved, with
  the reason), and photo review state with a fix link for rejected photos.
- **Profile:** edit details and pin. Moving a live listing more than 1 km sends
  it back to review; editing a rejected one re-queues it.
- **Chargers:** connector, power (kW), ports, required primary photo, optional
  port photo. New photos are reviewed; a photo used by another listing is
  refused.
- **Reviews:** read-only list of driver reviews.
- **Analytics:** views, direction taps, average rating, review count over 7, 30
  or 60 days against the previous period, with a views-per-day chart. Live
  listings only; the owner's own views are excluded.
- **Limits:** no opening hours, amenities or venue photos (deliberately not
  collected); no reply to reviews; owners cannot delete a listing; no email is
  sent when a listing is approved or rejected — owners check the portal.

---

## 5. Admin portal

`/admin`. Two gates: `ENABLE_ADMIN=true` (otherwise every `/admin` URL is a 404)
and an account with the admin role, re-checked on every request and in every
server action. Every change is written to an audit log.

| Section | What an operator can do |
| --- | --- |
| Dashboard | KPIs (stations, free ports, queue sizes, members, reviews, alerts), "Needs your attention", live network health, latest posts, catalogue summary. |
| Stations, Connectors | Filter, create, edit, delete; set available ports; per-station history. |
| Businesses | Approve or reject partner listings, edit, delete, review reported photos. |
| Services | Approve or reject applications (setting the map location), manage the directory. |
| Cars | Catalogue with "what's missing" filters, edit, images. |
| Community | Review posts, delete posts or single comments. |
| Reviews | Search and delete; ratings recompute. |
| Meetings | Partner meeting requests: status, delete. |
| Members | Search, filter, sort; per member: grant or remove admin, set a temporary password, delete or anonymise, activity history. |
| Activity | Member activity across website and app, and the admin audit log. |
| App | App analytics over 7/30/90 days: active users (24h/7d/30d), app vs web sign-ups, actions vs previous period, daily-active chart, event log, app users. |
| App releases | Write release notes; "send" shows one once in the app as "What's new". |

The queues (businesses, services, meetings, posts) show counts in the sidebar.
There are no charging-session, revenue or uptime figures — nothing in the data
supplies them.

---

## 6. Mobile app

An installable web app (PWA) at `/app-prototype` — plain JavaScript, no build
step, on the same domain as the site.

- **Tabs:** Home, Stations, Routes, Community.
- **Screens:** onboarding, sign-in / sign-up / verify / forgot password, car
  picker, search, map with filters and station detail, write a review, route
  planner and saved routes, cars / car detail / compare, charging and range
  calculators, community feed and posting (question, photo, poll), clubs,
  services, partners and Partner Up, list a business, profile, settings,
  vehicles, favourites, my reviews.
- **Account:** the same account, rules and rate limits as the website
  (`/api/app/session`).
- **Sync** (`/api/app/sync`): saves, garage, clubs, posts, comments, likes,
  reviews, routes, meeting requests, business listings and photos, service
  applications, profile photo. Each runs through the website's own server
  action and is logged. Retries are safe — no duplicates.
- **Feed:** latest 100 community posts from `/api/app/feed`.
- **Offline:** app files cached by a service worker; changes made offline are
  queued and sent on the next launch. Map tiles are not cached.
- **Limits:** station and car data are a bundled snapshot, not live; reporting a
  station or post only shows a toast; poll votes and saved posts stay on the
  phone; the notifications screen is three fixed messages; no push
  notifications; no store release.

---

## 7. Uploads

Photos (charger photos, avatars, car images) go to Vercel Blob when it is
configured, otherwise `public/uploads/`. 4 MB limit, stored as WebP, file type
checked from the bytes. Code: `src/lib/db/upload-store.ts`.

---

## 8. Data model

Postgres via Prisma (`prisma/schema.prisma`):

- **Charging:** Station, Connector, Review, SavedStation
- **Partners and services:** Business, BusinessDailyStat, BusinessPhotoReport,
  EVService, MeetingRequest
- **Community:** CommunityPost, Comment, PostLike, Club, ClubMember
- **Accounts:** User, Membership, EmailToken, RateLimit
- **Cars and drivers:** Car, Vehicle, UserVehicle, SavedRoute
- **Logs and app:** AdminAuditLog, AppEvent, AppRelease
- **Car-data staging** (crawler removed; tables kept, nothing reads them):
  CarSource, CarSourceRecord, CrawlRun, CarFieldChange, CarChangeHistory,
  CarPriceHistory, CarImageCandidate, CarCandidate, CrawlLogEntry

---

## 9. Deploy and CI

- **Deploy:** Vercel. Production builds apply pending migrations first
  (`scripts/deploy-migrate.mjs`, needs `DIRECT_URL`); a failed migration fails
  the build and the previous deployment keeps serving. Preview builds never
  migrate. Migrations must stay additive.
- **CI** (`.github/workflows/ci.yml`, on pushes to `main` and pull requests):
  fresh Postgres 16 → `npm ci` → `prisma validate` → migrate → data import →
  type-check → lint → `next build`. There is no automated test step.

---

## 10. Who can do what

| | Visitor | Member | Partner | Admin |
| --- | :-: | :-: | :-: | :-: |
| Browse map, stations, cars, routes, tools, community, services | ✓ | ✓ | ✓ | ✓ |
| Favourite and compare cars (in the browser) | ✓ | ✓ | ✓ | ✓ |
| Request a partner meeting | ✓ | ✓ | ✓ | ✓ |
| Save stations and routes, review, post, comment, like, join clubs | | ✓ | ✓ | ✓ |
| Apply to the services directory | | ✓ | ✓ | ✓ |
| List a charger venue, manage it, see its analytics | | ✓ | ✓ | ✓ |
| Approve listings, moderate, manage catalogue and members | | | | ✓ |

A "partner" is an ordinary member who owns at least one business listing.

---

## 11. What is not built yet

- Road routing and real distances in the route planner (fixed city-pair table,
  straight lines).
- Real charging stations beyond the six labelled sample listings.
- Reviews for services; storing "Helpful" votes on station reviews.
- Members creating clubs.
- Partner pricing confirmed and payments.
- Replies to reviews; owner deletion of a listing; approval emails to partners.
- Sign-in with Google or other providers.
- Mobile app: store release, push notifications, live station/car data, reports
  that reach the server, synced poll votes, real notifications.
- Charging-session, revenue and uptime data.
- Automated tests in CI.
