// src/lib/db/auth-actions.ts
'use server'

import { randomUUID } from 'node:crypto'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'

import { hashPassword } from '@/lib/passwords'
import { checkEmail, checkText } from '@/lib/validate'

import { prisma } from './client'
import {
  consumeVerificationToken,
  sendVerificationEmail,
  type VerifyResult,
} from './email-verification'
import { checkLimits, clientFingerprint, keyPart, retryMessage } from './rate-limit'

/**
 * Registration for EV owners, and email verification.
 *
 * The password is hashed with scrypt against a per-user random salt
 * (src/lib/passwords.ts) and the plaintext is never written anywhere.
 *
 * A new account starts unverified and is sent a one-time link
 * (email-verification.ts). It cannot sign in until that link is opened —
 * session-actions.ts enforces that at sign-in.
 */

export interface SignUpResult {
  ok: boolean
  message?: string
  /** On sign-up: whether the verification email actually went out. */
  verificationSent?: boolean
  /** On sign-up: the normalised address the link was sent to. */
  email?: string
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

  const limit = await checkLimits([
    { key: `signup:ip:${clientFingerprint()}`, limit: 5, windowSeconds: 60 * 60 },
  ])
  if (!limit.allowed) {
    return { ok: false, message: retryMessage(limit.retryAfterSeconds, 'Too many accounts created') }
  }

  let userId: string
  try {
    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: email.value,
        name: name.value,
        city: city.value || null,
        vehicle: vehicle.value || null,
        passwordHash: await hashPassword(password),
      },
    })
    userId = user.id
  } catch (error) {
    // The unique index on email is the real check, so two simultaneous sign-ups
    // with one address get this message rather than a crashed page.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { ok: false, message: 'An account already exists for that email. Try signing in.' }
    }
    throw error
  }

  /*
    Not signed in yet. The account is unverified until its owner opens the
    link sent to the address they typed — a well-formed address proves
    nothing about who owns it. Signing in is allowed once it is verified.
  */
  const { sent } = await sendVerificationEmail({ id: userId, email: email.value, name: name.value })

  revalidatePath('/')

  return { ok: true, verificationSent: sent, email: email.value }
}

/*
  ── Resending a link ───────────────────────────────────────────────────

  Always answers the same way, whether or not the address has an account or
  is already verified, so this cannot be used to discover who has signed up.
  Limited per address (a minute between sends, five an hour) and per IP.
*/
const RESEND_REPLY =
  'If that address has an account waiting to be verified, a new link is on its way. Check your inbox and spam folder.'

export async function resendVerificationEmail(rawEmail: string): Promise<SignUpResult> {
  const email = checkEmail(rawEmail)
  if (!email.ok) return email

  const limit = await checkLimits([
    { key: `verify:cooldown:${keyPart(email.value)}`, limit: 1, windowSeconds: 60 },
    { key: `verify:email:${keyPart(email.value)}`, limit: 5, windowSeconds: 60 * 60 },
    { key: `verify:ip:${clientFingerprint()}`, limit: 15, windowSeconds: 60 * 60 },
  ])
  if (!limit.allowed) {
    return { ok: false, message: retryMessage(limit.retryAfterSeconds, 'A link was sent very recently') }
  }

  const user = await prisma.user.findUnique({
    where: { email: email.value },
    select: { id: true, email: true, name: true, emailVerified: true },
  })
  if (user && !user.emailVerified) {
    await sendVerificationEmail(user)
  }

  return { ok: true, message: RESEND_REPLY }
}

/** Uses a verification link. Called by the button on /verify-email. */
export async function confirmEmail(token: string): Promise<{ result: VerifyResult }> {
  // Guessing tokens is hopeless (256 bits), but there is no reason to let a
  // script try millions; this caps attempts per IP.
  const limit = await checkLimits([
    { key: `verify:confirm:${clientFingerprint()}`, limit: 30, windowSeconds: 60 * 60 },
  ])
  if (!limit.allowed) return { result: 'invalid' }
  return { result: await consumeVerificationToken(token) }
}
