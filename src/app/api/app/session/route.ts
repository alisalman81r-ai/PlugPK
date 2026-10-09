// src/app/api/app/session/route.ts
//
// The mobile app's account: who is signed in (with everything the app keeps
// per account), signing in or up, and signing out. Sign-in and sign-up are the
// website's own actions, so the same passwords, rules and rate limits apply,
// and an account made in the app works on the website and the other way round.

import { prisma } from '@/lib/db/client'
import { FORBIDDEN, appSnapshot, json, recordAppEvent, sameOrigin, touchAppActive } from '@/lib/db/app-api'
import { registerUser } from '@/lib/db/auth-actions'
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

/** `{ mode: 'signin' | 'signup', name?, email, password }` */
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

  if (body.mode === 'signup') {
    const result = await registerUser(form)
    if (!result.ok) return json({ ok: false, message: result.message ?? 'Could not create the account.' })
    const email = String(body.email ?? '').trim().toLowerCase()
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
    return json({ ok: true })
  }

  const result = await signIn(form)
  if (!result.ok) return json({ ok: false, message: result.message ?? 'Email or password is incorrect.' })

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
