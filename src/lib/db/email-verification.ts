// src/lib/db/email-verification.ts
import 'server-only'

import { createHmac, randomInt, randomUUID, timingSafeEqual } from 'node:crypto'

import { escapeHtml, sendEmail } from '@/lib/email'
import { getServerSecret } from '@/lib/user-auth'

import { prisma } from './client'

/**
 * Six-digit codes sent by email: one that proves an account's owner holds its
 * address ('verify-code'), and one that lets them choose a new password
 * ('reset-code').
 *
 * Not a 'use server' module: issuing and checking codes only happens behind
 * the rate limits in auth-actions.ts and session-actions.ts.
 *
 * - The code comes from crypto.randomInt, uniformly over 000000–999999.
 * - Only an HMAC (server secret, account id, purpose, code) is stored, so the
 *   table cannot be turned back into codes, even by trying all million of
 *   them, and a code of one purpose never matches the other.
 * - It expires after 10 minutes and dies after MAX_ATTEMPTS wrong guesses.
 * - A new code replaces the account's unused ones of that purpose: only the
 *   latest email works.
 * - It is used once: usedAt is claimed with a conditional update, and only the
 *   request that claims it may act on it.
 * - Every time is stamped here, never by the database's clock, so a database
 *   whose session time zone is not UTC cannot skew expiry or the cooldown.
 */

type Purpose = 'verify-code' | 'reset-code'

const CODE_LIFETIME_MS = 10 * 60 * 1000
export const MAX_ATTEMPTS = 5
/** A new code is not sent while the last one is younger than this. */
const RESEND_COOLDOWN_MS = 60 * 1000

function hashCode(purpose: Purpose, userId: string, code: string): string | null {
  const secret = getServerSecret()
  if (!secret) return null
  // Verification codes keep the input they have always had, so codes already
  // emailed stay valid; reset codes are domain-separated by their purpose.
  const input = purpose === 'verify-code' ? `${userId}:${code}` : `${purpose}:${userId}:${code}`
  return createHmac('sha256', secret).update(input).digest('hex')
}

export type SendCodeResult =
  | { ok: true; response?: string }
  | { ok: false; reason: 'send-failed' | 'cooldown' | 'config' }

interface CodeEmail {
  subject: (code: string) => string
  text: (first: string, code: string) => string
  html: (first: string, code: string) => string
}

const codeBlock = (code: string) =>
  `<p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:20px 0;font-family:ui-monospace,Consolas,monospace">${code}</p>`
const wrap = (inner: string) =>
  `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.6;color:#0f172a;max-width:480px">${inner}</div>`

const EMAILS: Record<Purpose, CodeEmail> = {
  'verify-code': {
    subject: (code) => `${code} is your Plug.pk verification code`,
    text: (first, code) =>
      `Hi ${first},\n\nYour Plug.pk verification code is:\n\n    ${code}\n\n` +
      `Enter it on the sign-up screen to confirm this email address. It expires in 10 minutes ` +
      `and works once.\n\nIf you did not create a Plug.pk account, ignore this email — ` +
      `no account will be activated.\n\n— Plug.pk`,
    html: (first, code) =>
      wrap(`
  <p>Hi ${escapeHtml(first)},</p>
  <p>Your Plug.pk verification code is:</p>
  ${codeBlock(code)}
  <p>Enter it on the sign-up screen to confirm this email address. It expires in 10 minutes and works once.</p>
  <p style="color:#64748b;font-size:13px">If you did not create a Plug.pk account, ignore this email — no account will be activated.</p>`),
  },
  'reset-code': {
    subject: (code) => `${code} is your Plug.pk password reset code`,
    text: (first, code) =>
      `Hi ${first},\n\nSomeone asked to reset the password on your Plug.pk account. Your code is:\n\n    ${code}\n\n` +
      `Enter it on the reset screen with your new password. It expires in 10 minutes and works once.\n\n` +
      `If this was not you, ignore this email: your password stays as it is, and nobody can ` +
      `change it without this code.\n\n— Plug.pk`,
    html: (first, code) =>
      wrap(`
  <p>Hi ${escapeHtml(first)},</p>
  <p>Someone asked to reset the password on your Plug.pk account. Your code is:</p>
  ${codeBlock(code)}
  <p>Enter it on the reset screen with your new password. It expires in 10 minutes and works once.</p>
  <p style="color:#64748b;font-size:13px">If this was not you, ignore this email: your password stays as it is, and nobody can change it without this code.</p>`),
  },
}

/**
 * Creates a fresh code of a purpose for the account and emails it.
 *
 * Returns ok only when the SMTP server accepted the message. On failure the
 * new code is deleted again, so a code nobody received is never left live.
 */
async function issueCode(
  purpose: Purpose,
  user: { id: string; email: string; name: string },
  { redirectTo = null, force = false }: { redirectTo?: string | null; force?: boolean } = {},
): Promise<SendCodeResult> {
  const now = Date.now()
  if (!force) {
    const recent = await prisma.emailToken.findFirst({
      where: { userId: user.id, purpose, usedAt: null, createdAt: { gt: new Date(now - RESEND_COOLDOWN_MS) } },
      select: { id: true },
    })
    if (recent) return { ok: false, reason: 'cooldown' }
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  const tokenHash = hashCode(purpose, user.id, code)
  if (!tokenHash) {
    console.error('[code] no server secret: SESSION_SECRET is not set')
    return { ok: false, reason: 'config' }
  }

  // Keep the destination the first code was sent with, unless a new one is given.
  const previous = redirectTo
    ? null
    : await prisma.emailToken.findFirst({
        where: { userId: user.id, purpose },
        orderBy: { createdAt: 'desc' },
        select: { redirectTo: true },
      })

  const id = randomUUID()
  await prisma.$transaction([
    prisma.emailToken.deleteMany({ where: { userId: user.id, purpose, usedAt: null } }),
    prisma.emailToken.create({
      data: {
        id,
        userId: user.id,
        purpose,
        tokenHash,
        redirectTo: redirectTo ?? previous?.redirectTo ?? null,
        createdAt: new Date(now),
        expiresAt: new Date(now + CODE_LIFETIME_MS),
      },
    }),
  ])

  const first = user.name.split(/\s+/)[0] || 'there'
  const email = EMAILS[purpose]
  const sent = await sendEmail({
    to: user.email,
    subject: email.subject(code),
    text: email.text(first, code),
    html: email.html(first, code),
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
 * Checks a code of a purpose for the account and, if right, spends it. A
 * wrong guess is counted with a conditional update, so parallel guesses
 * cannot exceed the limit; only the request that claims the code succeeds.
 */
async function redeemCode(purpose: Purpose, userId: string, rawCode: string): Promise<CheckCodeResult> {
  const code = String(rawCode ?? '').replace(/\s+/g, '')
  const token = await prisma.emailToken.findFirst({
    where: { userId, purpose, usedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { id: true, tokenHash: true, expiresAt: true, attempts: true, redirectTo: true },
  })
  if (!token) return { ok: false, reason: 'none' }
  if (token.expiresAt <= new Date()) return { ok: false, reason: 'expired' }
  if (token.attempts >= MAX_ATTEMPTS) return { ok: false, reason: 'too-many' }

  const expected = /^\d{6}$/.test(code) ? hashCode(purpose, userId, code) : null
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

  const now = new Date()
  const claimed = await prisma.emailToken.updateMany({
    where: { id: token.id, usedAt: null, expiresAt: { gt: now }, attempts: { lt: MAX_ATTEMPTS } },
    data: { usedAt: now },
  })
  if (claimed.count !== 1) return { ok: false, reason: 'none' }
  return { ok: true, redirectTo: token.redirectTo }
}

// ─── Email verification ─────────────────────────────────

export function sendVerificationCode(
  user: { id: string; email: string; name: string },
  options?: { redirectTo?: string | null; force?: boolean },
): Promise<SendCodeResult> {
  return issueCode('verify-code', user, options)
}

/** Checks a verification code; on success the account is marked verified. */
export async function checkVerificationCode(userId: string, rawCode: string): Promise<CheckCodeResult> {
  const result = await redeemCode('verify-code', userId, rawCode)
  if (result.ok) {
    // updateMany so an already-verified account keeps its original date.
    await prisma.user.updateMany({ where: { id: userId, emailVerifiedAt: null }, data: { emailVerifiedAt: new Date() } })
  }
  return result
}

// ─── Password reset ─────────────────────────────────────

export function sendPasswordResetCode(
  user: { id: string; email: string; name: string },
  options?: { force?: boolean },
): Promise<SendCodeResult> {
  return issueCode('reset-code', user, options)
}

/** Checks a reset code. Setting the new password is the caller's job. */
export function checkPasswordResetCode(userId: string, rawCode: string): Promise<CheckCodeResult> {
  return redeemCode('reset-code', userId, rawCode)
}
