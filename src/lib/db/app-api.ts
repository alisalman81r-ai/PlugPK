// src/lib/db/app-api.ts
import 'server-only'

import { randomUUID } from 'node:crypto'

import { NextResponse } from 'next/server'

import { prisma } from './client'
import { getCurrentProfile } from './session-actions'

/**
 * Shared pieces of the mobile app's API (src/app/api/app/**).
 *
 * The app is static JavaScript served from /app-prototype on this same
 * domain, so the website's own session cookie reaches these routes and every
 * write runs as the signed-in account — through the same server actions the
 * website uses, with their validation and rate limits. Nothing here accepts a
 * user id from the caller.
 */

/**
 * Same-site check for writes.
 *
 * Server Actions get Next's Origin-vs-Host check for free; route handlers do
 * not, and the session cookie is SameSite=lax — which still rides along on a
 * top-level cross-site POST. So a write must come from this origin. A request
 * with no Origin at all is refused too: browsers always send it on a POST.
 */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return false
  try {
    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store, private' },
  })
}

export const FORBIDDEN = () => json({ ok: false, message: 'Request refused.' }, 403)

export interface AppEventInput {
  userId?: string | null
  userEmail?: string | null
  type: string
  targetType?: string
  targetId?: string | null
  summary?: string
}

/**
 * One line in the admin's "Mobile app" feed, and the account's last-active
 * time. Never throws: a failed log must not fail the action it describes.
 */
export async function recordAppEvent(event: AppEventInput): Promise<void> {
  try {
    await prisma.appEvent.create({
      data: {
        id: randomUUID(),
        userId: event.userId ?? null,
        userEmail: event.userEmail ?? null,
        type: event.type,
        targetType: event.targetType ?? null,
        targetId: event.targetId ?? null,
        summary: event.summary?.slice(0, 300) ?? null,
      },
    })
    if (event.userId) await touchAppActive(event.userId, 0)
  } catch (error) {
    console.error('[app-api] could not record event', event.type, error)
  }
}

/**
 * Marks the account as active in the app. `minGapMs` keeps an app launch from
 * writing on every open: the timestamp only moves once it is that stale.
 */
export async function touchAppActive(userId: string, minGapMs = 5 * 60 * 1000): Promise<void> {
  try {
    await prisma.user.updateMany({
      where: {
        id: userId,
        ...(minGapMs > 0
          ? { OR: [{ lastAppActiveAt: null }, { lastAppActiveAt: { lt: new Date(Date.now() - minGapMs) } }] }
          : {}),
      },
      data: { lastAppActiveAt: new Date() },
    })
  } catch (error) {
    console.error('[app-api] could not mark active', error)
  }
}

/** The newest update sent to users, for the app's "What's new". */
export async function latestRelease() {
  return prisma.appRelease.findFirst({
    where: { sentAt: { not: null } },
    orderBy: { sentAt: 'desc' },
    select: { id: true, version: true, title: true, notes: true, sentAt: true },
  })
}

/**
 * Everything the app keeps per account, as the server has it: who is signed
 * in, and their saved stations, garage, clubs, liked posts, routes and
 * reviews. The app replaces its local copies with this on launch and after
 * signing in, so a phone and the website always agree.
 */
export async function appSnapshot() {
  const profile = await getCurrentProfile()
  const release = await latestRelease()
  if (!profile) return { user: null, state: null, release }

  const [saved, garage, clubs, likes, routes, reviews] = await Promise.all([
    prisma.savedStation.findMany({ where: { userId: profile.id }, select: { listingId: true } }),
    prisma.userVehicle.findMany({
      where: { userId: profile.id },
      select: { vehicleId: true, isDefault: true },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    }),
    prisma.clubMember.findMany({ where: { userId: profile.id }, select: { clubId: true } }),
    prisma.postLike.findMany({ where: { userId: profile.id }, select: { postId: true } }),
    prisma.savedRoute.findMany({
      where: { userId: profile.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.review.findMany({
      where: { userId: profile.id, stationId: { not: null } },
      orderBy: { date: 'desc' },
      take: 100,
      select: { id: true, stationId: true, rating: true, comment: true, userVehicle: true, date: true },
    }),
  ])

  return {
    user: {
      name: profile.name,
      email: profile.email,
      avatar: profile.avatar,
      city: profile.city,
      joined: profile.createdAt,
    },
    state: {
      saved: saved.map((row) => row.listingId),
      garage: garage.map((row) => row.vehicleId),
      primary: garage.find((row) => row.isDefault)?.vehicleId ?? garage[0]?.vehicleId ?? null,
      clubs: clubs.map((row) => row.clubId),
      liked: likes.map((row) => row.postId),
      routes: routes.map((route) => ({
        sid: route.id,
        from: route.origin,
        to: route.destination,
        start: route.batteryPercent,
        slug: route.carId,
        savedAt: route.createdAt,
      })),
      reviews: reviews.map((review) => ({
        id: review.id,
        stationId: review.stationId,
        rating: review.rating,
        text: review.comment,
        car: review.userVehicle,
        date: review.date,
      })),
    },
    release,
  }
}
