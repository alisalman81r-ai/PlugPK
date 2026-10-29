// src/lib/db/member-activity-queries.ts
import 'server-only'

import type { Prisma } from '@prisma/client'

import { ADMIN_PAGE_SIZE } from './admin-queries'
import { APP_EVENT_KINDS, APP_EVENT_KIND_KEYS, withNames, type AppEventKind } from './app-admin-queries'
import { prisma } from './client'

/**
 * Reads for the member timeline: everything members do, on the website and in
 * the app, newest first and named. Both write AppEvent rows (see
 * site-events.ts and app-api.ts); `source` says which.
 */

export const ACTIVITY_SOURCES = { all: 'Website & app', web: 'Website', app: 'App' } as const
export type ActivitySource = keyof typeof ACTIVITY_SOURCES
export const ACTIVITY_SOURCE_KEYS = Object.keys(ACTIVITY_SOURCES) as ActivitySource[]

export async function listMemberActivityPage({
  q,
  kind,
  source,
  page,
}: {
  q: string
  kind: AppEventKind
  source: ActivitySource
  page: number
}) {
  const types = APP_EVENT_KINDS[kind].types
  // Searching a name finds that account's actions, even ones whose summary was
  // written under an older name.
  const matchingUsers = q
    ? await prisma.user.findMany({
        where: { OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] },
        select: { id: true },
        take: 200,
      })
    : []
  const search: Prisma.AppEventWhereInput = {
    ...(source === 'all' ? {} : { source }),
    ...(q
      ? {
          OR: [
            { summary: { contains: q, mode: 'insensitive' } },
            { userEmail: { contains: q, mode: 'insensitive' } },
            ...(matchingUsers.length ? [{ userId: { in: matchingUsers.map((user) => user.id) } }] : []),
          ],
        }
      : {}),
  }
  const where: Prisma.AppEventWhereInput = { ...search, ...(types ? { type: { in: [...types] } } : {}) }

  const [rows, total, grouped, bySource] = await Promise.all([
    prisma.appEvent.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * ADMIN_PAGE_SIZE, take: ADMIN_PAGE_SIZE }),
    prisma.appEvent.count({ where }),
    prisma.appEvent.groupBy({ by: ['type'], where: search, _count: { _all: true } }),
    prisma.appEvent.groupBy({
      by: ['source'],
      where: { ...search, source: undefined, ...(types ? { type: { in: [...types] } } : {}) },
      _count: { _all: true },
    }),
  ])

  const byType = new Map(grouped.map((row) => [row.type, row._count._all]))
  const counts = Object.fromEntries(
    APP_EVENT_KIND_KEYS.map((key) => {
      const kindTypes = APP_EVENT_KINDS[key].types
      const n = kindTypes
        ? kindTypes.reduce((sum, type) => sum + (byType.get(type) ?? 0), 0)
        : [...byType.values()].reduce((sum, value) => sum + value, 0)
      return [key, n]
    }),
  ) as Record<AppEventKind, number>
  const sourceCounts = { all: 0, web: 0, app: 0 } as Record<ActivitySource, number>
  for (const row of bySource) {
    if (row.source === 'web' || row.source === 'app') sourceCounts[row.source] = row._count._all
    sourceCounts.all += row._count._all
  }

  return { rows: await withNames(rows), total, counts, sourceCounts, pageSize: ADMIN_PAGE_SIZE }
}

/**
 * Everything one member has done that the member page did not show before:
 * their timeline, replies, likes, clubs, routes, Partner Up requests and
 * service applications.
 */
export async function getMemberActivity(userId: string) {
  const [events, eventTotal, comments, commentCount, likeCount, clubs, routes, routeCount, meetings, services] =
    await Promise.all([
      prisma.appEvent.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 25 }),
      prisma.appEvent.count({ where: { userId } }),
      prisma.comment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, content: true, createdAt: true, post: { select: { title: true, slug: true } } },
      }),
      prisma.comment.count({ where: { userId } }),
      prisma.postLike.count({ where: { userId } }),
      prisma.clubMember.findMany({
        where: { userId },
        orderBy: { joinedAt: 'desc' },
        select: { joinedAt: true, club: { select: { id: true, name: true } } },
      }),
      prisma.savedRoute.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, origin: true, destination: true, distanceKm: true, createdAt: true },
      }),
      prisma.savedRoute.count({ where: { userId } }),
      prisma.meetingRequest.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, company: true, status: true, createdAt: true },
      }),
      prisma.eVService.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, city: true, status: true, createdAt: true },
      }),
    ])

  return {
    events: await withNames(events),
    eventTotal,
    comments: comments.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })),
    commentCount,
    likeCount,
    clubs: clubs.map((c) => ({ id: c.club.id, name: c.club.name, joinedAt: c.joinedAt.toISOString() })),
    routes: routes.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
    routeCount,
    meetings: meetings.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
    services: services.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() })),
  }
}
