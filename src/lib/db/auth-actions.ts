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
import { redeemVerificationToken, sendVerificationEmail } from './email-verification'
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
 * A new account is not signed in. It gets an emailed link, and only opening
 * that link (confirmEmail) verifies the address and starts a session — so
 * nobody can hold an account under an address they do not control.
 */

export interface SignUpResult {
  ok: boolean
  message?: string
  /** Set on success: the address the confirmation link was sent to. */
  verifyEmail?: string
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

  // Checked before the row is written: an account whose link can never be sent
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

  // A failed send still leaves a usable account: the "check your email" step
  // offers a resend, and signing in offers one too.
  if (!(await sendVerificationEmail(user, redirectTo))) {
    console.error('[auth] verification email failed for', user.id)
  }

  revalidatePath('/')
  return { ok: true, verifyEmail: user.email }
}

export interface ResendResult {
  ok: boolean
  message: string
}

/**
 * Sends a new confirmation link.
 *
 * The answer is the same whether or not an unverified account holds the
 * address, so this cannot be used to discover who has signed up.
 */
export async function resendVerification(rawEmail: string): Promise<ResendResult> {
  const email = checkEmail(rawEmail)
  if (!email.ok) return { ok: false, message: email.message ?? 'Enter a valid email address.' }

  const limit = await checkLimits([
    { key: `verify-resend:email:${keyPart(email.value)}`, limit: 3, windowSeconds: 60 * 60 },
    { key: `verify-resend:ip:${clientFingerprint()}`, limit: 10, windowSeconds: 60 * 60 },
  ])
  if (!limit.allowed) {
    return { ok: false, message: retryMessage(limit.retryAfterSeconds, 'Too many emails sent') }
  }

  const user = await prisma.user.findUnique({
    where: { email: email.value },
    select: { id: true, email: true, name: true, emailVerifiedAt: true },
  })
  if (user && !user.emailVerifiedAt) {
    // Keep the destination the original sign-up asked for.
    const previous = await prisma.emailToken.findFirst({
      where: { userId: user.id, purpose: 'verify' },
      orderBy: { createdAt: 'desc' },
      select: { redirectTo: true },
    })
    await sendVerificationEmail(user, previous?.redirectTo ?? null)
  }

  return {
    ok: true,
    message: `If ${email.value} has an account waiting for confirmation, a new link is on its way.`,
  }
}

export interface ConfirmResult {
  ok: boolean
  message?: string
  redirectTo?: string
}

/**
 * Redeems the emailed link: verifies the address and signs the account in.
 *
 * A POST from the confirm page's button rather than a GET on the link itself.
 * Mail scanners open links to check them; a GET that redeemed the token would
 * let a scanner use it up before the person ever clicked.
 */
export async function confirmEmail(token: string): Promise<ConfirmResult> {
  const redeemed = await redeemVerificationToken(String(token ?? ''))
  if (!redeemed) {
    return {
      ok: false,
      message: 'This link has expired or was already used. Sign in to get a new one.',
    }
  }

  if (!(await startSession(redeemed.userId))) {
    return { ok: false, message: 'Your email is confirmed. Please sign in.', redirectTo: '/login' }
  }

  revalidatePath('/')
  revalidatePath('/dashboard')
  return { ok: true, redirectTo: redeemed.redirectTo ?? '/onboarding/vehicle' }
}
