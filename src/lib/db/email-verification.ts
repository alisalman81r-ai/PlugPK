// src/lib/db/email-verification.ts
import 'server-only'

import { createHmac, randomInt, randomUUID, timingSafeEqual } from 'node:crypto'

import { escapeHtml, sendEmail } from '@/lib/email'
import { getServerSecret } from '@/lib/user-auth'

import { prisma } from './client'

/**
 * Six-digit codes that prove an account's owner holds its email address.
 *
 * Not a 'use server' module: issuing and checking codes only happens behind
 * the rate limits in auth-actions.ts and session-actions.ts.
 *
 * - The code comes from crypto.randomInt, uniformly over 000000–999999.
 * - Only HMAC-SHA256(secret, userId + code) is stored, so the table cannot be
 *   turned back into codes, even by trying all million of them.
 * - It expires after 10 minutes and dies after MAX_ATTEMPTS wrong guesses.
 * - A new code replaces the account's unused ones: only the latest email works.
 * - It is used once: usedAt is claimed with a conditional update, and only the
 *   request that claims it marks the account verified.
 */

const PURPOSE = 'verify-code'
const CODE_LIFETIME_MS = 10 * 60 * 1000
export const MAX_ATTEMPTS = 5
/** A new code is not sent while the last one is younger than this. */
const RESEND_COOLDOWN_MS = 60 * 1000

function hashCode(userId: string, code: string): string | null {
  const secret = getServerSecret()
  if (!secret) return null
  return createHmac('sha256', secret).update(`${userId}:${code}`).digest('hex')
}

export type SendCodeResult =
  | { ok: true; response?: string }
  | { ok: false; reason: 'send-failed' | 'cooldown' | 'config' }

/**
 * Creates a fresh code for the account and emails it.
 *
 * Returns ok only when the SMTP server accepted the message. On failure the
 * new code is deleted again, so a code nobody received is never left live.
 */
export async function sendVerificationCode(
  user: { id: string; email: string; name: string },
  { redirectTo = null, force = false }: { redirectTo?: string | null; force?: boolean } = {},
): Promise<SendCodeResult> {
  if (!force) {
    const recent = await prisma.emailToken.findFirst({
      where: { userId: user.id, purpose: PURPOSE, usedAt: null, createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) } },
      select: { id: true },
    })
    if (recent) return { ok: false, reason: 'cooldown' }
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  const tokenHash = hashCode(user.id, code)
  if (!tokenHash) {
    console.error('[verify] no server secret: SESSION_SECRET is not set')
    return { ok: false, reason: 'config' }
  }

  // Keep the destination the first code was sent with, unless a new one is given.
  const previous = redirectTo
    ? null
    : await prisma.emailToken.findFirst({
        where: { userId: user.id, purpose: PURPOSE },
        orderBy: { createdAt: 'desc' },
        select: { redirectTo: true },
      })

  const id = randomUUID()
  await prisma.$transaction([
    prisma.emailToken.deleteMany({ where: { userId: user.id, purpose: PURPOSE, usedAt: null } }),
    prisma.emailToken.create({
      data: {
        id,
        userId: user.id,
        purpose: PURPOSE,
        tokenHash,
        redirectTo: redirectTo ?? previous?.redirectTo ?? null,
        expiresAt: new Date(Date.now() + CODE_LIFETIME_MS),
      },
    }),
  ])

  const first = user.name.split(/\s+/)[0] || 'there'
  const sent = await sendEmail({
    to: user.email,
    subject: `${code} is your Plug.pk verification code`,
    text:
      `Hi ${first},\n\n` +
      `Your Plug.pk verification code is:\n\n    ${code}\n\n` +
      `Enter it on the sign-up screen to confirm this email address. It expires in 10 minutes ` +
      `and works once.\n\nIf you did not create a Plug.pk account, ignore this email — ` +
      `no account will be activated.\n\n— Plug.pk`,
    html: `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.6;color:#0f172a;max-width:480px">
  <p>Hi ${escapeHtml(first)},</p>
  <p>Your Plug.pk verification code is:</p>
  <p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:20px 0;font-family:ui-monospace,Consolas,monospace">${code}</p>
  <p>Enter it on the sign-up screen to confirm this email address. It expires in 10 minutes and works once.</p>
  <p style="color:#64748b;font-size:13px">If you did not create a Plug.pk account, ignore this email — no account will be activated.</p>
</div>`,
  })

  if (!sent.ok) {
    await prisma.emailToken.deleteMany({ where: { id } })
    return { ok: false, reason: 'send-failed' }
  }
  return { ok: true, response: sent.response }
}

export type CheckCodeResult =
  | { ok: true; redirectTo: string | null }
  | { ok: false; reason: 'wrong'; attemptsLeft: number }
  | { ok: false; reason: 'expired' | 'too-many' | 'none' }

/**
 * Checks a code for the account. A wrong guess is counted before the
 * comparison is reported, with a conditional update, so parallel guesses
 * cannot exceed the limit. On success the code is spent and the account
 * marked verified, in one transaction.
 */
export async function checkVerificationCode(userId: string, rawCode: string): Promise<CheckCodeResult> {
  const code = String(rawCode ?? '').replace(/\s+/g, '')
  const token = await prisma.emailToken.findFirst({
    where: { userId, purpose: PURPOSE, usedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { id: true, tokenHash: true, expiresAt: true, attempts: true, redirectTo: true },
  })
  if (!token) return { ok: false, reason: 'none' }
  if (token.expiresAt <= new Date()) return { ok: false, reason: 'expired' }
  if (token.attempts >= MAX_ATTEMPTS) return { ok: false, reason: 'too-many' }

  const expected = /^\d{6}$/.test(code) ? hashCode(userId, code) : null
  const matches =
    !!expected && timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(token.tokenHash, 'hex'))

  if (!matches) {
    const counted = await prisma.emailToken.updateMany({
      where: { id: token.id, usedAt: null, attempts: { lt: MAX_ATTEMPTS } },
      data: { attempts: { increment: 1 } },
    })
    if (counted.count === 0) return { ok: false, reason: 'too-many' }
    const left = MAX_ATTEMPTS - (token.attempts + 1)
    return left > 0 ? { ok: false, reason: 'wrong', attemptsLeft: left } : { ok: false, reason: 'too-many' }
  }

  // Claim first; only the request that claims the code may verify the account.
  const now = new Date()
  const claimed = await prisma.emailToken.updateMany({
    where: { id: token.id, usedAt: null, expiresAt: { gt: now }, attempts: { lt: MAX_ATTEMPTS } },
    data: { usedAt: now },
  })
  if (claimed.count !== 1) return { ok: false, reason: 'none' }

  // updateMany so an already-verified account keeps its original date.
  await prisma.user.updateMany({ where: { id: userId, emailVerifiedAt: null }, data: { emailVerifiedAt: now } })
  return { ok: true, redirectTo: token.redirectTo }
}
