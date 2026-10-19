// src/lib/db/auth-actions.ts
'use server'

import { randomBytes, randomUUID } from 'node:crypto'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'

import { safeRedirect } from '@/lib/safe-redirect'
import {
  appOrigin,
  authErrorCode,
  authErrorMessage,
  getSupabaseAuthConfigError,
  supabaseAdmin,
  supabasePublic,
} from '@/lib/supabase-auth'
import { checkEmail, checkText } from '@/lib/validate'

import { linkAuthUser } from './auth-link'
import { prisma } from './client'
import { checkLimits, clientFingerprint, keyPart, retryMessage } from './rate-limit'
import { startSession } from './session'

/**
 * Registration, email confirmation and password reset, through Supabase Auth.
 *
 * Supabase stores the password and sends the emails; this file keeps the
 * website's User row in step and decides when a session may start. A new
 * account is never signed in: only confirming the emailed link
 * (confirmEmail) marks the address verified and starts a session, so nobody
 * can hold an account under an address they do not control.
 *
 * The links in Supabase's emails come back to /verify-email and
 * /reset-password with a token_hash (see the email templates in .env.example).
 * Both pages redeem it on a button press, never on load, because mail
 * scanners open links to check them.
 */

export interface SignUpResult {
  ok: boolean
  message?: string
  /** Set on success: the address the confirmation link was sent to. */
  verifyEmail?: string
}

const UNAVAILABLE = 'Signing in is unavailable right now. Please try again later.'
const EXISTS = 'An account already exists for that email. Try signing in.'

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

  const configError = getSupabaseAuthConfigError()
  if (configError) {
    console.error('[auth] sign-up refused:', configError)
    return { ok: false, message: 'Creating accounts is unavailable right now. Please try again later.' }
  }

  const limit = await checkLimits([
    { key: `signup:ip:${clientFingerprint()}`, limit: 5, windowSeconds: 60 * 60 },
  ])
  if (!limit.allowed) {
    return { ok: false, message: retryMessage(limit.retryAfterSeconds, 'Too many accounts created') }
  }

  // An account from before Supabase signs in to move across; it never signs up again.
  if (await prisma.user.findUnique({ where: { email: email.value }, select: { id: true } })) {
    return { ok: false, message: EXISTS }
  }

  const { data, error } = await supabasePublic().auth.signUp({
    email: email.value,
    password,
    options: { emailRedirectTo: `${appOrigin()}/verify-email`, data: { name: name.value } },
  })
  if (error) {
    const code = authErrorCode(error)
    if (code === 'user_already_exists' || code === 'email_exists') return { ok: false, message: EXISTS }
    const message = authErrorMessage(error)
    if (message) return { ok: false, message }
    console.error('[auth] Supabase sign-up failed:', code, error.message)
    return { ok: false, message: 'Could not create your account. Please try again.' }
  }
  // Supabase answers a sign-up for an already-confirmed address with a user
  // that has no identities, rather than an error, so addresses cannot be probed.
  if (!data.user || (data.user.identities && data.user.identities.length === 0)) {
    return { ok: false, message: EXISTS }
  }

  const raw = form.get('redirect')
  const pendingRedirect = typeof raw === 'string' && raw ? safeRedirect(raw, '') || null : null

  try {
    await prisma.user.create({
      data: {
        id: randomUUID(),
        email: email.value,
        name: name.value,
        city: city.value || null,
        vehicle: vehicle.value || null,
        authUserId: data.user.id,
        passwordHash: null,
        pendingRedirect,
      },
    })
  } catch (error) {
    // Two simultaneous sign-ups with one address: the unique index decides.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { ok: false, message: EXISTS }
    }
    throw error
  }

  revalidatePath('/')
  return { ok: true, verifyEmail: email.value }
}

export interface ResendResult {
  ok: boolean
  message: string
}

/**
 * Sends a new confirmation link. The answer is the same whether or not an
 * unconfirmed account holds the address, so nobody can probe who signed up.
 */
export async function resendVerification(rawEmail: string): Promise<ResendResult> {
  const email = checkEmail(rawEmail)
  if (!email.ok) return { ok: false, message: email.message ?? 'Enter a valid email address.' }

  const limit = await checkLimits([
    { key: `verify-resend:email:${keyPart(email.value)}`, limit: 3, windowSeconds: 60 * 60 },
    { key: `verify-resend:ip:${clientFingerprint()}`, limit: 10, windowSeconds: 60 * 60 },
  ])
  if (!limit.allowed) {
    return { ok: false, message: retryMessage(limit.retryAfterSeconds, 'Too many emails sent') }
  }

  const { error } = await supabasePublic().auth.resend({
    type: 'signup',
    email: email.value,
    options: { emailRedirectTo: `${appOrigin()}/verify-email` },
  })
  if (error) {
    const code = authErrorCode(error)
    if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit') {
      return { ok: false, message: authErrorMessage(error)! }
    }
    // Anything else (no such account, already confirmed) gets the same reply.
    console.info('[auth] resend not sent:', code, error.message)
  }

  return {
    ok: true,
    message: `If ${email.value} has an account waiting for confirmation, a new link is on its way.`,
  }
}

export interface ConfirmResult {
  ok: boolean
  message?: string
  redirectTo?: string
}

/** Redeems the emailed confirmation link and signs the account in. */
export async function confirmEmail(tokenHash: string, type: string): Promise<ConfirmResult> {
  const hash = String(tokenHash ?? '')
  const otpType = type === 'email' ? 'email' : 'signup'
  if (!hash || hash.length > 200) return { ok: false, message: EXPIRED_LINK }

  const { data, error } = await supabasePublic().auth.verifyOtp({ token_hash: hash, type: otpType })
  if (error || !data.user) {
    console.info('[auth] confirmation link refused:', authErrorCode(error), error?.message)
    return { ok: false, message: EXPIRED_LINK }
  }

  const account = await linkAuthUser(data.user, { confirmed: true })
  if (!account) {
    return { ok: false, message: 'This email is linked to a different account. Please contact us.' }
  }
  await prisma.user.update({ where: { id: account.id }, data: { pendingRedirect: null } })

  if (!(await startSession(account.id))) {
    return { ok: false, message: 'Your email is confirmed. Please sign in.', redirectTo: '/login' }
  }

  revalidatePath('/')
  revalidatePath('/dashboard')
  return { ok: true, redirectTo: account.pendingRedirect ?? '/onboarding/vehicle' }
}

const EXPIRED_LINK = 'This link has expired or was already used. Sign in to get a new one.'

// ─── Password reset ─────────────────────────────────────

/**
 * Emails a password-reset link. Same answer whether or not the address has an
 * account.
 *
 * An account from before Supabase has no Supabase user to reset, so one is
 * made first with a random password nobody knows; the reset link then sets
 * the real one, and redeeming it confirms the address too.
 */
export async function requestPasswordReset(rawEmail: string): Promise<ResendResult> {
  const email = checkEmail(rawEmail)
  if (!email.ok) return { ok: false, message: email.message ?? 'Enter a valid email address.' }

  const configError = getSupabaseAuthConfigError()
  if (configError) {
    console.error('[auth] reset refused:', configError)
    return { ok: false, message: UNAVAILABLE }
  }

  const limit = await checkLimits([
    { key: `pwreset:email:${keyPart(email.value)}`, limit: 3, windowSeconds: 60 * 60 },
    { key: `pwreset:ip:${clientFingerprint()}`, limit: 10, windowSeconds: 60 * 60 },
  ])
  if (!limit.allowed) {
    return { ok: false, message: retryMessage(limit.retryAfterSeconds, 'Too many reset emails sent') }
  }

  const user = await prisma.user.findUnique({
    where: { email: email.value },
    select: { id: true, name: true, authUserId: true },
  })
  if (user && !user.authUserId) {
    const { data, error } = await supabaseAdmin().auth.admin.createUser({
      email: email.value,
      password: randomBytes(32).toString('base64url'),
      email_confirm: false,
      user_metadata: { name: user.name },
    })
    if (data.user) {
      await prisma.user.update({ where: { id: user.id }, data: { authUserId: data.user.id, passwordHash: null } })
    } else {
      console.error('[auth] could not move account to Supabase for reset:', authErrorCode(error), error?.message)
    }
  }

  const { error } = await supabasePublic().auth.resetPasswordForEmail(email.value, {
    redirectTo: `${appOrigin()}/reset-password`,
  })
  if (error) {
    const code = authErrorCode(error)
    if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit') {
      return { ok: false, message: authErrorMessage(error)! }
    }
    console.info('[auth] reset email not sent:', code, error.message)
  }

  return { ok: true, message: `If ${email.value} has an account, a reset link is on its way.` }
}

/**
 * Redeems a reset link and sets the new password. Ends every other session
 * the account has open and signs this browser in. Opening the link proves the
 * person holds the address, so it confirms the email as well.
 */
export async function resetPassword(tokenHash: string, newPassword: string): Promise<ConfirmResult> {
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return { ok: false, message: 'Password must be at least 8 characters.' }
  }
  if (newPassword.length > 200) {
    return { ok: false, message: 'Password must be 200 characters or fewer.' }
  }
  const hash = String(tokenHash ?? '')
  if (!hash || hash.length > 200) return { ok: false, message: EXPIRED_RESET }

  const { data, error } = await supabasePublic().auth.verifyOtp({ token_hash: hash, type: 'recovery' })
  if (error || !data.user) {
    console.info('[auth] reset link refused:', authErrorCode(error), error?.message)
    return { ok: false, message: EXPIRED_RESET }
  }

  const updated = await supabaseAdmin().auth.admin.updateUserById(data.user.id, {
    password: newPassword,
    email_confirm: true,
  })
  if (updated.error) {
    const message = authErrorMessage(updated.error)
    if (message) return { ok: false, message }
    console.error('[auth] could not set the new password:', authErrorCode(updated.error), updated.error.message)
    return { ok: false, message: 'Could not set your new password. Please try again.' }
  }

  const account = await linkAuthUser(data.user, { confirmed: true })
  if (!account) {
    return { ok: false, message: 'This email is linked to a different account. Please contact us.' }
  }
  await prisma.user.update({
    where: { id: account.id },
    data: { mustChangePassword: false, pendingRedirect: null, sessionVersion: { increment: 1 } },
  })

  if (!(await startSession(account.id))) {
    return { ok: false, message: 'Your password is changed. Please sign in.', redirectTo: '/login' }
  }
  revalidatePath('/dashboard')
  return { ok: true, redirectTo: '/dashboard' }
}

const EXPIRED_RESET = 'This reset link has expired or was already used. Ask for a new one.'
