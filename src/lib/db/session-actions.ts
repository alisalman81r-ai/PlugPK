// src/lib/db/session-actions.ts
'use server'

import { randomUUID } from 'node:crypto'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

import {
  USER_COOKIE_NAME,
  USER_SESSION_MAX_AGE,
  createUserSessionValue,
  readUserSession,
} from '@/lib/user-auth'

import { hashPassword, verifyPassword } from './auth-actions'
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

/**
 * The signed-in user's own details, for their dashboard.
 *
 * Wider than getCurrentUser, which returns only what a header needs. Kept
 * separate so a page that just wants a name does not pull the whole row.
 */
export interface CurrentProfile {
  id: string
  name: string
  email: string
  city: string | null
  vehicle: string | null
  createdAt: string
}

export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const userId = readUserSession(cookies().get(USER_COOKIE_NAME)?.value)
  if (!userId) return null

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, city: true, vehicle: true, createdAt: true },
  })
  if (!user) return null

  return { ...user, createdAt: user.createdAt.toISOString() }
}

/**
 * Saves the vehicle chosen during onboarding.
 *
 * That step used to await a one second timer and move on, so the car somebody
 * picked immediately after signing up was discarded — and their dashboard then
 * showed a fixture's vehicle instead, which reads as the sign-up not having
 * saved anything.
 */
export async function saveMyVehicle(vehicle: string): Promise<SessionResult> {
  const userId = readUserSession(cookies().get(USER_COOKIE_NAME)?.value)
  if (!userId) return { ok: false, message: 'Sign in to save your vehicle.' }

  await prisma.user.update({
    where: { id: userId },
    data: { vehicle: vehicle.trim() || null },
  })

  revalidatePath('/dashboard')
  return { ok: true }
}

/** Updates the name, city and vehicle on the signed-in account. */
export async function updateMyProfile(form: FormData): Promise<SessionResult> {
  const userId = readUserSession(cookies().get(USER_COOKIE_NAME)?.value)
  if (!userId) return { ok: false, message: 'Sign in to edit your profile.' }

  const name = String(form.get('name') ?? '').trim()
  if (!name) return { ok: false, message: 'Enter your name.' }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      city: String(form.get('city') ?? '').trim() || null,
      vehicle: String(form.get('vehicle') ?? '').trim() || null,
      // The email is deliberately not editable: it is the identifier the
      // account signs in with and the link to any business listing.
    },
  })

  revalidatePath('/dashboard')
  return { ok: true }
}

/**
 * Changes the password.
 *
 * The current one is required even though the session already proves who this
 * is — it means a borrowed, unlocked browser cannot be used to lock the real
 * owner out of their own account.
 */
export async function changeMyPassword(
  currentPassword: string,
  newPassword: string,
): Promise<SessionResult> {
  const userId = readUserSession(cookies().get(USER_COOKIE_NAME)?.value)
  if (!userId) return { ok: false, message: 'Sign in to change your password.' }

  if (newPassword.length < 8) {
    return { ok: false, message: 'New password must be at least 8 characters.' }
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { ok: false, message: 'That account no longer exists.' }

  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    return { ok: false, message: 'Your current password is not correct.' }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(newPassword) },
  })

  return { ok: true }
}

// ─── Saved listings ─────────────────────────────────────

/**
 * Adds or removes a bookmark, returning whether it is now saved.
 *
 * A toggle rather than separate save/unsave calls because the button is a
 * toggle: sending "save" twice from a double click should leave one row, and
 * the unique constraint on (userId, listingId) makes that true at the database
 * level too.
 */
export async function toggleSavedStation(
  listingId: string,
): Promise<{ ok: boolean; saved: boolean; message?: string }> {
  const userId = readUserSession(cookies().get(USER_COOKIE_NAME)?.value)
  if (!userId) return { ok: false, saved: false, message: 'Sign in to save a listing.' }

  const existing = await prisma.savedStation.findUnique({
    where: { userId_listingId: { userId, listingId } },
  })

  if (existing) {
    await prisma.savedStation.delete({ where: { id: existing.id } })
    revalidatePath('/dashboard/saved')
    return { ok: true, saved: false }
  }

  await prisma.savedStation.create({
    data: { id: randomUUID(), userId, listingId },
  })
  revalidatePath('/dashboard/saved')
  return { ok: true, saved: true }
}

/** Whether the signed-in visitor has this listing saved. False when signed out. */
export async function isStationSaved(listingId: string): Promise<boolean> {
  const userId = readUserSession(cookies().get(USER_COOKIE_NAME)?.value)
  if (!userId) return false

  const row = await prisma.savedStation.findUnique({
    where: { userId_listingId: { userId, listingId } },
  })
  return row !== null
}
