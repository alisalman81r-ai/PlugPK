// src/lib/db/auth-actions.ts
'use server'

import { randomUUID } from 'node:crypto'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'

import { getEmailConfigError } from '@/lib/email'
import { hashPassword } from '@/lib/passwords'
import { safeRedirect } from '@/lib/safe-redirect'
import { checkEmail, checkText } from '@/lib/validate'

import { prisma } from './client'
import {
  checkPasswordResetCode,
  checkVerificationCode,
  sendPasswordResetCode,
  sendVerificationCode,
  type SendCodeResult,
} from './email-verification'
import { checkLimits, clientFingerprint, keyPart, retryMessage } from './rate-limit'
import { startSession } from './session'

/**
 * Registration for EV owners.
 *
 * The password is hashed with scrypt against a per-user random salt
 * (src/lib/passwords.ts) and the plaintext is never written anywhere.
 *
 * hashPassword and verifyPassword used to be exported from here, which made
 * them public endpoints; they now live in a server-only module.
 *
 * A new account is not signed in. It is emailed a six-digit code, and only
 * entering that code (verifyEmailCode) verifies the address and starts a
 * session — so nobody can hold an account under an address they do not
 * control.
 */

export interface SignUpResult {
  ok: boolean
  message?: string
  /** Set on success: the address the code was (or should have been) sent to. */
  verifyEmail?: string
  /** False when the account exists but the code email could not be sent. */
  emailSent?: boolean
}

/** What to tell someone after a send attempt. Never claims a failed send. */
function sendResultMessage(result: SendCodeResult, email: string): string {
  if (result.ok) return `We sent a 6-digit code to ${email}.`
  if (result.reason === 'cooldown') return 'A code was sent less than a minute ago. Check your inbox, or wait a moment and ask again.'
  return 'We could not send the email just now. Wait a moment, then tap "Send a new code".'
}

export async function registerUser(form: FormData): Promise<SignUpResult> {
  const name = checkText(form.get('name'), 'your name', { max: 80, required: true })
  if (!name.ok) return name
  const email = checkEmail(form.get('email'))
  if (!email.ok) return email
  const city = checkText(form.get('city'), 'city', { max: 80 })
  if (!city.ok) return city
  const vehicle = checkText(form.get('vehicle'), 'vehicle', { max: 120 })
  if (!vehicle.ok) return vehicle

  const password = String(form.get('password') ?? '')
  if (password.length < 8) {
    return { ok: false, message: 'Password must be at least 8 characters.' }
  }
  if (password.length > 200) {
    return { ok: false, message: 'Password must be 200 characters or fewer.' }
  }

  // Checked before the row is written: an account whose code can never be sent
  // would be stuck unverified for good.
  const emailError = getEmailConfigError()
  if (emailError) {
    console.error('[auth] sign-up refused:', emailError)
    return { ok: false, message: 'Creating accounts is unavailable right now. Please try again later.' }
  }

  const limit = await checkLimits([
    { key: `signup:ip:${clientFingerprint()}`, limit: 5, windowSeconds: 60 * 60 },
  ])
  if (!limit.allowed) {
    return { ok: false, message: retryMessage(limit.retryAfterSeconds, 'Too many accounts created') }
  }

  const raw = form.get('redirect')
  const redirectTo = typeof raw === 'string' && raw ? safeRedirect(raw, '') || null : null

  let user: { id: string; email: string; name: string }
  try {
    user = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: email.value,
        name: name.value,
        city: city.value || null,
        vehicle: vehicle.value || null,
        passwordHash: await hashPassword(password),
      },
      select: { id: true, email: true, name: true },
    })
  } catch (error) {
    // The unique index on email is the real check, so two simultaneous sign-ups
    // with one address get this message rather than a crashed page.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { ok: false, message: 'An account already exists for that email. Try signing in.' }
    }
    throw error
  }

  // A failed send still leaves a usable account: the code screen offers a
  // resend, and signing in sends a fresh code too.
  const sent = await sendVerificationCode(user, { redirectTo, force: true })

  revalidatePath('/')
  return {
    ok: true,
    verifyEmail: user.email,
    emailSent: sent.ok,
    message: sendResultMessage(sent, user.email),
  }
}

export interface ResendResult {
  ok: boolean
  message: string
}

/**
 * Sends a new code. An address with no unconfirmed account gets the same
 * reply as one that was sent a code, so this cannot list who has signed up —
 * but a send that failed says so, rather than claiming an email went out.
 */
export async function resendVerification(rawEmail: string): Promise<ResendResult> {
  const email = checkEmail(rawEmail)
  if (!email.ok) return { ok: false, message: email.message ?? 'Enter a valid email address.' }

  const limit = await checkLimits([
    { key: `verify-resend:email:${keyPart(email.value)}`, limit: 5, windowSeconds: 60 * 60 },
    { key: `verify-resend:ip:${clientFingerprint()}`, limit: 15, windowSeconds: 60 * 60 },
  ])
  if (!limit.allowed) {
    return { ok: false, message: retryMessage(limit.retryAfterSeconds, 'Too many codes sent') }
  }

  const user = await prisma.user.findUnique({
    where: { email: email.value },
    select: { id: true, email: true, name: true, emailVerifiedAt: true },
  })
  if (user && !user.emailVerifiedAt) {
    const sent = await sendVerificationCode(user)
    if (!sent.ok) return { ok: false, message: sendResultMessage(sent, user.email) }
  }

  return { ok: true, message: `If ${email.value} is waiting for confirmation, a new code is on its way.` }
}

export interface VerifyResult {
  ok: boolean
  message?: string
  /** Where to go next, on success. */
  redirectTo?: string
  /** The code is spent (expired or too many tries): only a new one can work. */
  needsNewCode?: boolean
}

/**
 * Checks the emailed code, and on success verifies the address and signs the
 * account in. Wrong guesses are limited per code (MAX_ATTEMPTS), and per
 * address and per IP here, so the million possible codes cannot be walked.
 */
export async function verifyEmailCode(rawEmail: string, rawCode: string): Promise<VerifyResult> {
  const email = checkEmail(rawEmail)
  if (!email.ok) return { ok: false, message: email.message ?? 'Enter a valid email address.' }
  const code = String(rawCode ?? '').replace(/\s+/g, '')
  if (!/^\d{6}$/.test(code)) return { ok: false, message: 'Enter the 6-digit code from the email.' }

  const limit = await checkLimits([
    { key: `verify-code:email:${keyPart(email.value)}`, limit: 15, windowSeconds: 15 * 60 },
    { key: `verify-code:ip:${clientFingerprint()}`, limit: 50, windowSeconds: 15 * 60 },
  ])
  if (!limit.allowed) {
    return { ok: false, message: retryMessage(limit.retryAfterSeconds, 'Too many tries') }
  }

  const user = await prisma.user.findUnique({
    where: { email: email.value },
    select: { id: true, emailVerifiedAt: true },
  })
  if (!user) return { ok: false, message: 'That code is not right. Check the email and try again.' }
  if (user.emailVerifiedAt) {
    return { ok: false, message: 'This email is already confirmed. Sign in with your password.' }
  }

  const result = await checkVerificationCode(user.id, code)
  if (!result.ok) {
    switch (result.reason) {
      case 'wrong':
        return {
          ok: false,
          message: `That code is not right. ${result.attemptsLeft} ${result.attemptsLeft === 1 ? 'try' : 'tries'} left.`,
        }
      case 'expired':
        return { ok: false, needsNewCode: true, message: 'That code has expired. Send a new one.' }
      case 'too-many':
        return { ok: false, needsNewCode: true, message: 'Too many wrong tries. Send a new code.' }
      default:
        return { ok: false, needsNewCode: true, message: 'There is no active code for this email. Send a new one.' }
    }
  }

  if (!(await startSession(user.id))) {
    return { ok: false, message: 'Your email is confirmed. Please sign in.', redirectTo: '/login' }
  }

  revalidatePath('/')
  revalidatePath('/dashboard')
  return { ok: true, redirectTo: result.redirectTo ?? '/onboarding/vehicle' }
}

// ─── Password reset ─────────────────────────────────────

/**
 * Emails a six-digit reset code.
 *
 * The reply is the same whether or not the address has an account, so this
 * cannot be used to find out who is registered — except when an email to a
 * real account fails to send, which is said plainly rather than claimed as
 * sent. Limited per address and per IP, like every other code.
 */
export async function requestPasswordReset(rawEmail: string): Promise<ResendResult> {
  const email = checkEmail(rawEmail)
  if (!email.ok) return { ok: false, message: email.message ?? 'Enter a valid email address.' }

  const emailError = getEmailConfigError()
  if (emailError) {
    console.error('[auth] reset refused:', emailError)
    return { ok: false, message: 'Password reset is unavailable right now. Please try again later.' }
  }

  const limit = await checkLimits([
    { key: `pwreset:email:${keyPart(email.value)}`, limit: 5, windowSeconds: 60 * 60 },
    { key: `pwreset:ip:${clientFingerprint()}`, limit: 15, windowSeconds: 60 * 60 },
  ])
  if (!limit.allowed) {
    return { ok: false, message: retryMessage(limit.retryAfterSeconds, 'Too many reset codes sent') }
  }

  const user = await prisma.user.findUnique({
    where: { email: email.value },
    select: { id: true, email: true, name: true },
  })
  if (user) {
    const sent = await sendPasswordResetCode(user)
    if (!sent.ok && sent.reason !== 'cooldown') {
      return { ok: false, message: 'We could not send the email just now. Wait a moment, then try again.' }
    }
  }

  return {
    ok: true,
    message: `If ${email.value} has a Plug.pk account, we sent a 6-digit code to it. It expires in 10 minutes.`,
  }
}

export interface ResetResult {
  ok: boolean
  message?: string
  /** Where to go next, on success. */
  redirectTo?: string
  /** The code is spent (expired or too many tries): only a new one can work. */
  needsNewCode?: boolean
}

/**
 * Sets a new password with the emailed code, then signs this browser in.
 *
 * Every other session the account has open ends — a forgotten password is
 * often a password somebody else now knows. Entering the code also proves the
 * address, so an account that never confirmed its email is confirmed here.
 */
export async function resetPasswordWithCode(
  rawEmail: string,
  rawCode: string,
  newPassword: string,
): Promise<ResetResult> {
  const email = checkEmail(rawEmail)
  if (!email.ok) return { ok: false, message: email.message ?? 'Enter a valid email address.' }
  const code = String(rawCode ?? '').replace(/\s+/g, '')
  if (!/^\d{6}$/.test(code)) return { ok: false, message: 'Enter the 6-digit code from the email.' }
  const password = String(newPassword ?? '')
  if (password.length < 8) return { ok: false, message: 'Password must be at least 8 characters.' }
  if (password.length > 200) return { ok: false, message: 'Password must be 200 characters or fewer.' }

  const limit = await checkLimits([
    { key: `pwreset-code:email:${keyPart(email.value)}`, limit: 15, windowSeconds: 15 * 60 },
    { key: `pwreset-code:ip:${clientFingerprint()}`, limit: 50, windowSeconds: 15 * 60 },
  ])
  if (!limit.allowed) {
    return { ok: false, message: retryMessage(limit.retryAfterSeconds, 'Too many tries') }
  }

  const user = await prisma.user.findUnique({
    where: { email: email.value },
    select: { id: true, isAdmin: true },
  })
  // Same reply as a wrong code: this must not reveal whether the address is registered.
  if (!user) return { ok: false, message: 'That code is not right. Check the email and try again.' }

  const result = await checkPasswordResetCode(user.id, code)
  if (!result.ok) {
    switch (result.reason) {
      case 'wrong':
        return {
          ok: false,
          message: `That code is not right. ${result.attemptsLeft} ${result.attemptsLeft === 1 ? 'try' : 'tries'} left.`,
        }
      case 'expired':
        return { ok: false, needsNewCode: true, message: 'That code has expired. Send a new one.' }
      case 'too-many':
        return { ok: false, needsNewCode: true, message: 'Too many wrong tries. Send a new code.' }
      default:
        return { ok: false, needsNewCode: true, message: 'There is no active code for this email. Send a new one.' }
    }
  }

  const now = new Date()
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(password),
      mustChangePassword: false,
      sessionVersion: { increment: 1 },
    },
  })
  await prisma.user.updateMany({ where: { id: user.id, emailVerifiedAt: null }, data: { emailVerifiedAt: now } })

  if (!(await startSession(user.id))) {
    return { ok: true, message: 'Your password is changed. Please sign in.', redirectTo: '/login' }
  }

  revalidatePath('/dashboard')
  return { ok: true, redirectTo: user.isAdmin ? '/admin' : '/dashboard' }
}
