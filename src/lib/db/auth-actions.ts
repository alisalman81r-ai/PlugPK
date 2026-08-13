// src/lib/db/auth-actions.ts
'use server'

import { randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

import { revalidatePath } from 'next/cache'

import { prisma } from './client'

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

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derived = await scryptAsync(password, salt, KEY_LENGTH)
  return `${salt}:${derived.toString('hex')}`
}

/** Exported for a future sign-in flow; unused until sessions exist. */
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

  await prisma.user.create({
    data: {
      id: randomUUID(),
      email,
      name,
      city: String(form.get('city') ?? '').trim() || null,
      vehicle: String(form.get('vehicle') ?? '').trim() || null,
      passwordHash: await hashPassword(password),
    },
  })

  // The homepage counter reads this table, so it has to be told to re-render.
  revalidatePath('/')

  return { ok: true }
}
