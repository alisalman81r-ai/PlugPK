// src/lib/db/app-admin-queries.ts
import 'server-only'

import type { Prisma } from '@prisma/client'

import { ADMIN_PAGE_SIZE } from './admin-queries'
import { prisma } from './client'

/**
 * Reads for the admin portal's "Mobile app" section: what has come in from the
 * app (AppEvent), who uses it (User.signupSource / lastAppActiveAt) and the
 * release log (AppRelease).
 */

/** The feed's filter chips, each a set of AppEvent types. */
export const APP_EVENT_KINDS = {
  all: { label: 'All', types: null },
  accounts: { label: 'Accounts', types: ['account.signup', 'account.signin', 'account.signout', 'profile.photo', 'profile.photoRemove'] },
  partners: { label: 'Partner requests', types: ['meeting.request'] },
  community: { label: 'Community', types: ['post.create', 'comment.create', 'post.like', 'post.unlike', 'club.join', 'club.leave'] },
  reviews: { label: 'Reviews', types: ['review.create'] },
  saved: { label: 'Saved & garage', types: ['station.save', 'station.unsave', 'garage.update', 'route.save', 'route.remove'] },
} as const

export type AppEventKind = keyof typeof APP_EVENT_KINDS
export const APP_EVENT_KIND_KEYS = Object.keys(APP_EVENT_KINDS) as AppEventKind[]

export async function getAppOverview() {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const [appSignups, appUsers, activeWeek, eventsToday, partnerRequests, lastSent, drafts] = await Promise.all([
    prisma.user.count({ where: { signupSource: 'app' } }),
    prisma.user.count({ where: { lastAppActiveAt: { not: null } } }),
    prisma.user.count({ where: { lastAppActiveAt: { gte: weekAgo } } }),
    prisma.appEvent.count({ where: { createdAt: { gte: dayAgo } } }),
    prisma.appEvent.count({ where: { type: 'meeting.request' } }),
    prisma.appRelease.findFirst({ where: { sentAt: { not: null } }, orderBy: { sentAt: 'desc' } }),
    prisma.appRelease.count({ where: { sentAt: null } }),
  ])
  return { appSignups, appUsers, activeWeek, eventsToday, partnerRequests, lastSent, drafts }
}

export async function listAppEventsPage({ q, kind, page }: { q: string; kind: AppEventKind; page: number }) {
  const types = APP_EVENT_KINDS[kind].types
  const search: Prisma.AppEventWhereInput = q
    ? { OR: [{ summary: { contains: q, mode: 'insensitive' } }, { userEmail: { contains: q, mode: 'insensitive' } }] }
    : {}
  const where: Prisma.AppEventWhereInput = { ...search, ...(types ? { type: { in: [...types] } } : {}) }

  const [rows, total, grouped] = await Promise.all([
    prisma.appEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    prisma.appEvent.count({ where }),
    prisma.appEvent.groupBy({ by: ['type'], where: search, _count: { _all: true } }),
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

  return {
    rows: rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
    total,
    counts,
    pageSize: ADMIN_PAGE_SIZE,
  }
}

/** Accounts that have used the app, most recently active first. */
export async function listAppUsersPage({ q, page }: { q: string; page: number }) {
  const where: Prisma.UserWhereInput = {
    OR: [{ lastAppActiveAt: { not: null } }, { signupSource: 'app' }],
    ...(q
      ? { AND: [{ OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] }] }
      : {}),
  }
  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ lastAppActiveAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        city: true,
        vehicle: true,
        avatar: true,
        signupSource: true,
        lastAppActiveAt: true,
        createdAt: true,
        _count: { select: { saved: true, vehicles: true, routes: true, clubs: true } },
      },
    }),
    prisma.user.count({ where }),
  ])
  const ids = rows.map((row) => row.id)
  const [posts, reviews] = await Promise.all([
    prisma.communityPost.groupBy({ by: ['userId'], where: { userId: { in: ids } }, _count: { _all: true } }),
    prisma.review.groupBy({ by: ['userId'], where: { userId: { in: ids } }, _count: { _all: true } }),
  ])
  const postCount = new Map(posts.map((row) => [row.userId, row._count._all]))
  const reviewCount = new Map(reviews.map((row) => [row.userId, row._count._all]))
  return {
    rows: rows.map((row) => ({
      ...row,
      lastAppActiveAt: row.lastAppActiveAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      posts: postCount.get(row.id) ?? 0,
      reviews: reviewCount.get(row.id) ?? 0,
    })),
    total,
    pageSize: ADMIN_PAGE_SIZE,
  }
}

export async function listAppReleases() {
  const rows = await prisma.appRelease.findMany({ orderBy: [{ createdAt: 'desc' }] })
  return rows.map((row) => ({
    ...row,
    sentAt: row.sentAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }))
}
