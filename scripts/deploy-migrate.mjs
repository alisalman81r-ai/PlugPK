// scripts/deploy-migrate.mjs
//
// Runs before `next build` (see "build" in package.json). On a Vercel
// production build it applies pending database migrations, so new code never
// goes live against a database that lacks its tables or columns.
//
// ── When it runs ──────────────────────────────────────────────────────
//
//   Vercel production build, DIRECT_URL set   → prisma migrate deploy
//   Vercel production build, no DIRECT_URL    → skipped, with a warning
//   anything else (local, CI, preview builds) → skipped
//
// DIRECT_URL is required because migrations cannot run through the pooled
// connection (PgBouncer transaction mode refuses DDL and advisory locks; see
// .env.example). Without it the build still succeeds, exactly as before this
// script existed, and the warning says what to add.
//
// Preview builds are skipped on purpose: they share the production database,
// and an unmerged branch must never change it.
//
// ── If a migration fails ──────────────────────────────────────────────
//
// The build fails and Vercel keeps serving the previous deployment, which
// still matches the unchanged database. That is the safe direction: code that
// expects a migration is never served without it.
//
// Migrations must stay additive (new tables, new nullable or defaulted
// columns), because the old deployment keeps serving while the new one
// builds — and it runs against the migrated database.

import { execSync } from 'node:child_process'

const isProductionBuild = process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'production'

if (!isProductionBuild) {
  console.log('[deploy-migrate] not a Vercel production build — skipping migrations')
  process.exit(0)
}

if (!process.env.DIRECT_URL) {
  console.warn(
    '[deploy-migrate] WARNING: DIRECT_URL is not set, so pending migrations were NOT applied.\n' +
      '  Add DIRECT_URL (the direct, port-5432 connection string) under Vercel →\n' +
      '  Settings → Environment Variables → Production, or run `npx prisma migrate deploy`\n' +
      '  against production yourself before this deployment is used.',
  )
  process.exit(0)
}

console.log('[deploy-migrate] applying pending migrations to the production database…')
try {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' })
} catch {
  console.error('[deploy-migrate] migration failed — stopping the build so the previous deployment keeps serving.')
  process.exit(1)
}
