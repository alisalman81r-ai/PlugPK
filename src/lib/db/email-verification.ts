// src/lib/db/email-verification.ts
import 'server-only'

import { createHash, randomBytes, randomUUID } from 'node:crypto'

import { getAppUrl } from '@/lib/app-url'
import { sendEmail } from '@/lib/email'
import { verificationEmail } from '@/lib/emails/verify-email'

import { prisma } from './client'

/**
 * Email verification tokens.
 *
 * Not a 'use server' module: nothing here is callable from a browser. The
 * public entry points are in auth-actions.ts, which add rate limits.
 *
 *   - 32 random bytes from the OS CSPRNG, base64url — unguessable.
 *   - Only the SHA-256 hash is stored; the raw token lives in the email alone.
 *   - Valid for 24 hours, once. Using it deletes it; sending a new one deletes
 *     every older one, so only the newest link in the inbox works.
 */

export const TOKEN_TTL_HOURS = 24

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** A well-formed token is 43 base64url characters; anything else is junk. */
function looksLikeToken(token: unknown): token is string {
  return typeof token === 'string' && /^[A-Za-z0-9_-]{43}$/.test(token)
}

/**
 * Issues a fresh link for the account and emails it to the account's address.
 * Previous links for the account stop working.
 */
export async function sendVerificationEmail(user: {
  id: string
  email: string
  name: string
}): Promise<{ sent: boolean }> {
  const token = randomBytes(32).toString('base64url')

  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } }),
    prisma.emailVerificationToken.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000),
      },
    }),
  ])

  const url = `${getAppUrl()}/verify-email?token=${encodeURIComponent(token)}`
  const message = verificationEmail({ name: user.name, url, expiresInHours: TOKEN_TTL_HOURS })
  const result = await sendEmail({ to: user.email, ...message })
  return { sent: result.ok }
}

export type TokenState = 'valid' | 'expired' | 'invalid'

/**
 * What a link would do, without using it — for the page that shows the
 * "Verify my email" button. A used, unknown or malformed token is 'invalid';
 * nothing about the account is revealed either way.
 */
export async function inspectVerificationToken(token: unknown): Promise<TokenState> {
  if (!looksLikeToken(token)) return 'invalid'
  const row = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { expiresAt: true },
  })
  if (!row) return 'invalid'
  return row.expiresAt.getTime() < Date.now() ? 'expired' : 'valid'
}

export type VerifyResult = 'verified' | 'expired' | 'invalid'

/**
 * Uses a link: marks the account verified and deletes the token, in one
 * transaction. The delete is the gate — deleteMany reports how many rows it
 * removed, so two clicks racing on the same link cannot both succeed.
 */
export async function consumeVerificationToken(token: unknown): Promise<VerifyResult> {
  if (!looksLikeToken(token)) return 'invalid'
  const tokenHash = hashToken(token)

  return prisma.$transaction(async (tx) => {
    const row = await tx.emailVerificationToken.findUnique({
      where: { tokenHash },
      select: { userId: true, expiresAt: true },
    })
    if (!row) return 'invalid' as const

    const removed = await tx.emailVerificationToken.deleteMany({ where: { tokenHash } })
    if (removed.count !== 1) return 'invalid' as const

    if (row.expiresAt.getTime() < Date.now()) return 'expired' as const

    await tx.user.update({ where: { id: row.userId }, data: { emailVerified: true } })
    // Any other outstanding links for the account are now pointless.
    await tx.emailVerificationToken.deleteMany({ where: { userId: row.userId } })
    return 'verified' as const
  })
}
