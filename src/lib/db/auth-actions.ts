// src/lib/db/auth-actions.ts
'use server'

import { randomUUID } from 'node:crypto'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'

import { hashPassword } from '@/lib/passwords'
import { checkEmail, checkText } from '@/lib/validate'

import { prisma } from './client'
import { checkLimits, clientFingerprint, retryMessage } from './rate-limit'
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
 * Not yet done: verifying that the address belongs to the person signing up.
 * That needs an email provider. Until one is connected, a listing submitted
 * under an account is checked by an operator before it goes live.
 */

export interface SignUpResult {
  ok: boolean
  message?: string
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

  // Signed in immediately, so the vehicle onboarding that follows saves to it.
  if (!(await startSession(userId))) {
    return {
      ok: false,
      message: 'Your account was created, but signing you in failed. Please sign in.',
    }
  }

  revalidatePath('/')
  revalidatePath('/dashboard')

  return { ok: true }
}
