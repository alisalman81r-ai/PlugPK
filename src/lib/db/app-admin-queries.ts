// src/lib/db/app-admin-queries.ts
import 'server-only'

import type { AppEvent, Prisma } from '@prisma/client'

import { ADMIN_PAGE_SIZE } from './admin-queries'
import { prisma } from './client'

/**
 * Reads for the admin portal's "Mobile app" section: what has come in from the
 * app (AppEvent with source 'app'), who uses it (User.signupSource /
 * lastAppActiveAt) and the release log (AppRelease). Website activity shares
 * the AppEvent table (source 'web') and is left out of every count here.
 */

const FROM_APP = { source: 'app' } as const

/** The feed's filter chips, each a set of AppEvent types. */
export const APP_EVENT_KINDS = {
  all: { label: 'All', types: null },
  accounts: { label: 'Accounts', types: ['account.signup', 'account.signin', 'account.signout', 'account.verify', 'account.reset', 'profile.photo', 'profile.photoRemove'] },
  partners: { label: 'Partners & listings', types: ['meeting.request', 'business.register', 'service.apply'] },
  community: { label: 'Community', types: ['post.create', 'comment.create', 'post.like', 'post.unlike', 'club.join', 'club.leave'] },
  reviews: { label: 'Reviews', types: ['review.create'] },
  saved: { label: 'Saved & garage', types: ['station.save', 'station.unsave', 'garage.update', 'route.save', 'route.remove'] },
} as const

export type AppEventKind = keyof typeof APP_EVENT_KINDS
export const APP_EVENT_KIND_KEYS = Object.keys(APP_EVENT_KINDS) as AppEventKind[]

/** The overview's period presets, in days. */
export const APP_RANGES = ['7', '30', '90'] as const
export type AppRange = (typeof APP_RANGES)[number]

const TZ = 'Asia/Karachi'
const DAY_MS = 24 * 60 * 60 * 1000

/** 'YYYY-MM-DD' for a moment, as the calendar day in Pakistan. */
function dayKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

/** Which overview kind an event type belongs to ('all' is never returned). */
function kindOf(type: string): Exclude<AppEventKind, 'all'> | null {
  for (const key of APP_EVENT_KIND_KEYS) {
    const types = APP_EVENT_KINDS[key].types as readonly string[] | null
    if (types && types.includes(type)) return key as Exclude<AppEventKind, 'all'>
  }
  return null
}

/**
 * Everything the overview shows, for one period — so every number on the page
 * describes the same slice of time and they always agree with each other.
 *
 * "Active" on the chart means a signed-in member who did something in the app
 * that day (an AppEvent with a user). Opening the app without doing anything
 * only moves User.lastAppActiveAt, which keeps no history — so the 24h / 7d /
 * 30d counts come from that column instead, and say so.
 */
export async function getAppDashboard(range: AppRange) {
  const days = Number(range)
  const now = Date.now()
  const since = new Date(now - days * DAY_MS)
  const before = new Date(now - 2 * days * DAY_MS)
  const appUserWhere: Prisma.UserWhereInput = { OR: [{ lastAppActiveAt: { not: null } }, { signupSource: 'app' }] }

  // Listings sent from the app, so "pending" below means pending *from the app*.
  const sentFromApp = await prisma.appEvent.findMany({
    where: { ...FROM_APP, type: { in: ['business.register', 'service.apply'] }, targetId: { not: null } },
    select: { type: true, targetId: true },
  })
  const businessIds = sentFromApp.filter((e) => e.type === 'business.register').map((e) => e.targetId!)
  const serviceIds = sentFromApp.filter((e) => e.type === 'service.apply').map((e) => e.targetId!)

  const [
    appUsers, active24h, active7d, active30d,
    signupsApp, signupsWeb,
    actions, actionsBefore,
    daily, byType, topRaw,
    pendingBusinesses, pendingServices, newMeetings, unverified,
    recentSignups, lastSent, drafts,
  ] = await Promise.all([
    prisma.user.count({ where: appUserWhere }),
    prisma.user.count({ where: { lastAppActiveAt: { gte: new Date(now - DAY_MS) } } }),
    prisma.user.count({ where: { lastAppActiveAt: { gte: new Date(now - 7 * DAY_MS) } } }),
    prisma.user.count({ where: { lastAppActiveAt: { gte: new Date(now - 30 * DAY_MS) } } }),
    prisma.user.count({ where: { signupSource: 'app', createdAt: { gte: since } } }),
    prisma.user.count({ where: { signupSource: { not: 'app' }, createdAt: { gte: since } } }),
    prisma.appEvent.count({ where: { ...FROM_APP, createdAt: { gte: since } } }),
    prisma.appEvent.count({ where: { ...FROM_APP, createdAt: { gte: before, lt: since } } }),
    // createdAt is stored as UTC; the day boundaries are Pakistan's.
    prisma.$queryRaw<{ day: string; actions: number; users: number }[]>`
      SELECT to_char((e."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${TZ}, 'YYYY-MM-DD') AS day,
             count(*)::int AS actions,
             -- Only accounts that still exist: a deleted member's history stays in
             -- the log, but they are no longer a member to count.
             count(DISTINCT u.id)::int AS users
      FROM "AppEvent" e
      LEFT JOIN "User" u ON u.id = e."userId"
      WHERE e."createdAt" >= ${since} AND e."source" = 'app'
      GROUP BY 1
      ORDER BY 1`,
    prisma.appEvent.groupBy({ by: ['type'], where: { ...FROM_APP, createdAt: { gte: since } }, _count: { _all: true } }),
    prisma.appEvent.groupBy({
      by: ['userId'],
      where: { ...FROM_APP, createdAt: { gte: since }, userId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { userId: 'desc' } },
      take: 5,
    }),
    businessIds.length ? prisma.business.count({ where: { id: { in: businessIds }, status: 'pending' } }) : 0,
    serviceIds.length ? prisma.eVService.count({ where: { id: { in: serviceIds }, status: 'pending' } }) : 0,
    prisma.meetingRequest.count({ where: { status: 'new' } }),
    prisma.user.count({ where: { signupSource: 'app', emailVerifiedAt: null } }),
    prisma.user.findMany({
      where: { signupSource: 'app' },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: { id: true, name: true, email: true, vehicle: true, createdAt: true, emailVerifiedAt: true },
    }),
    prisma.appRelease.findFirst({ where: { sentAt: { not: null } }, orderBy: { sentAt: 'desc' } }),
    prisma.appRelease.count({ where: { sentAt: null } }),
  ])

  // Every day of the period, including the quiet ones, oldest first.
  const byDay = new Map(daily.map((row) => [row.day, row]))
  const series = Array.from({ length: days }, (_, i) => {
    const key = dayKey(new Date(now - (days - 1 - i) * DAY_MS))
    const row = byDay.get(key)
    return { day: key, actions: row?.actions ?? 0, users: row?.users ?? 0 }
  })

  const kinds = Object.fromEntries(
    APP_EVENT_KIND_KEYS.filter((k) => k !== 'all').map((k) => [k, 0]),
  ) as Record<Exclude<AppEventKind, 'all'>, number>
  for (const row of byType) {
    const kind = kindOf(row.type)
    if (kind) kinds[kind] += row._count._all
  }

  const topIds = topRaw.map((row) => row.userId!).filter(Boolean)
  const topUsers = topIds.length
    ? await prisma.user.findMany({ where: { id: { in: topIds } }, select: { id: true, name: true, email: true } })
    : []
  const topById = new Map(topUsers.map((u) => [u.id, u]))
  const top = topRaw
    .map((row) => ({ user: topById.get(row.userId!), actions: row._count._all }))
    .filter((row): row is { user: { id: string; name: string; email: string }; actions: number } => !!row.user)

  // Of the people who use the app, how many have opened it since the newest update went out.
  const reachedByUpdate = lastSent?.sentAt
    ? await prisma.user.count({ where: { lastAppActiveAt: { gte: lastSent.sentAt } } })
    : 0

  return {
    days,
    appUsers,
    active: { day: active24h, week: active7d, month: active30d },
    signups: { app: signupsApp, web: signupsWeb },
    actions: { now: actions, before: actionsBefore },
    series,
    kinds,
    top,
    attention: { pendingBusinesses, pendingServices, newMeetings, unverified },
    recentSignups: recentSignups.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
      verified: u.emailVerifiedAt !== null,
    })),
    release: lastSent
      ? { version: lastSent.version, title: lastSent.title, sentAt: lastSent.sentAt!.toISOString(), reached: reachedByUpdate }
      : null,
    drafts,
  }
}

/**
 * Rows with each account's current name. The name is looked up rather than
 * copied, so a member who renames shows under the new name; a deleted account
 * keeps the email written at the time.
 */
export async function withNames(rows: AppEvent[]) {
  const ids = [...new Set(rows.map((row) => row.userId).filter((id): id is string => !!id))]
  const users = ids.length ? await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }) : []
  const names = new Map(users.map((user) => [user.id, user.name]))
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    targetType: row.targetType,
    targetId: row.targetId,
    userId: row.userId && names.has(row.userId) ? row.userId : null,
    userEmail: row.userEmail,
    userName: row.userId ? (names.get(row.userId) ?? null) : null,
    summary: row.summary,
    source: row.source,
    createdAt: row.createdAt.toISOString(),
  }))
}

export async function listAppEventsPage({ q, kind, page }: { q: string; kind: AppEventKind; page: number }) {
  const types = APP_EVENT_KINDS[kind].types
  const search: Prisma.AppEventWhereInput = q
    ? { ...FROM_APP, OR: [{ summary: { contains: q, mode: 'insensitive' } }, { userEmail: { contains: q, mode: 'insensitive' } }] }
    : FROM_APP
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
    rows: await withNames(rows),
    total,
    counts,
    pageSize: ADMIN_PAGE_SIZE,
  }
}

/** The Users view's status chips. */
export const APP_USER_STATUSES = {
  all: 'All',
  active: 'Active this week',
  inactive: 'Inactive 30+ days',
  unverified: 'Email not confirmed',
} as const
export type AppUserStatus = keyof typeof APP_USER_STATUSES
export const APP_USER_STATUS_KEYS = Object.keys(APP_USER_STATUSES) as AppUserStatus[]

function statusWhere(status: AppUserStatus): Prisma.UserWhereInput {
  const now = Date.now()
  switch (status) {
    case 'active':
      return { lastAppActiveAt: { gte: new Date(now - 7 * DAY_MS) } }
    case 'inactive':
      return { OR: [{ lastAppActiveAt: null }, { lastAppActiveAt: { lt: new Date(now - 30 * DAY_MS) } }] }
    case 'unverified':
      return { emailVerifiedAt: null }
    default:
      return {}
  }
}

/** Accounts that have used the app, most recently active first. */
export async function listAppUsersPage({ q, page, status = 'all' }: { q: string; page: number; status?: AppUserStatus }) {
  const base: Prisma.UserWhereInput = {
    OR: [{ lastAppActiveAt: { not: null } }, { signupSource: 'app' }],
    ...(q
      ? { AND: [{ OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] }] }
      : {}),
  }
  const where: Prisma.UserWhereInput = { AND: [base, statusWhere(status)] }
  const counts = Object.fromEntries(
    await Promise.all(
      APP_USER_STATUS_KEYS.map(async (key) => [key, await prisma.user.count({ where: { AND: [base, statusWhere(key)] } })] as const),
    ),
  ) as Record<AppUserStatus, number>
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
        emailVerifiedAt: true,
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
      verified: row.emailVerifiedAt !== null,
      emailVerifiedAt: undefined,
      posts: postCount.get(row.id) ?? 0,
      reviews: reviewCount.get(row.id) ?? 0,
    })),
    total,
    counts,
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
