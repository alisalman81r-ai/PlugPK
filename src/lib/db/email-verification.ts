// src/lib/db/email-verification.ts
import 'server-only'

import { createHash, randomBytes, randomUUID } from 'node:crypto'

import { appOrigin, escapeHtml, sendEmail } from '@/lib/email'

import { prisma } from './client'

/**
 * Proving an account's owner holds its email address.
 *
 * Not a 'use server' module: issuing and redeeming links must only happen
 * behind the checks in auth-actions.ts, never straight from a browser.
 *
 * The link carries 32 random bytes. Only their SHA-256 is stored, so the
 * table alone cannot be turned into a working link. Each new link replaces
 * the account's previous unused ones, so only the most recent email works.
 */

const PURPOSE = 'verify'
const LINK_LIFETIME_MS = 24 * 60 * 60 * 1000

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** Creates a fresh link for the account and emails it. False if sending failed. */
export async function sendVerificationEmail(
  user: { id: string; email: string; name: string },
  redirectTo: string | null,
): Promise<boolean> {
  const token = randomBytes(32).toString('base64url')

  await prisma.$transaction([
    prisma.emailToken.deleteMany({ where: { userId: user.id, purpose: PURPOSE, usedAt: null } }),
    prisma.emailToken.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        purpose: PURPOSE,
        tokenHash: hashToken(token),
        redirectTo,
        expiresAt: new Date(Date.now() + LINK_LIFETIME_MS),
      },
    }),
  ])

  const link = `${appOrigin()}/verify-email?token=${token}`
  const first = user.name.split(/\s+/)[0] || 'there'

  return sendEmail({
    to: user.email,
    subject: 'Confirm your email for Plug.pk',
    text:
      `Hi ${first},\n\n` +
      `Confirm this is your email address to finish creating your Plug.pk account:\n\n${link}\n\n` +
      `The link works once and expires in 24 hours. If you did not sign up, ignore this email ` +
      `and no account will be activated.\n\n— Plug.pk`,
    html: `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.6;color:#0f172a;max-width:480px">
  <p>Hi ${escapeHtml(first)},</p>
  <p>Confirm this is your email address to finish creating your Plug.pk account.</p>
  <p style="margin:28px 0"><a href="${link}" style="background:#2563eb;color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:10px;display:inline-block">Confirm my email</a></p>
  <p style="color:#64748b;font-size:13px">Or paste this link into your browser:<br><span style="word-break:break-all">${link}</span></p>
  <p style="color:#64748b;font-size:13px">The link works once and expires in 24 hours. If you did not sign up, ignore this email and no account will be activated.</p>
</div>`,
  })
}

/**
 * Redeems a link: marks the token used and the account verified.
 *
 * The token is claimed with a conditional update (unused and unexpired), so
 * two clicks racing each other cannot both succeed. Returns the account and
 * where to send it, or null for an unknown, used or expired link.
 */
export async function redeemVerificationToken(
  token: string,
): Promise<{ userId: string; redirectTo: string | null } | null> {
  if (typeof token !== 'string' || token.length < 20 || token.length > 100) return null
  const tokenHash = hashToken(token)
  const now = new Date()

  const claimed = await prisma.emailToken.updateMany({
    where: { tokenHash, purpose: PURPOSE, usedAt: null, expiresAt: { gt: now } },
    data: { usedAt: now },
  })
  if (claimed.count !== 1) return null

  const row = await prisma.emailToken.findUnique({
    where: { tokenHash },
    select: { userId: true, redirectTo: true },
  })
  if (!row) return null

  // updateMany so an already-verified account keeps its original date.
  await prisma.user.updateMany({
    where: { id: row.userId, emailVerifiedAt: null },
    data: { emailVerifiedAt: now },
  })
  return row
}

/** Whether a link is still redeemable, without using it up. For the confirm page. */
export async function isVerificationTokenLive(token: string): Promise<boolean> {
  if (typeof token !== 'string' || token.length < 20 || token.length > 100) return false
  const row = await prisma.emailToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { purpose: true, usedAt: true, expiresAt: true },
  })
  return !!row && row.purpose === PURPOSE && !row.usedAt && row.expiresAt > new Date()
}
