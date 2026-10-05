// src/lib/passwords.ts
import 'server-only'

import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

/**
 * Password hashing.
 *
 * Lives outside every 'use server' file on purpose. An export from one of those
 * is a public POST endpoint, so these used to be callable from any browser —
 * not a leak, but a free way to make the server burn scrypt CPU on demand.
 *
 * scrypt against a per-user random salt; the plaintext is never stored.
 */

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>

const KEY_LENGTH = 64

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derived = await scryptAsync(password, salt, KEY_LENGTH)
  return `${salt}:${derived.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, key] = stored.split(':')
  if (!salt || !key) return false

  const derived = await scryptAsync(password, salt, KEY_LENGTH)
  const expected = Buffer.from(key, 'hex')
  if (expected.length !== derived.length) return false
  return timingSafeEqual(derived, expected)
}
