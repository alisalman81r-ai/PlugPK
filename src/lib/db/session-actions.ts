// src/lib/db/session-actions.ts
'use server'

import { randomUUID } from 'node:crypto'

import { revalidatePath } from 'next/cache'

import { verifyPassword } from '@/lib/passwords'
import {
  appOrigin,
  authErrorCode,
  authErrorMessage,
  getSupabaseAuthConfigError,
  supabaseAdmin,
  supabasePublic,
} from '@/lib/supabase-auth'
import { getUserAuthConfigError } from '@/lib/user-auth'

import { linkAuthUser } from './auth-link'
import { prisma } from './client'
import { checkLimits, clientFingerprint, keyPart, retryMessage } from './rate-limit'
import { clearSession, getSessionUserId, revokeSessions, startSession } from './session'

/*
  Every export below is a public POST endpoint — that is what 'use server'
  means. Nothing here takes a user id from the caller: identity always comes
  from the verified session cookie (session.ts).
*/

export interface SessionResult {
  ok: boolean
  message?: string
  /**
   * Where the caller should send them next. The server decides, because
   * whether an account may use the operator portal is a fact about its row.
   */
  redirectTo?: string
  /** The password was right but the email is not confirmed yet. */
  unverified?: boolean
}

export interface CurrentUser {
  id: string
  name: string
  email: string
}

/** Sign-in attempts allowed per window, per email and per IP. */
function signInLimits(email: string) {
  return [
    { key: `signin:email:${keyPart(email)}`, limit: 8, windowSeconds: 15 * 60 },
    { key: `signin:ip:${clientFingerprint()}`, limit: 30, windowSeconds: 15 * 60 },
  ]
}

const WRONG = { ok: false as const, message: 'Email or password is incorrect.' }
const UNAVAILABLE = { ok: false as const, message: 'Signing in is unavailable right now. Please try again later.' }
// Said only after the password matched, so neither reveals anything to a guesser.
const UNCONFIRMED: SessionResult = {
  ok: false,
  unverified: true,
  message: 'Confirm your email first: open the link we sent when you signed up.',
}
const MOVED: SessionResult = {
  ok: false,
  unverified: true,
  message: 'We have upgraded sign-in. To keep your account safe, confirm your email: we just sent you a link.',
}

/**
 * An account from before Supabase, signing in with its correct old password.
 *
 * That password is in hand right now and at no other time, so this is the one
 * moment the account can move to Supabase without the member choosing a new
 * one. Supabase then emails a confirmation link, and the account stays locked
 * until it is opened — every existing member confirms, like every new one.
 *
 * Returns null when Supabase already has a user for the address (made from
 * another environment sharing the project); the caller then signs in through
 * Supabase as normal.
 */
async function moveLegacyAccount(user: { id: string; email: string; name: string }, password: string) {
  const { data, error } = await supabasePublic().auth.signUp({
    email: user.email,
    password,
    options: { emailRedirectTo: `${appOrigin()}/verify-email`, data: { name: user.name } },
  })
  const code = authErrorCode(error)
  if (code === 'user_already_exists' || code === 'email_exists') return null
  if (!error && data.user && data.user.identities?.length === 0) return null
  if (error || !data.user) {
    console.error('[auth] could not move account to Supabase:', code, error?.message)
    return {
      ok: false,
      message: authErrorMessage(error) ?? 'We could not finish signing you in. Use "Forgot password?" to set a new one.',
    }
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { authUserId: data.user.id, passwordHash: null, emailVerifiedAt: null },
  })
  return MOVED
}

/**
 * Signs someone in and issues the session cookie.
 *
 * Supabase checks the password; the website then issues its own session for
 * the linked account, and only if the email is confirmed. The failure message
 * is identical whether the email is unknown or the password is wrong, so this
 * cannot be used to test which addresses hold accounts. Attempts are rate
 * limited per email and per IP before anything is checked.
 */
export async function signIn(form: FormData): Promise<SessionResult> {
  const email = String(form.get('email') ?? '').trim().toLowerCase()
  const password = String(form.get('password') ?? '')

  if (!email || !password) {
    return { ok: false, message: 'Enter your email and password.' }
  }
  if (email.length > 254 || password.length > 200) {
    return { ok: false, message: 'Email or password is incorrect.' }
  }

  const configError = getSupabaseAuthConfigError()
  if (configError) {
    console.error('[auth] sign-in refused:', configError)
    return UNAVAILABLE
  }

  const limit = await checkLimits(signInLimits(email))
  if (!limit.allowed) {
    return { ok: false, message: retryMessage(limit.retryAfterSeconds, 'Too many sign-in attempts') }
  }

  const legacy = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, authUserId: true, passwordHash: true },
  })
  if (legacy && !legacy.authUserId) {
    if (!legacy.passwordHash || !(await verifyPassword(password, legacy.passwordHash))) return WRONG
    const moved = await moveLegacyAccount(legacy, password)
    if (moved) return moved
  }

  const { data, error } = await supabasePublic().auth.signInWithPassword({ email, password })
  if (error || !data.user) {
    const code = authErrorCode(error)
    if (code === 'invalid_credentials') return WRONG
    if (code === 'email_not_confirmed') return UNCONFIRMED
    const message = authErrorMessage(error)
    if (message) return { ok: false, message }
    console.error('[auth] Supabase sign-in failed:', code, error?.message)
    return UNAVAILABLE
  }

  const account = await linkAuthUser(data.user, { confirmed: !!data.user.email_confirmed_at })
  if (!account) return WRONG
  const user = await prisma.user.findUnique({
    where: { id: account.id },
    select: { id: true, emailVerifiedAt: true, mustChangePassword: true, isAdmin: true },
  })
  if (!user) return WRONG
  if (!user.emailVerifiedAt) return UNCONFIRMED

  if (!(await startSession(user.id))) {
    console.error('[auth] could not start a session:', getUserAuthConfigError())
    return { ok: false, message: 'Signing in is unavailable right now. Please try again later.' }
  }

  revalidatePath('/business/dashboard')

  // A temporary password from an operator has to be replaced before anything else.
  if (user.mustChangePassword) {
    return { ok: true, redirectTo: '/dashboard/settings?changePassword=1' }
  }
  if (user.isAdmin) return { ok: true, redirectTo: '/admin' }
  return { ok: true }
}

/** Ends this browser's session. */
export async function signOut(): Promise<SessionResult> {
  clearSession()
  return { ok: true }
}

/** Ends every session the account has open, on every device. */
export async function signOutEverywhere(): Promise<SessionResult> {
  const userId = await getSessionUserId()
  if (!userId) return { ok: false, message: 'You are already signed out.' }
  await revokeSessions(userId)
  clearSession()
  return { ok: true }
}

/**
 * The signed-in user, or null. The row is re-read every time, so a deleted
 * account stops working immediately.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const userId = await getSessionUserId()
  if (!userId) return null

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  })

  return user ?? null
}

/** The signed-in user's own details, for their dashboard. */
export interface CurrentProfile {
  id: string
  name: string
  email: string
  city: string | null
  vehicle: string | null
  avatar: string | null
  /**
   * A display hint so the header can point an operator at the portal.
   * admin-access.ts is what authorises anything.
   */
  isAdmin: boolean
  /** True after an operator issued a temporary password. */
  mustChangePassword: boolean
  createdAt: string
}

/** Whether the signed-in account may use the operator portal. */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const userId = await getSessionUserId()
  if (!userId) return false

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  })

  return user?.isAdmin === true
}

/** Whether a current user session exists at all. */
export async function hasUserSession(): Promise<boolean> {
  return (await getSessionUserId()) !== null
}

export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const userId = await getSessionUserId()
  if (!userId) return null

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      isAdmin: true,
      mustChangePassword: true,
      city: true,
      vehicle: true,
      avatar: true,
      createdAt: true,
    },
  })
  if (!user) return null

  return { ...user, createdAt: user.createdAt.toISOString() }
}

/** Saves the vehicle chosen during onboarding. */
export async function saveMyVehicle(vehicle: string): Promise<SessionResult> {
  const userId = await getSessionUserId()
  if (!userId) return { ok: false, message: 'Sign in to save your vehicle.' }

  const value = String(vehicle ?? '').trim()
  if (value.length > 120) return { ok: false, message: 'That vehicle name is too long.' }

  await prisma.user.update({
    where: { id: userId },
    data: { vehicle: value || null },
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/vehicles')
  revalidatePath('/dashboard/settings')
  return { ok: true }
}

/** Updates the name and city on the signed-in account. */
export async function updateMyProfile(form: FormData): Promise<SessionResult> {
  const userId = await getSessionUserId()
  if (!userId) return { ok: false, message: 'Sign in to edit your profile.' }

  const name = String(form.get('name') ?? '').trim()
  const city = String(form.get('city') ?? '').trim()
  if (!name) return { ok: false, message: 'Enter your name.' }
  if (name.length > 80) return { ok: false, message: 'Name must be 80 characters or fewer.' }
  if (city.length > 80) return { ok: false, message: 'City must be 80 characters or fewer.' }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      city: city || null,
      // The vehicle follows the primary car in the garage (garage-actions.ts).
      // The email is deliberately not editable: it is the sign-in identifier.
    },
  })

  revalidatePath('/dashboard')
  return { ok: true }
}

/**
 * Changes the password.
 *
 * The current one is required even though the session proves who this is, so
 * a borrowed, unlocked browser cannot lock the real owner out. Every other
 * session the account has open is ended; this browser gets a fresh cookie.
 */
export async function changeMyPassword(
  currentPassword: string,
  newPassword: string,
): Promise<SessionResult> {
  const userId = await getSessionUserId()
  if (!userId) return { ok: false, message: 'Sign in to change your password.' }

  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return { ok: false, message: 'New password must be at least 8 characters.' }
  }
  if (newPassword.length > 200) {
    return { ok: false, message: 'New password must be 200 characters or fewer.' }
  }

  const limit = await checkLimits([
    { key: `pwchange:user:${userId}`, limit: 10, windowSeconds: 60 * 60 },
  ])
  if (!limit.allowed) return { ok: false, message: retryMessage(limit.retryAfterSeconds) }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, authUserId: true } })
  if (!user) return { ok: false, message: 'That account no longer exists.' }
  // A signed-in account is always confirmed, and confirming links it to Supabase.
  if (!user.authUserId) return { ok: false, message: 'Sign out and sign in again, then retry.' }

  // Supabase checks the current password: it is the only place that holds it.
  const current = String(currentPassword ?? '')
  const check = current
    ? await supabasePublic().auth.signInWithPassword({ email: user.email, password: current })
    : null
  if (!check || check.error || check.data.user?.id !== user.authUserId) {
    return { ok: false, message: 'Your current password is not correct.' }
  }
  if (newPassword === current) {
    return { ok: false, message: 'Choose a password different from your current one.' }
  }

  const { error } = await supabaseAdmin().auth.admin.updateUserById(user.authUserId, { password: newPassword })
  if (error) {
    const message = authErrorMessage(error)
    if (message) return { ok: false, message }
    console.error('[auth] could not change password:', authErrorCode(error), error.message)
    return { ok: false, message: 'Could not change your password. Please try again.' }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { mustChangePassword: false, sessionVersion: { increment: 1 } },
  })
  await startSession(userId)

  revalidatePath('/dashboard/settings')
  return { ok: true }
}

// ─── Saved listings ─────────────────────────────────────

/**
 * Adds or removes a bookmark, returning whether it is now saved.
 *
 * deleteMany, then createMany with skipDuplicates, rather than read-then-write,
 * so a double click can neither crash on the unique constraint nor leave two
 * rows.
 */
export async function toggleSavedStation(
  listingId: string,
): Promise<{ ok: boolean; saved: boolean; message?: string }> {
  const userId = await getSessionUserId()
  if (!userId) return { ok: false, saved: false, message: 'Sign in to save a listing.' }
  if (typeof listingId !== 'string' || !listingId || listingId.length > 100) {
    return { ok: false, saved: false, message: 'That listing could not be found.' }
  }

  const removed = await prisma.savedStation.deleteMany({ where: { userId, listingId } })
  if (removed.count > 0) {
    revalidatePath('/dashboard/saved')
    return { ok: true, saved: false }
  }

  const count = await prisma.savedStation.count({ where: { userId } })
  if (count >= 200) {
    return { ok: false, saved: false, message: 'You can save up to 200 listings.' }
  }

  await prisma.savedStation.createMany({
    data: [{ id: randomUUID(), userId, listingId }],
    skipDuplicates: true,
  })
  revalidatePath('/dashboard/saved')
  return { ok: true, saved: true }
}

/**
 * Whether anyone is signed in, and which listings they have saved — in one
 * call, so every Save button on a page can share it.
 */
export async function getMySavedStationIds(): Promise<{ signedIn: boolean; ids: string[] }> {
  const userId = await getSessionUserId()
  if (!userId) return { signedIn: false, ids: [] }
  const rows = await prisma.savedStation.findMany({ where: { userId }, select: { listingId: true } })
  return { signedIn: true, ids: rows.map((row) => row.listingId) }
}

/** Whether the signed-in visitor has this listing saved. False when signed out. */
export async function isStationSaved(listingId: string): Promise<boolean> {
  const userId = await getSessionUserId()
  if (!userId) return false

  const row = await prisma.savedStation.findUnique({
    where: { userId_listingId: { userId, listingId } },
  })
  return row !== null
}
