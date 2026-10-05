// src/lib/db/admin-queries.ts
import 'server-only'

import type { Prisma } from '@prisma/client'

import type { Connector, Station } from '@/lib/types'

import { prisma } from './client'
import type { BusinessCharger, BusinessRow, MemberRow } from './queries'
import { toConnector, toStation } from './serialize'

/**
 * The admin portal's list queries: paginated, filtered and searched in the
 * database.
 *
 * Every admin list used to load its whole table and filter in the browser.
 * For a few dozen stations that was invisible; for members it meant shipping
 * every registered email address to the client on each visit, plus two
 * groupBys across the whole user table, to show the first screenful. These
 * queries read one page, count the match, and leave the rest where it is.
 *
 * Kept apart from queries.ts on purpose: those are the public site's reads,
 * shaped for drivers. These are shaped for an operator and are never imported
 * outside /admin.
 */

export const ADMIN_PAGE_SIZE = 25

export interface AdminPage<T> {
  rows: T[]
  /** Rows matching the filter, across every page. */
  total: number
  page: number
  pageSize: number
}

/** Page numbers from the URL are untrusted: clamp, never throw. */
export function toPage(raw: string | string[] | undefined): number {
  const value = Number(Array.isArray(raw) ? raw[0] : raw)
  return Number.isInteger(value) && value > 0 && value < 100000 ? value : 1
}

function pageWindow(page: number, pageSize = ADMIN_PAGE_SIZE) {
  return { skip: (page - 1) * pageSize, take: pageSize }
}

/** A search box value, trimmed and capped so one request cannot be a novel. */
export function toQuery(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw
  return (value ?? '').trim().slice(0, 100)
}

const contains = (q: string) => ({ contains: q, mode: 'insensitive' as const })

/** Where "today" starts for an operator in Pakistan (UTC+5, no DST). */
export function startOfKarachiDay(now = new Date()): Date {
  const offset = 5 * 60 * 60 * 1000
  const day = 24 * 60 * 60 * 1000
  return new Date(Math.floor((now.getTime() + offset) / day) * day - offset)
}

// ─── Members ────────────────────────────────────────

export type MemberSort = 'recent' | 'oldest' | 'name'
export type MemberFilter = 'all' | 'admins' | 'business'

export interface MemberListing extends AdminPage<MemberRow> {
  counts: { all: number; admins: number; withBusiness: number }
}

/**
 * One page of members.
 *
 * "Most active" sorting is gone with the in-memory list: reviews and posts
 * carry a plain userId with no relation, so ordering by them would mean
 * counting the whole table again to sort it. The counts are still shown on
 * each row, read for that page's ids only.
 */
export async function listMembersPage(options: {
  q: string
  page: number
  sort: MemberSort
  filter: MemberFilter
}): Promise<MemberListing> {
  const where: Prisma.UserWhereInput = {
    ...(options.q
      ? {
          OR: [
            { name: contains(options.q) },
            { email: contains(options.q) },
            { city: contains(options.q) },
            { vehicle: contains(options.q) },
          ],
        }
      : {}),
    ...(options.filter === 'admins' ? { isAdmin: true } : {}),
    ...(options.filter === 'business' ? { businesses: { some: {} } } : {}),
  }

  const orderBy: Prisma.UserOrderByWithRelationInput =
    options.sort === 'name' ? { name: 'asc' } : { createdAt: options.sort === 'oldest' ? 'asc' : 'desc' }

  const [users, total, all, admins, withBusiness] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy,
      ...pageWindow(options.page),
      select: {
        id: true,
        name: true,
        email: true,
        city: true,
        vehicle: true,
        isAdmin: true,
        createdAt: true,
        _count: { select: { businesses: true, saved: true, vehicles: true } },
      },
    }),
    prisma.user.count({ where }),
    prisma.user.count(),
    prisma.user.count({ where: { isAdmin: true } }),
    prisma.user.count({ where: { businesses: { some: {} } } }),
  ])

  const ids = users.map((user) => user.id)
  const [reviewCounts, postCounts] = ids.length
    ? await Promise.all([
        prisma.review.groupBy({ by: ['userId'], where: { userId: { in: ids } }, _count: { _all: true } }),
        prisma.communityPost.groupBy({ by: ['userId'], where: { userId: { in: ids } }, _count: { _all: true } }),
      ])
    : [[], []]
  const reviewsById = new Map(reviewCounts.map((row) => [row.userId, row._count._all]))
  const postsById = new Map(postCounts.map((row) => [row.userId, row._count._all]))

  return {
    total,
    page: options.page,
    pageSize: ADMIN_PAGE_SIZE,
    counts: { all, admins, withBusiness },
    rows: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      city: user.city,
      vehicle: user.vehicle,
      joinedAt: user.createdAt.toISOString(),
      businessCount: user._count.businesses,
      reviewCount: reviewsById.get(user.id) ?? 0,
      savedCount: user._count.saved,
      vehicleCount: user._count.vehicles,
      postCount: postsById.get(user.id) ?? 0,
      isAdmin: user.isAdmin,
    })),
  }
}

export interface MemberAdminFacts {
  isAdmin: boolean
  membershipCount: number
  commentCount: number
  /** How many admins exist, so the page can explain a refused revoke. */
  adminCount: number
  mustChangePassword: boolean
  anonymised: boolean
}

/** What the member page needs to decide which controls to offer. */
export async function getMemberAdminFacts(id: string): Promise<MemberAdminFacts | null> {
  const [user, commentCount, adminCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: { isAdmin: true, email: true, mustChangePassword: true, _count: { select: { memberships: true } } },
    }),
    prisma.comment.count({ where: { userId: id } }),
    prisma.user.count({ where: { isAdmin: true } }),
  ])
  if (!user) return null
  return {
    isAdmin: user.isAdmin,
    membershipCount: user._count.memberships,
    commentCount,
    adminCount,
    mustChangePassword: user.mustChangePassword,
    anonymised: user.email.endsWith('@deleted.invalid'),
  }
}

// ─── Stations ───────────────────────────────────────

export interface StationListing extends AdminPage<Station> {
  /** Tallies across the whole network, not the filtered page. */
  counts: { all: number; status: Record<string, number>; venue: Record<string, number> }
}

export async function listStationsPage(options: {
  q: string
  status: string
  venue: string
  page: number
}): Promise<StationListing> {
  const where: Prisma.StationWhereInput = {
    ...(options.status !== 'all' ? { status: options.status } : {}),
    ...(options.venue !== 'all' ? { venueType: options.venue } : {}),
    ...(options.q
      ? {
          OR: [
            { name: contains(options.q) },
            { city: contains(options.q) },
            { area: contains(options.q) },
            { network: contains(options.q) },
            { slug: contains(options.q) },
            // Connector types are on the face of the row, so they are searchable.
            { connectors: { some: { type: contains(options.q) } } },
          ],
        }
      : {}),
  }

  const [rows, total, all, byStatus, byVenue] = await Promise.all([
    prisma.station.findMany({
      where,
      include: { connectors: true },
      orderBy: { name: 'asc' },
      ...pageWindow(options.page),
    }),
    prisma.station.count({ where }),
    prisma.station.count(),
    prisma.station.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.station.groupBy({ by: ['venueType'], _count: { _all: true } }),
  ])

  return {
    rows: rows.map(toStation),
    total,
    page: options.page,
    pageSize: ADMIN_PAGE_SIZE,
    counts: {
      all,
      status: Object.fromEntries(byStatus.map((row) => [row.status, row._count._all])),
      venue: Object.fromEntries(byVenue.map((row) => [row.venueType, row._count._all])),
    },
  }
}

// ─── Connectors ─────────────────────────────────────

export interface AdminConnectorRow {
  connector: Connector
  stationId: string
  stationName: string
  city: string
}

export interface ConnectorListing extends AdminPage<AdminConnectorRow> {
  /** Across every connector, so the header does not change with the page. */
  totals: { connectors: number; ports: number; free: number }
}

export async function listConnectorsPage(options: {
  q: string
  status: string
  page: number
}): Promise<ConnectorListing> {
  const where: Prisma.ConnectorWhereInput = {
    ...(options.status !== 'all' ? { status: options.status } : {}),
    ...(options.q
      ? {
          OR: [
            { type: contains(options.q) },
            { station: { name: contains(options.q) } },
            { station: { city: contains(options.q) } },
          ],
        }
      : {}),
  }

  const [rows, total, sums] = await Promise.all([
    prisma.connector.findMany({
      where,
      include: { station: { select: { id: true, name: true, city: true } } },
      orderBy: [{ station: { name: 'asc' } }, { maxPowerKw: 'desc' }],
      ...pageWindow(options.page),
    }),
    prisma.connector.count({ where }),
    prisma.connector.aggregate({ _count: { _all: true }, _sum: { ports: true, availablePorts: true } }),
  ])

  return {
    total,
    page: options.page,
    pageSize: ADMIN_PAGE_SIZE,
    totals: {
      connectors: sums._count._all,
      ports: sums._sum.ports ?? 0,
      free: sums._sum.availablePorts ?? 0,
    },
    rows: rows.map((row) => ({
      connector: toConnector(row),
      stationId: row.station.id,
      stationName: row.station.name,
      city: row.station.city,
    })),
  }
}

// ─── Businesses ─────────────────────────────────────

export interface AdminBusinessRow extends BusinessRow {
  /** Why it was rejected, when it was. Shown back to the operator. */
  reviewNote: string | null
  reviewedAt: string | null
}

function parseChargers(raw: string): BusinessCharger[] {
  // A malformed column should cost this business its charger list, not take
  // down the whole admin page.
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as BusinessCharger[]) : []
  } catch {
    return []
  }
}

type BusinessRecord = Prisma.BusinessGetPayload<object>

function toAdminBusiness(row: BusinessRecord): AdminBusinessRow {
  return {
    ...row,
    chargers: parseChargers(row.chargers),
    // A Prisma Date cannot cross into a Server Component payload unserialised.
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
  }
}

export interface BusinessListing extends AdminPage<AdminBusinessRow> {
  counts: { all: number; pending: number; approved: number; rejected: number }
}

export async function listBusinessesPage(options: {
  q: string
  status: string
  page: number
}): Promise<BusinessListing> {
  const where: Prisma.BusinessWhereInput = {
    ...(options.status !== 'all' ? { status: options.status } : {}),
    ...(options.q
      ? {
          OR: [
            { businessName: contains(options.q) },
            { ownerName: contains(options.q) },
            { email: contains(options.q) },
            { city: contains(options.q) },
          ],
        }
      : {}),
  }

  const [rows, total, grouped] = await Promise.all([
    prisma.business.findMany({
      where,
      // Pending first — that is the work — then newest.
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      ...pageWindow(options.page),
    }),
    prisma.business.count({ where }),
    prisma.business.groupBy({ by: ['status'], _count: { _all: true } }),
  ])
  const by = Object.fromEntries(grouped.map((row) => [row.status, row._count._all]))

  return {
    rows: rows.map(toAdminBusiness),
    total,
    page: options.page,
    pageSize: ADMIN_PAGE_SIZE,
    counts: {
      all: grouped.reduce((sum, row) => sum + row._count._all, 0),
      pending: by.pending ?? 0,
      approved: by.approved ?? 0,
      rejected: by.rejected ?? 0,
    },
  }
}

export async function getAdminBusiness(id: string): Promise<AdminBusinessRow | null> {
  const row = await prisma.business.findUnique({ where: { id } })
  return row ? toAdminBusiness(row) : null
}

// ─── Meetings ───────────────────────────────────────

export interface AdminMeetingRow {
  id: string
  name: string
  company: string
  email: string
  phone: string | null
  preferredDate: string | null
  preferredTime: string | null
  note: string | null
  status: string
  createdAt: string
}

export interface MeetingListing extends AdminPage<AdminMeetingRow> {
  counts: { all: number; new: number; handled: number }
}

export async function listMeetingsPage(options: {
  q: string
  status: string
  page: number
}): Promise<MeetingListing> {
  const where: Prisma.MeetingRequestWhereInput = {
    ...(options.status !== 'all' ? { status: options.status } : {}),
    ...(options.q
      ? {
          OR: [
            { company: contains(options.q) },
            { name: contains(options.q) },
            { email: contains(options.q) },
            { note: contains(options.q) },
          ],
        }
      : {}),
  }

  const [rows, total, grouped] = await Promise.all([
    prisma.meetingRequest.findMany({
      where,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      ...pageWindow(options.page),
    }),
    prisma.meetingRequest.count({ where }),
    prisma.meetingRequest.groupBy({ by: ['status'], _count: { _all: true } }),
  ])
  const by = Object.fromEntries(grouped.map((row) => [row.status, row._count._all]))

  return {
    total,
    page: options.page,
    pageSize: ADMIN_PAGE_SIZE,
    counts: {
      all: grouped.reduce((sum, row) => sum + row._count._all, 0),
      new: by.new ?? 0,
      handled: by.handled ?? 0,
    },
    rows: rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
  }
}

// ─── Community ──────────────────────────────────────

export interface AdminComment {
  id: string
  userId: string
  userName: string
  content: string
  createdAt: string
}

export interface AdminPostRow {
  id: string
  slug: string
  title: string
  content: string
  category: string
  userId: string
  userName: string
  likeCount: number
  commentCount: number
  createdAt: string
  isNew: boolean
  comments: AdminComment[]
}

export interface CommunityListing extends AdminPage<AdminPostRow> {
  counts: { all: number; unreviewed: number; postedToday: number }
}

/** Enough comments per post to moderate a thread without loading a forum. */
const COMMENTS_PER_POST = 100

export async function listCommunityPage(options: {
  q: string
  filter: 'all' | 'unreviewed'
  page: number
}): Promise<CommunityListing> {
  const where: Prisma.CommunityPostWhereInput = {
    ...(options.filter === 'unreviewed' ? { adminViewedAt: null } : {}),
    ...(options.q
      ? {
          OR: [
            { title: contains(options.q) },
            { content: contains(options.q) },
            { userName: contains(options.q) },
            { comments: { some: { content: contains(options.q) } } },
          ],
        }
      : {}),
  }

  const [rows, total, all, unreviewed, postedToday] = await Promise.all([
    prisma.communityPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...pageWindow(options.page),
      include: {
        comments: {
          orderBy: { createdAt: 'asc' },
          take: COMMENTS_PER_POST,
          select: { id: true, userId: true, userName: true, content: true, createdAt: true },
        },
      },
    }),
    prisma.communityPost.count({ where }),
    prisma.communityPost.count(),
    prisma.communityPost.count({ where: { adminViewedAt: null } }),
    prisma.communityPost.count({ where: { createdAt: { gte: startOfKarachiDay() } } }),
  ])

  return {
    total,
    page: options.page,
    pageSize: ADMIN_PAGE_SIZE,
    counts: { all, unreviewed, postedToday },
    rows: rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      content: row.content,
      category: row.category,
      userId: row.userId,
      userName: row.userName,
      likeCount: row.likeCount,
      commentCount: row.commentCount,
      createdAt: row.createdAt.toISOString(),
      isNew: row.adminViewedAt === null,
      comments: row.comments.map((comment) => ({ ...comment, createdAt: comment.createdAt.toISOString() })),
    })),
  }
}

/** The dashboard's five newest posts — five rows, not the whole table. */
export async function getLatestPosts(take = 5) {
  return prisma.communityPost.findMany({
    orderBy: { createdAt: 'desc' },
    take,
    select: { id: true, title: true, userName: true, commentCount: true },
  })
}

// ─── Services ───────────────────────────────────────

export interface AdminServiceListRow {
  id: string
  name: string
  slug: string
  category: string
  city: string
  status: string
  isVerified: boolean
  submittedAt: string | null
  phone: string
  email: string | null
  lat: number
  lng: number
  reviewNote: string | null
}

const SERVICE_SELECT = {
  id: true,
  name: true,
  slug: true,
  category: true,
  city: true,
  status: true,
  isVerified: true,
  submittedAt: true,
  phone: true,
  email: true,
  lat: true,
  lng: true,
  reviewNote: true,
} satisfies Prisma.EVServiceSelect

type ServiceRecord = Prisma.EVServiceGetPayload<{ select: typeof SERVICE_SELECT }>

function toServiceRow(row: ServiceRecord): AdminServiceListRow {
  return { ...row, submittedAt: row.submittedAt?.toISOString() ?? null }
}

/** Status and review note for the edit form, which EVService does not carry. */
export async function getServiceReviewState(id: string): Promise<{ status: string; reviewNote: string | null } | null> {
  return prisma.eVService.findUnique({ where: { id }, select: { status: true, reviewNote: true } })
}

/** The queue. Bounded, because a queue longer than this is a different problem. */
export async function listPendingServices(take = 50): Promise<{ rows: AdminServiceListRow[]; total: number }> {
  const [rows, total] = await Promise.all([
    prisma.eVService.findMany({
      where: { status: 'pending' },
      orderBy: [{ submittedAt: 'asc' }, { createdAt: 'asc' }],
      take,
      select: SERVICE_SELECT,
    }),
    prisma.eVService.count({ where: { status: 'pending' } }),
  ])
  return { rows: rows.map(toServiceRow), total }
}

export interface ServiceListing extends AdminPage<AdminServiceListRow> {
  cities: string[]
  counts: { approved: number; rejected: number }
}

/** The directory: everything already decided, filtered and paged. */
export async function listServicesPage(options: {
  q: string
  category: string
  city: string
  status: string
  page: number
}): Promise<ServiceListing> {
  const where: Prisma.EVServiceWhereInput = {
    status: options.status === 'approved' || options.status === 'rejected' ? options.status : { not: 'pending' },
    ...(options.category !== 'all' ? { category: options.category } : {}),
    ...(options.city !== 'all' ? { city: options.city } : {}),
    ...(options.q
      ? {
          OR: [
            { name: contains(options.q) },
            { slug: contains(options.q) },
            { city: contains(options.q) },
            { phone: contains(options.q) },
            { email: contains(options.q) },
          ],
        }
      : {}),
  }

  const [rows, total, cities, approved, rejected] = await Promise.all([
    prisma.eVService.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      ...pageWindow(options.page),
      select: SERVICE_SELECT,
    }),
    prisma.eVService.count({ where }),
    prisma.eVService.findMany({
      where: { status: { not: 'pending' } },
      distinct: ['city'],
      select: { city: true },
      orderBy: { city: 'asc' },
    }),
    prisma.eVService.count({ where: { status: 'approved' } }),
    prisma.eVService.count({ where: { status: 'rejected' } }),
  ])

  return {
    rows: rows.map(toServiceRow),
    total,
    page: options.page,
    pageSize: ADMIN_PAGE_SIZE,
    cities: cities.map((row) => row.city).filter(Boolean),
    counts: { approved, rejected },
  }
}

// ─── Reviews ────────────────────────────────────────

export interface AdminReviewRow {
  id: string
  rating: number
  comment: string
  userId: string
  userName: string
  userVehicle: string
  date: string
  listing: { kind: 'station' | 'business'; id: string; name: string; publicHref: string } | null
}

export interface ReviewListing extends AdminPage<AdminReviewRow> {
  /** Every listing that has at least one review, for the filter. */
  listings: { value: string; label: string; count: number }[]
}

/**
 * `listing` is `station:<id>` or `business:<id>`, so one select can filter by
 * either table without a second parameter that could disagree with it.
 */
export async function listReviewsPage(options: {
  q: string
  listing: string
  page: number
}): Promise<ReviewListing> {
  const [kind, listingId] = options.listing.split(':')
  const where: Prisma.ReviewWhereInput = {
    ...(kind === 'station' && listingId ? { stationId: listingId } : {}),
    ...(kind === 'business' && listingId ? { businessId: listingId } : {}),
    ...(options.q
      ? {
          OR: [
            { comment: contains(options.q) },
            { userName: contains(options.q) },
            { station: { name: contains(options.q) } },
            { business: { businessName: contains(options.q) } },
          ],
        }
      : {}),
  }

  const [rows, total, byStation, byBusiness] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { date: 'desc' },
      ...pageWindow(options.page),
      include: {
        station: { select: { id: true, name: true, slug: true } },
        business: { select: { id: true, businessName: true } },
      },
    }),
    prisma.review.count({ where }),
    prisma.review.groupBy({ by: ['stationId'], where: { stationId: { not: null } }, _count: { _all: true } }),
    prisma.review.groupBy({ by: ['businessId'], where: { businessId: { not: null } }, _count: { _all: true } }),
  ])

  const stationIds = byStation.map((row) => row.stationId).filter((id): id is string => Boolean(id))
  const businessIds = byBusiness.map((row) => row.businessId).filter((id): id is string => Boolean(id))
  const [stations, businesses] = await Promise.all([
    stationIds.length
      ? prisma.station.findMany({ where: { id: { in: stationIds } }, select: { id: true, name: true } })
      : [],
    businessIds.length
      ? prisma.business.findMany({ where: { id: { in: businessIds } }, select: { id: true, businessName: true } })
      : [],
  ])
  const stationName = new Map(stations.map((row) => [row.id, row.name]))
  const businessName = new Map(businesses.map((row) => [row.id, row.businessName]))

  const listings = [
    ...byStation.map((row) => ({
      value: `station:${row.stationId}`,
      label: `${stationName.get(row.stationId ?? '') ?? 'Unknown station'} (station)`,
      count: row._count._all,
    })),
    ...byBusiness.map((row) => ({
      value: `business:${row.businessId}`,
      label: `${businessName.get(row.businessId ?? '') ?? 'Unknown business'} (business)`,
      count: row._count._all,
    })),
  ].sort((a, b) => a.label.localeCompare(b.label))

  return {
    total,
    page: options.page,
    pageSize: ADMIN_PAGE_SIZE,
    listings,
    rows: rows.map((row) => ({
      id: row.id,
      rating: row.rating,
      comment: row.comment,
      userId: row.userId,
      userName: row.userName,
      userVehicle: row.userVehicle,
      date: row.date.toISOString(),
      listing: row.station
        ? { kind: 'station', id: row.station.id, name: row.station.name, publicHref: `/station/${row.station.slug}` }
        : row.business
          ? { kind: 'business', id: row.business.id, name: row.business.businessName, publicHref: `/station/${row.business.id}` }
          : null,
    })),
  }
}
