// src/app/api/app/session/route.ts
//
// The mobile app's account: who is signed in (with everything the app keeps
// per account), signing in or up, confirming the emailed code, resetting a
// forgotten password, and signing out. Sign-in and sign-up are the
// website's own actions, so the same passwords, rules and rate limits apply,
// and an account made in the app works on the website and the other way round.

import { prisma } from '@/lib/db/client'
import { FORBIDDEN, appSnapshot, json, recordAppEvent, sameOrigin, touchAppActive } from '@/lib/db/app-api'
import {
  registerUser,
  requestPasswordReset,
  resendVerification,
  resetPasswordWithCode,
  verifyEmailCode,
} from '@/lib/db/auth-actions'
import { getSessionUserId } from '@/lib/db/session'
import { signIn, signOut } from '@/lib/db/session-actions'

export const dynamic = 'force-dynamic'

/** The signed-in account and its saved state, or `user: null`. */
export async function GET() {
  const snapshot = await appSnapshot()
  const userId = await getSessionUserId()
  if (userId) await touchAppActive(userId)
  return json(snapshot)
}

/**
 * `{ mode: 'signin' | 'signup', name?, email, password }`
 * `{ mode: 'verify', email, code }`  — the 6-digit code; signs in on success
 * `{ mode: 'resend', email }`        — a new code
 * `{ mode: 'reset-request', email }` — emails a 6-digit password-reset code
 * `{ mode: 'reset', email, code, password }` — sets it; signs in on success
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return FORBIDDEN()

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return json({ ok: false, message: 'Something went wrong. Please try again.' }, 400)
  }

  const form = new FormData()
  for (const key of ['name', 'email', 'password', 'city'] as const) {
    if (typeof body[key] === 'string') form.set(key, body[key] as string)
  }

  if (body.mode === 'verify') {
    const result = await verifyEmailCode(String(body.email ?? ''), String(body.code ?? ''))
    if (!result.ok) {
      return json({ ok: false, needsNewCode: result.needsNewCode === true, message: result.message ?? 'That code is not right.' })
    }
    const user = await prisma.user.findUnique({
      where: { email: String(body.email ?? '').trim().toLowerCase() },
      select: { id: true, email: true, name: true },
    })
    if (user) {
      await recordAppEvent({
        userId: user.id,
        userEmail: user.email,
        type: 'account.verify',
        targetType: 'member',
        targetId: user.id,
        summary: `${user.name} confirmed their email in the app`,
      })
    }
    return json({ ok: true })
  }

  if (body.mode === 'resend') {
    return json(await resendVerification(String(body.email ?? '')))
  }

  // Forgotten password: the website's own reset, so the same code rules,
  // rate limits and replies apply in the app as on /forgot-password.
  if (body.mode === 'reset-request') {
    return json(await requestPasswordReset(String(body.email ?? '')))
  }

  if (body.mode === 'reset') {
    const email = String(body.email ?? '').trim().toLowerCase()
    const result = await resetPasswordWithCode(email, String(body.code ?? ''), String(body.password ?? ''))
    if (!result.ok) {
      return json({ ok: false, needsNewCode: result.needsNewCode === true, message: result.message ?? 'That code is not right.' })
    }
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, name: true } })
    if (user) {
      await recordAppEvent({
        userId: user.id,
        userEmail: user.email,
        type: 'account.reset',
        targetType: 'member',
        targetId: user.id,
        summary: `${user.name} reset their password in the app`,
      })
    }
    // The password is changed either way; only the sign-in may not have stuck.
    const signedIn = result.redirectTo !== '/login'
    return json({ ok: true, signedIn, ...(signedIn ? {} : { message: result.message }) })
  }

  if (body.mode === 'signup') {
    const result = await registerUser(form)
    if (!result.ok) return json({ ok: false, message: result.message ?? 'Could not create the account.' })
    const email = result.verifyEmail ?? String(body.email ?? '').trim().toLowerCase()
    const user = await prisma.user.update({
      where: { email },
      data: { signupSource: 'app', lastAppActiveAt: new Date() },
      select: { id: true, email: true, name: true },
    })
    await recordAppEvent({
      userId: user.id,
      userEmail: user.email,
      type: 'account.signup',
      targetType: 'member',
      targetId: user.id,
      summary: `${user.name} created an account in the app`,
    })
    // No session yet: the account is inactive until the emailed code is entered.
    return json({ ok: true, verifyEmail: user.email, emailSent: result.emailSent === true, message: result.message })
  }

  // Anything else used to fall through to sign-in, so a request the server
  // does not know (an app asking for a reset before this existed) answered
  // "Enter your email and password." Now it says what happened.
  if (body.mode !== 'signin') {
    return json({ ok: false, message: 'Unknown request.' }, 400)
  }

  const result = await signIn(form)
  if (!result.ok) {
    return json({
      ok: false,
      unverified: result.unverified === true,
      emailSent: result.emailSent === true,
      message: result.message ?? 'Email or password is incorrect.',
    })
  }

  const email = String(body.email ?? '').trim().toLowerCase()
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, name: true } })
  if (user) {
    await recordAppEvent({
      userId: user.id,
      userEmail: user.email,
      type: 'account.signin',
      targetType: 'member',
      targetId: user.id,
      summary: `${user.name} signed in on the app`,
    })
  }
  // A temporary password from an operator has to be replaced first, and that
  // screen is on the website.
  const mustChange = result.redirectTo?.includes('changePassword') ?? false
  return json({ ok: true, mustChangePassword: mustChange })
}

/** Signs this device out. */
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return FORBIDDEN()
  const userId = await getSessionUserId()
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } })
    await recordAppEvent({
      userId,
      userEmail: user?.email,
      type: 'account.signout',
      targetType: 'member',
      targetId: userId,
      summary: `${user?.name ?? 'A member'} signed out of the app`,
    })
  }
  await signOut()
  return json({ ok: true })
}
