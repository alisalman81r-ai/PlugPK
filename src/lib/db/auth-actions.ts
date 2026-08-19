// src/lib/db/auth-actions.ts
'use server'

import { randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

import { revalidatePath } from 'next/cache'

import { prisma } from './client'
import { startSession } from './session-actions'

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>

/**
 * Registration for EV owners.
 *
 * This is what makes the "EV owners" figure on the homepage count something
 * real — before this, sign-up was a two second timer that created nothing, so
 * the number could only ever be a constant somebody typed.
 *
 * It is registration, not a full auth system: no sessions, no roles, no
 * password reset. What it does get right is storage. The password is hashed
 * with scrypt against a per-user random salt and the plaintext is never
 * written anywhere, so a copy of this database does not hand over anyone's
 * credentials.
 */

const KEY_LENGTH = 64

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derived = await scryptAsync(password, salt, KEY_LENGTH)
  return `${salt}:${derived.toString('hex')}`
}

/**
 * Creates the account behind a business listing.
 *
 * Split out from registerUser because that one takes a FormData from the
 * sign-up page and returns only ok/message, whereas the business flow needs
 * the id back so the listing can be linked to it. An address that already has
 * an account is not an error here — the same person listing a second venue
 * should not be forced to invent a new email — so the existing id is returned
 * and the password is left alone.
 */
export async function registerOwnerAccount(
  name: string,
  email: string,
  password: string,
): Promise<{ ok: boolean; userId?: string; message?: string }> {
  const normalised = email.trim().toLowerCase()

  const existing = await prisma.user.findUnique({ where: { email: normalised } })
  if (existing) return { ok: true, userId: existing.id }

  if (password.length < 8) {
    return { ok: false, message: 'Password must be at least 8 characters.' }
  }

  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      email: normalised,
      name: name.trim(),
      city: null,
      vehicle: null,
      passwordHash: await hashPassword(password),
    },
  })

  // The homepage owner counter reads this table.
  revalidatePath('/')
  return { ok: true, userId: user.id }
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, key] = stored.split(':')
  if (!salt || !key) return false

  const derived = await scryptAsync(password, salt, KEY_LENGTH)
  const expected = Buffer.from(key, 'hex')
  if (expected.length !== derived.length) return false
  return timingSafeEqual(derived, expected)
}

export interface SignUpResult {
  ok: boolean
  message?: string
}

export async function registerUser(form: FormData): Promise<SignUpResult> {
  const name = String(form.get('name') ?? '').trim()
  const email = String(form.get('email') ?? '')
    .trim()
    .toLowerCase()
  const password = String(form.get('password') ?? '')

  if (!name) return { ok: false, message: 'Enter your name.' }
  if (!email.includes('@')) return { ok: false, message: 'Enter a valid email address.' }
  if (password.length < 8) {
    return { ok: false, message: 'Password must be at least 8 characters.' }
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { ok: false, message: 'An account already exists for that email.' }
  }

  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      email,
      name,
      city: String(form.get('city') ?? '').trim() || null,
      vehicle: String(form.get('vehicle') ?? '').trim() || null,
      passwordHash: await hashPassword(password),
    },
  })

  // Signed in immediately, the same as the business form already did.
  // Without this the account was created correctly and then left signed out:
  // you would finish signing up, land on vehicle onboarding as an anonymous
  // visitor, and see a stranger's dashboard — which reads exactly like the
  // sign-up not having saved anything.
  await startSession(user.id)

  // The homepage counter reads this table, so it has to be told to re-render.
  revalidatePath('/')
  revalidatePath('/dashboard')

  return { ok: true }
}
