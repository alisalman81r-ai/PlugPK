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
 * registerOwnerAccount was removed.
 *
 * It took a name, email and password and returned a user id — but when the
 * email already had an account it returned that account's id straight away,
 * without checking the password. The business sign-up form then started a
 * session with the id it got back, so submitting that form with somebody
 * else's registered address signed the submitter in as them.
 *
 * Nothing replaces it. Listing a business now requires being signed in
 * already, so there is no path that needs to turn an email and password into
 * an account as a side effect of doing something else.
 */

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
