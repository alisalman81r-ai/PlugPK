// src/lib/passwords.ts
import 'server-only'

import { scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

/**
 * Checking the legacy scrypt hashes, from before Supabase Auth held passwords.
 *
 * Nothing new is ever hashed here. An account that has not signed in since
 * the move still has one of these on its User row; signIn checks it once,
 * hands the password to Supabase, and clears the hash.
 *
 * Lives outside every 'use server' file on purpose. An export from one of those
 * is a public POST endpoint — a free way to make the server burn scrypt CPU.
 */

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>

const KEY_LENGTH = 64

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, key] = stored.split(':')
  if (!salt || !key) return false

  const derived = await scryptAsync(password, salt, KEY_LENGTH)
  const expected = Buffer.from(key, 'hex')
  if (expected.length !== derived.length) return false
  return timingSafeEqual(derived, expected)
}
