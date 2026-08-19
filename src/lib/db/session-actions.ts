// src/lib/db/session-actions.ts
'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

import {
  USER_COOKIE_NAME,
  USER_SESSION_MAX_AGE,
  createUserSessionValue,
  readUserSession,
} from '@/lib/user-auth'

import { verifyPassword } from './auth-actions'
import { prisma } from './client'

export interface SessionResult {
  ok: boolean
  message?: string
}

export interface CurrentUser {
  id: string
  name: string
  email: string
}

/**
 * Signs someone in and issues the session cookie.
 *
 * The failure message is identical whether the email is unknown or the
 * password is wrong. Distinguishing them would turn this into a way to test
 * which addresses hold accounts.
 */
export async function signIn(form: FormData): Promise<SessionResult> {
  const email = String(form.get('email') ?? '').trim().toLowerCase()
  const password = String(form.get('password') ?? '')

  if (!email || !password) {
    return { ok: false, message: 'Enter your email and password.' }
  }

  const user = await prisma.user.findUnique({ where: { email } })
  const WRONG = { ok: false as const, message: 'Email or password is incorrect.' }

  if (!user) return WRONG
  if (!(await verifyPassword(password, user.passwordHash))) return WRONG

  const value = createUserSessionValue(user.id)
  if (!value) {
    return { ok: false, message: 'Sessions are not configured on this server.' }
  }

  cookies().set(USER_COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: USER_SESSION_MAX_AGE,
  })

  revalidatePath('/business/dashboard')
  return { ok: true }
}

export async function signOut(): Promise<SessionResult> {
  cookies().delete(USER_COOKIE_NAME)
  revalidatePath('/')
  return { ok: true }
}

/**
 * Establishes the session directly, used right after registration so someone
 * is not asked to type the password they just chose.
 */
export async function startSession(userId: string): Promise<void> {
  const value = createUserSessionValue(userId)
  if (!value) return

  cookies().set(USER_COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: USER_SESSION_MAX_AGE,
  })
}

/**
 * The signed-in user, or null.
 *
 * The row is re-read every time rather than trusted from the cookie, so a
 * deleted account stops working immediately instead of holding a valid
 * signature until it expires.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const userId = readUserSession(cookies().get(USER_COOKIE_NAME)?.value)
  if (!userId) return null

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  })

  return user ?? null
}
