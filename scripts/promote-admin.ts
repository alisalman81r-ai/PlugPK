// scripts/promote-admin.ts
//
// Grants or revokes operator access for one account.
//
//   npx tsx scripts/promote-admin.ts you@example.com
//   npx tsx scripts/promote-admin.ts you@example.com --revoke
//
// ── Why this script still exists ──────────────────────────────────────
//
// Once there is one admin, roles are granted and revoked from the portal, on
// the member's page (/admin/members/<id>), where the change is audited and the
// last admin cannot be removed. This script is for the two cases the portal
// cannot cover: the very first admin — reaching the portal requires already
// being one — and recovering when every admin is locked out. A script run by
// whoever holds DATABASE_URL is the smallest thing that can break that circle:
// it needs no route, no form and no second gate to protect.
//
// It writes no row to the audit log, because there is no signed-in operator to
// attribute it to. Use the portal whenever it is reachable.
//
// It is deliberately not reachable over HTTP. An endpoint that can grant admin
// is worth more to an attacker than every other route on the site put together,
// and it would exist for the rest of the project's life to save one command.
//
// Writes one column on one row. It cannot create an account — sign up through
// the normal form first, so the password is chosen by the person who owns it
// and never passes through here.

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const [rawEmail, ...flags] = process.argv.slice(2)
  const revoke = flags.includes('--revoke')

  if (!rawEmail) {
    console.error('Usage: npx tsx scripts/promote-admin.ts <email> [--revoke]')
    process.exitCode = 1
    return
  }

  // Matches how signIn() normalises it, so the address typed here finds the
  // row that the login form would have created.
  const email = rawEmail.trim().toLowerCase()

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, isAdmin: true },
  })

  if (!user) {
    console.error(`\n  No account with that email.`)
    console.error(`  Sign up through the site first, then run this again.\n`)
    process.exitCode = 1
    return
  }

  if (user.isAdmin === !revoke) {
    console.log(`\n  ${user.name} is already ${revoke ? 'not an admin' : 'an admin'}. Nothing to do.\n`)
    return
  }

  // Revoking also bumps sessionVersion, which ends every session the account
  // has open — the same thing the portal's revoke does.
  await prisma.user.update({
    where: { email },
    data: revoke ? { isAdmin: false, sessionVersion: { increment: 1 } } : { isAdmin: true },
  })

  console.log(`\n  ${revoke ? 'Revoked' : 'Granted'} admin for ${user.name}.`)
  console.log(
    revoke
      ? '  They are signed out everywhere and lose the portal on their next request.\n'
      : '  Sign out and back in to be sent straight to /admin.\n',
  )
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
