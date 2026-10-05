// src/lib/db/queries.ts
import 'server-only'

import { cache } from 'react'

import type { CommunityPost, EVClub, EVService, Station } from '@/lib/types'

/*
  The hero map's shapes and its fast/standard threshold live in lib/charging,
  not here. This module is `server-only`, and the markers that use them are
  drawn in a client component — importing the constant from here pulled the
  whole server module toward the browser and the build refused it, which is
  the guard working. Re-exported so callers already reaching for the query
  find the types beside it.
*/
export { FAST_CHARGER_KW } from '@/lib/charging'
export type { HeroMapPin, HeroStats, HowItWorksData, ShowcaseStation } from '@/lib/charging'

import type { HeroMapPin, HeroStats, HowItWorksData, ShowcaseStation } from '@/lib/charging'

import { businessToStation } from './business-to-station'
import { prisma } from './client'
import { countActiveMembers, listActiveMembershipIds } from './membership'
import {
  toConnector,
  toPost,
  toService,
  toStation,
  toVehicle,
  type DbVehicle,
  type OwnedVehicle,
} from './serialize'

/**
 * Read side of the data layer. Every function returns the same interfaces the
 * components consumed when this data lived in mock-data.ts, so swapping the
 * source was an import change rather than a rewrite.
 *
 * `server-only` at the top is load-bearing: it makes the build fail loudly if
 * any of this is ever imported into a Client Component, rather than quietly
 * trying to bundle Prisma — and the database URL — into the browser.
 */

// ─── Stations ───────────────────────────────────────

/**
 * How many reviews a station page loads.
 *
 * The rating itself is grouped in the database (stationRatings below), so this
 * only bounds the list a visitor scrolls — a popular station should not ship
 * every review it has ever had in one HTML payload.
 */
const STATION_REVIEW_PAGE = 100

export interface ListingRating {
  rating: number
  reviewCount: number
}

/**
 * A station's rating, worked out from its Review rows — never the stored
 * Station.rating / reviewCount columns.
 *
 * Those columns were typed in with the sample data (4.8 from 142 reviews, 4.9
 * from 176) and nothing has ever kept them in step with the reviews actually
 * written: the same stations hold three to five reviews each. A rating is only
 * honest if it is counted, so it is counted here, for many stations in one
 * grouped query rather than one per row.
 */
async function stationRatings(stationIds: string[]): Promise<Map<string, ListingRating>> {
  const out = new Map<string, ListingRating>()
  if (stationIds.length === 0) return out

  const rows = await prisma.review.groupBy({
    by: ['stationId'],
    where: { stationId: { in: stationIds } },
    _avg: { rating: true },
    _count: { _all: true },
  })
  for (const row of rows) {
    if (!row.stationId) continue
    out.set(row.stationId, {
      // One decimal place, the precision the star display actually shows.
      rating: Math.round((row._avg.rating ?? 0) * 10) / 10,
      reviewCount: row._count._all,
    })
  }
  return out
}

/** A station with its counted rating in place of the stored one. Zero when unreviewed. */
function withRating(station: Station, ratings: Map<string, ListingRating>): Station {
  const counted = ratings.get(station.id)
  return { ...station, rating: counted?.rating ?? 0, reviewCount: counted?.reviewCount ?? 0 }
}

export async function getStations(): Promise<Station[]> {
  const rows = await prisma.station.findMany({
    include: { connectors: true },
    orderBy: { createdAt: 'asc' },
  })
  const ratings = await stationRatings(rows.map((row) => row.id))
  return rows.map((row) => withRating(toStation(row), ratings))
}

/**
 * Everything a driver can charge at, shaped as Stations: the Station table plus
 * approved, placed business listings.
 *
 * The map and the route planner both read this on the server and hand it to
 * the client as a prop. The map used to draw MOCK_STATIONS from the bundle and
 * fetch the businesses separately, so an admin's edit to a station never
 * reached the map at all.
 */
export async function getMapStations(): Promise<Station[]> {
  const [stations, businesses] = await Promise.all([getStations(), getMappableBusinesses()])
  const ratings = await getBusinessRatings(businesses.map((business) => business.id))
  return [
    ...stations,
    ...businesses.map((business) => businessToStation(business, ratings[business.id])),
  ]
}

/**
 * A listing by slug, from either table.
 *
 * Falls back to an approved business when no station matches. Businesses have
 * been appearing as pins on the map since they were added to the feed, but the
 * detail page only ever looked at the Station table — so every one of those
 * pins led to a 404 when a driver tapped it. The map hands out the business id
 * as the slug, so the same URL resolves here.
 *
 * Wrapped in React's cache(): generateMetadata and the page both ask for the
 * same slug in one render, and without it that was two identical round trips
 * to a database a region away.
 */
export const getStationBySlug = cache(async (slug: string): Promise<Station | null> => {
  const row = await prisma.station.findUnique({
    where: { slug },
    include: {
      connectors: true,
      reviews: { orderBy: { date: 'desc' }, take: STATION_REVIEW_PAGE },
    },
  })
  if (row) return withRating(toStation(row), await stationRatings([row.id]))

  return getBusinessAsStation(slug)
})

export const getStationById = cache(async (id: string): Promise<Station | null> => {
  const row = await prisma.station.findUnique({
    where: { id },
    include: {
      connectors: true,
      reviews: { orderBy: { date: 'desc' }, take: STATION_REVIEW_PAGE },
    },
  })
  return row ? withRating(toStation(row), await stationRatings([row.id])) : null
})

/**
 * A few other stations to suggest under a station page: same city first, then
 * anywhere, three at most.
 *
 * This used to load every station in the country and filter in memory, on
 * every station page render. Two bounded queries now, the second only when the
 * city cannot fill the row by itself.
 */
export async function getRelatedStations(
  currentStationId: string,
  city: string,
  take = 3,
): Promise<Station[]> {
  const sameCity = await prisma.station.findMany({
    where: { city, id: { not: currentStationId } },
    include: { connectors: true },
    orderBy: { createdAt: 'asc' },
    take,
  })
  const others =
    sameCity.length >= take
      ? []
      : await prisma.station.findMany({
          where: { city: { not: city }, id: { not: currentStationId } },
          include: { connectors: true },
          orderBy: { createdAt: 'asc' },
          take: take - sameCity.length,
        })

  const rows = [...sameCity, ...others]
  const ratings = await stationRatings(rows.map((row) => row.id))
  return rows.map((row) => withRating(toStation(row), ratings))
}

/** Slugs only — for generateStaticParams, which needs nothing else. */
export async function getStationSlugs(): Promise<string[]> {
  const rows = await prisma.station.findMany({ select: { slug: true } })
  return rows.map((row) => row.slug)
}

// ─── Services ───────────────────────────────────────

/**
 * The public directory — approved listings only.
 *
 * Anyone can now apply to be listed, so this has to filter. Before the approval
 * gate existed every row was admin-created and therefore live by definition;
 * an unfiltered query today would publish an application the moment it was
 * submitted, which is the whole thing the gate prevents.
 *
 * Admin screens deliberately do NOT use this — see listServicesForAdmin, which
 * returns every status because reviewing them is its job.
 */
export async function getServices(): Promise<EVService[]> {
  const rows = await prisma.eVService.findMany({
    where: { status: 'approved' },
    orderBy: { name: 'asc' },
  })
  return rows.map(toService)
}

/** cache()d: the detail page's metadata and body ask for the same row in one render. */
export const getServiceBySlug = cache(async (
  category: string,
  slug: string,
): Promise<EVService | null> => {
  const row = await prisma.eVService.findUnique({ where: { slug } })
  // The URL carries both, so a mismatched pair is a 404 rather than a
  // redirect — otherwise /services/insurance/some-dealer would resolve.
  if (!row || row.category !== category) return null
  // An unapproved listing is a 404 on the public site, not a preview. Guessing
  // a slug should not be a way to read an application before it is reviewed.
  if (row.status !== 'approved') return null
  return toService(row)
})

export const getServiceById = cache(async (id: string): Promise<EVService | null> => {
  const row = await prisma.eVService.findUnique({ where: { id } })
  return row ? toService(row) : null
})

/** Static params for the public detail pages, so only approved ones prerender. */
export async function getServiceParams(): Promise<{ category: string; slug: string }[]> {
  const rows = await prisma.eVService.findMany({
    where: { status: 'approved' },
    select: { category: true, slug: true },
  })
  return rows
}

/**
 * Every service, whatever its status — the admin list.
 *
 * Deliberately separate from getServices(), which filters to approved. The
 * admin page used to call that one, and gating it without this would have made
 * pending applications invisible to the only person who can approve them.
 *
 * Pending first, because that is the work; the rest by name.
 */
export interface AdminServiceRow {
  id: string
  name: string
  slug: string
  category: string
  city: string
  status: string
  isVerified: boolean
  submittedAt: Date | null
  phone: string
  email: string | null
}

export async function listServicesForAdmin(): Promise<AdminServiceRow[]> {
  const rows = await prisma.eVService.findMany({
    orderBy: [{ status: 'asc' }, { name: 'asc' }],
    select: {
      id: true, name: true, slug: true, category: true, city: true,
      status: true, isVerified: true, submittedAt: true, phone: true, email: true,
    },
  })
  // 'pending' sorts before 'approved' and 'rejected' alphabetically, which is
  // the order wanted here — stated rather than left to look like a coincidence.
  return rows
}

// ─── Community ──────────────────────────────────────

export interface PostQuery {
  /** Page size. Defaults to DEFAULT_POST_PAGE. */
  take?: number
  /** The id of the last post on the previous page; that post is skipped. */
  cursor?: string
  /** One PostCategory, or omitted for every category. */
  category?: string
}

/**
 * The most posts one call returns when the caller does not ask for a page size.
 *
 * Calling getPosts() with no argument used to return the whole table, which is
 * fine at twelve posts and an outage at twelve thousand. The default keeps
 * every existing caller compiling and behaving the same at today's size, while
 * putting a ceiling on what one render can pull.
 */
export const DEFAULT_POST_PAGE = 100
const MAX_POST_PAGE = 200

function postWhereAndPage({ take, cursor, category }: PostQuery) {
  return {
    where: category ? { category } : undefined,
    orderBy: [{ createdAt: 'desc' as const }, { id: 'desc' as const }],
    take: Math.min(Math.max(1, take ?? DEFAULT_POST_PAGE), MAX_POST_PAGE),
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  }
}

/** Newest first. Pass `take` and `cursor` to page through; see getPostsPage. */
export async function getPosts(query: PostQuery = {}): Promise<CommunityPost[]> {
  const rows = await prisma.communityPost.findMany(postWhereAndPage(query))
  return rows.map(toPost)
}

/**
 * One page of posts and the cursor for the next, or null when this is the last.
 *
 * One extra row is fetched to know whether another page exists, rather than a
 * second count query.
 */
export async function getPostsPage(
  query: PostQuery = {},
): Promise<{ posts: CommunityPost[]; nextCursor: string | null }> {
  const page = postWhereAndPage(query)
  const rows = await prisma.communityPost.findMany({ ...page, take: page.take + 1 })
  const hasMore = rows.length > page.take
  const shown = hasMore ? rows.slice(0, page.take) : rows
  return {
    posts: shown.map(toPost),
    nextCursor: hasMore ? (shown[shown.length - 1]?.id ?? null) : null,
  }
}

export interface AdminCommunityPost {
  post: CommunityPost
  isNew: boolean
}

export async function getAdminCommunityPosts(): Promise<AdminCommunityPost[]> {
  const rows = await prisma.communityPost.findMany({ orderBy: { createdAt: 'desc' } })
  return rows.map((row) => ({ post: toPost(row), isNew: row.adminViewedAt === null }))
}

export async function markCommunityPostsViewed(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  await prisma.communityPost.updateMany({
    where: { id: { in: ids }, adminViewedAt: null },
    data: { adminViewedAt: new Date() },
  })
}

export async function getPostsByUser(userId: string): Promise<CommunityPost[]> {
  const rows = await prisma.communityPost.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
  return rows.map(toPost)
}

/**
 * How many comments a post page renders: the latest ones, shown oldest first.
 *
 * A thread that runs to thousands of replies should not put all of them into
 * one server render. Taking the newest and flipping them keeps the reading
 * order the page has always had.
 */
export const POST_COMMENT_PAGE = 100

const latestComments = {
  comments: { orderBy: { createdAt: 'desc' as const }, take: POST_COMMENT_PAGE },
}

/** cache()d: generateMetadata and the page both read the same post. */
export const getPostBySlug = cache(async (slug: string): Promise<CommunityPost | null> => {
  const row = await prisma.communityPost.findUnique({ where: { slug }, include: latestComments })
  return row ? toPost({ ...row, comments: [...row.comments].reverse() }) : null
})

export const getPostById = cache(async (id: string): Promise<CommunityPost | null> => {
  const row = await prisma.communityPost.findUnique({ where: { id }, include: latestComments })
  return row ? toPost({ ...row, comments: [...row.comments].reverse() }) : null
})

export async function getPostSlugs(): Promise<string[]> {
  const rows = await prisma.communityPost.findMany({ select: { slug: true } })
  return rows.map((row) => row.slug)
}

// ─── Admin overview ─────────────────────────────────

export interface ContentCounts {
  stations: number
  connectors: number
  reviews: number
  services: number
  posts: number
  comments: number
}

/** One round trip for the admin dashboard rather than six sequential ones. */
export async function getContentCounts(): Promise<ContentCounts> {
  const [stations, connectors, reviews, services, posts, comments] = await Promise.all([
    prisma.station.count(),
    prisma.connector.count(),
    prisma.review.count(),
    prisma.eVService.count(),
    prisma.communityPost.count(),
    prisma.comment.count(),
  ])
  return { stations, connectors, reviews, services, posts, comments }
}

// ─── Connectors ─────────────────────────────────────

export interface ConnectorWithStation {
  connector: import('@/lib/types').Connector
  stationId: string
  stationName: string
  stationSlug: string
  city: string
}

/**
 * Every connector on the network, with the station it belongs to.
 *
 * This is the operator's working view: ports free, power and price are the
 * numbers that change during a shift, and they live on the connector rather
 * than the station. Reading them station-by-station would mean opening six
 * pages to answer one question.
 */
export async function getConnectors(): Promise<ConnectorWithStation[]> {
  const rows = await prisma.connector.findMany({
    include: { station: { select: { id: true, name: true, slug: true, city: true } } },
    orderBy: [{ station: { name: 'asc' } }, { maxPowerKw: 'desc' }],
  })

  return rows.map((row) => ({
    connector: toConnector(row),
    stationId: row.station.id,
    stationName: row.station.name,
    stationSlug: row.station.slug,
    city: row.station.city,
  }))
}

export interface ConnectorDetail {
  connector: import('@/lib/types').Connector
  stationId: string
  stationName: string
}

export async function getConnectorById(id: string): Promise<ConnectorDetail | null> {
  const row = await prisma.connector.findUnique({
    where: { id },
    include: { station: { select: { id: true, name: true } } },
  })
  if (!row) return null

  return {
    connector: toConnector(row),
    stationId: row.station.id,
    stationName: row.station.name,
  }
}

/** Just enough to populate the station picker on the connector form. */
export async function getStationOptions(): Promise<{ id: string; name: string; city: string }[]> {
  return prisma.station.findMany({
    select: { id: true, name: true, city: true },
    orderBy: { name: 'asc' },
  })
}

// ─── Live platform stats ────────────────────────────

export interface PlatformStats {
  stations: number
  cities: number
  owners: number
}

/**
 * The figures shown on the homepage, counted from the database rather than
 * typed into a constant.
 *
 * These were hardcoded as 250 stations / 18 cities / 5,000 owners — numbers
 * that could never move and did not describe anything. Now adding a station
 * in the admin moves the first, adding one in a new city moves the second,
 * and a sign-up moves the third.
 *
 * Approved businesses count too. A listing that is on the map with chargers
 * at it is a charging point to the driver looking at it, whatever table it
 * happens to live in — counting only Station meant approving a business left
 * the headline figure unchanged, which read as the counter being broken.
 *
 * The same two conditions as the map feed: `approved`, and a real pin. An
 * unreviewed or unplaced listing is not visible to anyone, so counting it
 * would overstate what is actually out there.
 */

/**
 * The three figures beside the hero's search, and the counts on its city chips.
 *
 * ── Every one of these is counted, not chosen ─────────────────────────
 *
 * The design these came from showed 247 locations, 8 connector types and
 * 1,240+ reviews. Those are a mockup's numbers. Writing them in would put four
 * coverage claims on the first screen of the site that nothing in the database
 * supports — the exact fault that took "18 cities" out of this file, and the
 * reason the station importer exists rather than a generator.
 *
 * So the shape of the design is kept and the numbers are real. They are small,
 * because the platform is new. A figure that is allowed to be small is a figure
 * somebody can trust when it grows.
 */
export async function getHeroStats(): Promise<HeroStats> {
  const mappable = { status: 'approved', lat: { not: null }, lng: { not: null } } as const

  const [stations, partners, connectors, reviews, rating, cityRows, pinRows] = await Promise.all([
    prisma.station.count(),
    prisma.business.count({ where: mappable }),
    prisma.connector.findMany({ select: { type: true }, distinct: ['type'] }),
    prisma.review.count(),
    prisma.review.aggregate({ _avg: { rating: true } }),
    prisma.station.groupBy({ by: ['city'], _count: { _all: true } }),
    prisma.station.findMany({
      select: {
        slug: true,
        name: true,
        city: true,
        lat: true,
        lng: true,
        connectors: { select: { maxPowerKw: true, ports: true, availablePorts: true } },
      },
    }),
  ])

  const byCity: Record<string, number> = {}
  for (const row of cityRows) byCity[row.city] = row._count._all

  const pins: HeroMapPin[] = pinRows.map((row) => ({
    slug: row.slug,
    name: row.name,
    city: row.city,
    lat: row.lat,
    lng: row.lng,
    maxPowerKw: row.connectors.reduce((top, c) => Math.max(top, c.maxPowerKw), 0),
    ports: row.connectors.reduce((sum, c) => sum + c.ports, 0),
    availablePorts: row.connectors.reduce((sum, c) => sum + c.availablePorts, 0),
  }))

  return {
    locations: stations + partners,
    connectorTypes: connectors.length,
    reviews,
    rating: reviews > 0 ? (rating._avg.rating ?? null) : null,
    byCity,
    pins,
  }
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const mappable = {
    status: 'approved',
    lat: { not: null },
    lng: { not: null },
  } as const

  const [stations, stationCities, partners, partnerCities, owners] = await Promise.all([
    prisma.station.count(),
    prisma.station.findMany({ select: { city: true }, distinct: ['city'] }),
    prisma.business.count({ where: mappable }),
    prisma.business.findMany({ where: mappable, select: { city: true }, distinct: ['city'] }),
    prisma.user.count(),
  ])

  // Union, not a sum: a business in a city that already has a station must not
  // count that city twice.
  const cities = new Set<string>()
  for (const row of stationCities) cities.add(row.city)
  for (const row of partnerCities) cities.add(row.city)

  return { stations: stations + partners, cities: cities.size, owners }
}

// ─── Meeting requests ───────────────────────────────

export interface MeetingRow {
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

/** New requests first, then handled ones, newest within each group. */
export async function getMeetingRequests(): Promise<MeetingRow[]> {
  const rows = await prisma.meetingRequest.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  })

  return rows.map((row) => ({
    ...row,
    // A Prisma Date cannot cross into a Server Component payload unserialised.
    createdAt: row.createdAt.toISOString(),
  }))
}

export async function getNewMeetingCount(): Promise<number> {
  return prisma.meetingRequest.count({ where: { status: 'new' } })
}

// ─── Business applications ──────────────────────────

export interface BusinessCharger {
  connectorType: string
  maxPowerKw: number
  ports: number
  /** Path to an uploaded photo, e.g. /uploads/chargers/<id>.jpg. */
  photo?: string
  photoLabel?: 'charger' | 'port' | 'location' | 'signage'
  photoStatus?: 'pending' | 'approved' | 'needs-better-photo'
  portPhoto?: string
  portPhotoStatus?: 'pending' | 'approved' | 'needs-better-photo'
}

export interface BusinessRow {
  id: string
  ownerName: string
  email: string
  phone: string | null
  businessName: string
  businessType: string
  city: string
  address: string | null
  website: string | null
  description: string | null
  lat: number | null
  lng: number | null
  chargers: BusinessCharger[]
  status: string
  /** Set when the listing was submitted through the public form. */
  userId: string | null
  createdAt: string
}

export async function getBusinesses(): Promise<BusinessRow[]> {
  const rows = await prisma.business.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  })

  return rows.map((row) => {
    // The column is a JSON string. A malformed one should cost this business
    // its charger list, not take down the whole admin page.
    let chargers: BusinessCharger[] = []
    try {
      const parsed: unknown = JSON.parse(row.chargers)
      if (Array.isArray(parsed)) chargers = parsed as BusinessCharger[]
    } catch {
      chargers = []
    }

    return {
      ...row,
      chargers,
      // A Prisma Date cannot cross into a Server Component payload unserialised.
      createdAt: row.createdAt.toISOString(),
    }
  })
}

export async function getBusinessById(id: string): Promise<BusinessRow | null> {
  const row = await prisma.business.findUnique({ where: { id } })
  if (!row) return null

  let chargers: BusinessCharger[] = []
  try {
    const parsed: unknown = JSON.parse(row.chargers)
    if (Array.isArray(parsed)) chargers = parsed as BusinessCharger[]
  } catch {
    chargers = []
  }

  return { ...row, chargers, createdAt: row.createdAt.toISOString() }
}

/** Every listing belonging to one account, newest first. */
export async function getBusinessesForUser(userId: string): Promise<BusinessRow[]> {
  const rows = await prisma.business.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  return rows.map((row) => {
    let chargers: BusinessCharger[] = []
    try {
      const parsed: unknown = JSON.parse(row.chargers)
      if (Array.isArray(parsed)) chargers = parsed as BusinessCharger[]
    } catch {
      chargers = []
    }
    return { ...row, chargers, createdAt: row.createdAt.toISOString() }
  })
}

export interface BusinessPhotoReportRow {
  id: string
  businessId: string
  businessName: string
  photoUrl: string
  reason: string
  status: string
  createdAt: string
}

export async function getBusinessPhotoReports(): Promise<BusinessPhotoReportRow[]> {
  const rows = await prisma.businessPhotoReport.findMany({
    where: { status: 'new' },
    include: { business: { select: { businessName: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return rows.map((row) => ({
    id: row.id,
    businessId: row.businessId,
    businessName: row.business.businessName,
    photoUrl: row.photoUrl,
    reason: row.reason,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  }))
}

export async function getPendingBusinessCount(): Promise<number> {
  return prisma.business.count({ where: { status: 'pending' } })
}

/**
 * Approved businesses that have a pin, shaped for the public map.
 *
 * Two filters, both deliberate. `approved` keeps unreviewed submissions off
 * the map — otherwise anyone could drop a marker anywhere by filling in a
 * form. The coordinate check keeps out records that were approved before a
 * location was set, which would otherwise be silently missing rather than
 * visibly wrong.
 */
export async function getMappableBusinesses({ take = MAX_MAP_BUSINESSES }: { take?: number } = {}): Promise<BusinessRow[]> {
  /*
    Only what a pin, a card and the partners page render. The owner's name and
    email are not selected at all: this feed is shaped into Stations and sent to
    every visitor's browser, and a field that is never read cannot leak. They
    come back as empty strings so the shared BusinessRow shape still holds —
    businessToStation never reads them.
  */
  const rows = await prisma.business.findMany({
    where: { status: 'approved', lat: { not: null }, lng: { not: null } },
    orderBy: { createdAt: 'desc' },
    take: Math.min(Math.max(1, take), MAX_MAP_BUSINESSES),
    select: {
      id: true,
      userId: true,
      phone: true,
      businessName: true,
      businessType: true,
      city: true,
      address: true,
      website: true,
      description: true,
      lat: true,
      lng: true,
      chargers: true,
      status: true,
      createdAt: true,
    },
  })

  return rows.map((row) => {
    let chargers: BusinessCharger[] = []
    try {
      const parsed: unknown = JSON.parse(row.chargers)
      if (Array.isArray(parsed)) chargers = parsed as BusinessCharger[]
    } catch {
      chargers = []
    }
    return { ...row, ownerName: '', email: '', chargers, createdAt: row.createdAt.toISOString() }
  })
}

/**
 * A ceiling, not a page size. The map has to show every approved listing to be
 * a map, so this is set far above anything the platform holds; it exists so a
 * runaway import cannot make one request serialise an unbounded table into
 * every visitor's HTML.
 */
const MAX_MAP_BUSINESSES = 2000

// ─── Business ratings, reviews and analytics ────────────

/**
 * Average rating and review count for many listings at once.
 *
 * Grouped in a single query rather than one per business: the map feed asks for
 * every approved listing, and a per-row query there would add one round trip
 * per pin.
 */
export async function getBusinessRatings(
  businessIds: string[],
): Promise<Record<string, { rating: number; reviewCount: number }>> {
  if (businessIds.length === 0) return {}

  const rows = await prisma.review.groupBy({
    by: ['businessId'],
    where: { businessId: { in: businessIds } },
    _avg: { rating: true },
    _count: { _all: true },
  })

  const out: Record<string, { rating: number; reviewCount: number }> = {}
  for (const row of rows) {
    if (!row.businessId) continue
    out[row.businessId] = {
      // One decimal place, the precision the star display actually shows.
      rating: Math.round((row._avg.rating ?? 0) * 10) / 10,
      reviewCount: row._count._all,
    }
  }
  return out
}

export interface BusinessReviewRow {
  id: string
  userName: string
  userAvatar: string | null
  rating: number
  comment: string
  date: string
  helpfulCount: number
}

/**
 * Newest first, at most `take` (100 by default — the same page a station gets).
 * The listing's rating comes from getBusinessRatings, grouped in the database,
 * so bounding this list never changes the score shown beside it.
 */
export async function getReviewsForBusiness(
  businessId: string,
  { take = 100 }: { take?: number } = {},
): Promise<BusinessReviewRow[]> {
  const rows = await prisma.review.findMany({
    where: { businessId },
    orderBy: { date: 'desc' },
    take: Math.min(Math.max(1, take), 500),
  })

  return rows.map((row) => ({
    id: row.id,
    userName: row.userName,
    userAvatar: row.userAvatar,
    rating: row.rating,
    comment: row.comment,
    date: row.date.toISOString(),
    helpfulCount: row.helpfulCount,
  }))
}

/** One approved listing with a pin, or null. Used by the public detail page. */
export async function getApprovedBusiness(id: string): Promise<BusinessRow | null> {
  const row = await prisma.business.findFirst({
    where: { id, status: 'approved', lat: { not: null }, lng: { not: null } },
  })
  if (!row) return null

  let chargers: BusinessCharger[] = []
  try {
    const parsed: unknown = JSON.parse(row.chargers)
    if (Array.isArray(parsed)) chargers = parsed as BusinessCharger[]
  } catch {
    chargers = []
  }

  return { ...row, chargers, createdAt: row.createdAt.toISOString() }
}

export interface BusinessStatsPeriod {
  profileViews: number
  navigateClicks: number
  reviewsReceived: number
  avgRating: number
}

export interface BusinessAnalyticsData {
  thisMonth: BusinessStatsPeriod
  lastMonth: BusinessStatsPeriod
  chartData: { date: string; views: number; clicks: number }[]
}

function karachiToday(): Date {
  // The calendar day in Pakistan, as a Date at UTC midnight, so day arithmetic
  // below never crosses a boundary because the server happens to sit in a
  // different zone.
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  return new Date(`${parts}T00:00:00Z`)
}

const DAY_MS = 24 * 60 * 60 * 1000
const dayKey = (date: Date): string => date.toISOString().slice(0, 10)

/**
 * Real counts for the owner's analytics page.
 *
 * Every figure here is read from BusinessDailyStat and Review — rows written by
 * actual visits and actual reviews. A listing nobody has opened reports zero,
 * which is the correct answer and the one the page used to refuse to give.
 *
 * "This month" means the last 30 days rather than the calendar month, so the
 * comparison against the previous 30 is like for like on any date.
 */
export async function getBusinessAnalytics(businessId: string): Promise<BusinessAnalyticsData> {
  const today = karachiToday()
  const windowStart = new Date(today.getTime() - 59 * DAY_MS)

  const [stats, reviews] = await Promise.all([
    prisma.businessDailyStat.findMany({
      where: { businessId, day: { gte: dayKey(windowStart) } },
    }),
    prisma.review.findMany({
      where: { businessId },
      select: { rating: true, date: true },
    }),
  ])

  const byDay = new Map(stats.map((row) => [row.day, row]))

  // Every day in the window is emitted, including the ones with no row at all.
  // Charting only the days that happen to have data would draw a flat line
  // across a quiet week and imply traffic that was never there.
  const chartData: { date: string; views: number; clicks: number }[] = []
  for (let index = 0; index < 60; index++) {
    const date = dayKey(new Date(windowStart.getTime() + index * DAY_MS))
    const row = byDay.get(date)
    chartData.push({ date, views: row?.views ?? 0, clicks: row?.clicks ?? 0 })
  }

  const recent = chartData.slice(30)
  const previous = chartData.slice(0, 30)
  const sum = (rows: typeof chartData, key: 'views' | 'clicks'): number =>
    rows.reduce((total, row) => total + row[key], 0)

  const period = (rows: typeof chartData, from: Date, to: Date): BusinessStatsPeriod => {
    const inRange = reviews.filter((review) => review.date >= from && review.date < to)
    const average =
      inRange.length === 0
        ? 0
        : Math.round((inRange.reduce((total, r) => total + r.rating, 0) / inRange.length) * 10) / 10

    return {
      profileViews: sum(rows, 'views'),
      navigateClicks: sum(rows, 'clicks'),
      reviewsReceived: inRange.length,
      avgRating: average,
    }
  }

  const thisFrom = new Date(today.getTime() - 29 * DAY_MS)
  const lastFrom = new Date(today.getTime() - 59 * DAY_MS)

  return {
    thisMonth: period(recent, thisFrom, new Date(today.getTime() + DAY_MS)),
    lastMonth: period(previous, lastFrom, thisFrom),
    chartData,
  }
}

/**
 * An approved business rendered as a full Station, reviews included.
 *
 * Kept next to the other business reads rather than inside getStationBySlug so
 * the fallback there stays one line, and so the public listing page can ask for
 * a business directly when it already knows that is what it wants.
 */
export const getBusinessAsStation = cache(async (id: string): Promise<Station | null> => {
  const business = await getApprovedBusiness(id)
  if (!business) return null

  const [ratings, reviews] = await Promise.all([
    getBusinessRatings([business.id]),
    getReviewsForBusiness(business.id),
  ])

  const station = businessToStation(business, ratings[business.id])

  return {
    ...station,
    reviews: reviews.map((review) => ({
      id: review.id,
      stationId: business.id,
      userId: '',
      userName: review.userName,
      userAvatar: review.userAvatar ?? undefined,
      // Businesses are reviewed by anyone who visits, and the review form does
      // not ask what they drive. Left empty rather than filled with a guess.
      userVehicle: '',
      rating: review.rating,
      comment: review.comment,
      photos: [],
      date: review.date,
      helpfulCount: review.helpfulCount,
      isVerified: false,
    })),
  }
})

// ─── A signed-in person's own data ──────────────────────

/**
 * The listings someone has saved, resolved to full Station objects.
 *
 * Saved rows hold a bare id because the map carries both stations and business
 * listings. Anything that no longer resolves — a station deleted, a business
 * un-approved — is dropped rather than rendered as a broken card.
 */
export async function getSavedStationsForUser(userId: string): Promise<Station[]> {
  const rows = await prisma.savedStation.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
  if (rows.length === 0) return []

  /*
    Batched: one query per table and one per kind of rating, however many
    bookmarks there are. This used to resolve each saved id on its own — up to
    four round trips per bookmark — and then fall back to MOCK_STATIONS for any
    id the database did not know. The map reads the database now, so a bookmark
    can only ever point at a database row, and the fallback could only resurrect
    a listing that has since been removed.
  */
  const ids = rows.map((row) => row.listingId)
  const [stationRows, businessRows] = await Promise.all([
    prisma.station.findMany({ where: { id: { in: ids } }, include: { connectors: true } }),
    prisma.business.findMany({
      where: { id: { in: ids }, status: 'approved', lat: { not: null }, lng: { not: null } },
    }),
  ])
  const [ratings, businessRatings] = await Promise.all([
    stationRatings(stationRows.map((row) => row.id)),
    getBusinessRatings(businessRows.map((row) => row.id)),
  ])

  const byId = new Map<string, Station>()
  for (const row of stationRows) byId.set(row.id, withRating(toStation(row), ratings))
  for (const row of businessRows) {
    byId.set(
      row.id,
      businessToStation(
        { ...row, chargers: parseChargers(row.chargers), createdAt: row.createdAt.toISOString() },
        businessRatings[row.id],
      ),
    )
  }

  // In the order they were saved, newest first; anything gone is dropped.
  return ids.map((id) => byId.get(id)).filter((station): station is Station => station !== undefined)
}

/** The chargers column, parsed. A malformed one costs the listing its chargers, not the page. */
function parseChargers(value: string): BusinessCharger[] {
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? (parsed as BusinessCharger[]) : []
  } catch {
    return []
  }
}

/**
 * A listing by its id, from either table.
 *
 * Deliberately by id and not by slug. A bookmark stores `station.id`, and a
 * station's id and slug are different values — resolving the saved id through
 * the slug lookup found nothing, so saved rows existed in the table and the
 * page still showed none. Business listings use the same value for both, which
 * is exactly why that mistake stayed invisible on the listings I tested first.
 */
export async function getListingById(id: string): Promise<Station | null> {
  const station = await getStationById(id)
  if (station) return station

  return getBusinessAsStation(id)
}

export interface MyReviewRow {
  id: string
  listingId: string
  listingName: string
  rating: number
  comment: string
  date: string
  helpfulCount: number
}

/**
 * Reviews written by this account, across both kinds of listing.
 *
 * The dashboard used to show MOCK_USER_REVIEWS — someone else's writing, on
 * every account that opened the page.
 */
export async function getReviewsByUser(userId: string): Promise<MyReviewRow[]> {
  const rows = await prisma.review.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    include: {
      station: { select: { id: true, slug: true, name: true } },
      business: { select: { id: true, businessName: true } },
    },
  })

  return rows.map((row) => ({
    id: row.id,
    listingId: row.station?.slug ?? row.business?.id ?? '',
    listingName: row.station?.name ?? row.business?.businessName ?? 'A listing that has since gone',
    rating: row.rating,
    comment: row.comment,
    date: row.date.toISOString(),
    helpfulCount: row.helpfulCount,
  }))
}

export interface DashboardShell {
  user: { name: string; email: string; city?: string; joinedAt: string; avatar?: string | null }
  stats: { totalSaved: number; totalReviews: number; totalRoutes: number; memberDays: number }
}

/**
 * The header and sidebar figures, counted for one account.
 *
 * Every dashboard page needs the same shell, and each one is gated separately,
 * so this is the single place those counts are worked out. `totalRoutes` is
 * zero because nothing stores a planned route yet — reporting anything else
 * would be inventing a number, which is what this whole page used to do.
 */
export async function getDashboardShell(profile: {
  id: string
  name: string
  email: string
  city: string | null
  avatar?: string | null
  createdAt: string
}): Promise<DashboardShell> {
  const [totalSaved, totalReviews, totalRoutes] = await Promise.all([
    prisma.savedStation.count({ where: { userId: profile.id } }),
    prisma.review.count({ where: { userId: profile.id } }),
    prisma.savedRoute.count({ where: { userId: profile.id } }),
  ])

  const joined = new Date(profile.createdAt)
  const memberDays = Math.max(
    0,
    Math.floor((Date.now() - joined.getTime()) / (24 * 60 * 60 * 1000)),
  )

  return {
    user: {
      name: profile.name,
      email: profile.email,
      city: profile.city ?? undefined,
      joinedAt: profile.createdAt,
      avatar: profile.avatar ?? null,
    },
    stats: { totalSaved, totalReviews, totalRoutes, memberDays },
  }
}

// ─── Members ────────────────────────────────────────────

export interface MemberRow {
  id: string
  name: string
  email: string
  city: string | null
  vehicle: string | null
  joinedAt: string
  /** Listings submitted from this account. */
  businessCount: number
  reviewCount: number
  savedCount: number
  /** Cars on the account, from UserVehicle. Not the free-text `vehicle` field. */
  vehicleCount: number
  /** Posts written from this account, matched on CommunityPost.userId. */
  postCount: number
  /** Whether this account may use the admin portal. */
  isAdmin: boolean
}

/**
 * Everyone who has registered.
 *
 * The counts come back with the list rather than per row on the page: a member
 * list is the one screen certain to grow, and one query per member is how a
 * list view quietly becomes slow at a few hundred rows.
 *
 * They are also what makes deletion safe to judge. Removing an account that
 * owns a live business listing is a different decision from removing one that
 * has done nothing, and the person deciding should be able to see which is
 * which without opening every profile.
 */
export async function getMembers(): Promise<MemberRow[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
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
  })
  if (users.length === 0) return []

  // Reviews carry a plain userId with no relation, so their counts are grouped
  // separately rather than included above.
  const reviewCounts = await prisma.review.groupBy({
    by: ['userId'],
    where: { userId: { in: users.map((user) => user.id) } },
    _count: { _all: true },
  })
  const reviewsById = new Map(reviewCounts.map((row) => [row.userId, row._count._all]))

  // CommunityPost carries a plain userId for the same reason Review does, so
  // its counts are grouped the same way rather than joined.
  const postCounts = await prisma.communityPost.groupBy({
    by: ['userId'],
    where: { userId: { in: users.map((user) => user.id) } },
    _count: { _all: true },
  })
  const postsById = new Map(postCounts.map((row) => [row.userId, row._count._all]))

  return users.map((user) => ({
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
  }))
}

export interface MemberDetail extends MemberRow {
  businesses: { id: string; name: string; status: string; city: string }[]
  reviews: MyReviewRow[]
  saved: { id: string; name: string }[]
  /**
   * The cars on the account.
   *
   * UserVehicle has always related a User to a Vehicle, and this page never
   * read it — the profile showed the free-text `vehicle` string instead, which
   * is what somebody typed at sign-up rather than what they actually drive.
   * Both are shown now, because they answer different questions.
   */
  vehicles: {
    id: string
    name: string
    customName: string | null
    color: string | null
    isDefault: boolean
    addedAt: string
  }[]
  /** Posts written from this account. Same rows the public community renders. */
  posts: { id: string; title: string; slug: string; commentCount: number; createdAt: string }[]
}

/** One member with everything held against them. Null when the id is unknown. */
export async function getMemberById(id: string): Promise<MemberDetail | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      city: true,
      vehicle: true,
      isAdmin: true,
      createdAt: true,
      businesses: {
        select: { id: true, businessName: true, status: true, city: true },
        orderBy: { createdAt: 'desc' },
      },
      /*
        The cars actually on the account. This relation has existed since
        UserVehicle was added and nothing read it here, so the profile showed
        only the free-text `vehicle` string from sign-up.
      */
      vehicles: {
        select: {
          id: true,
          customName: true,
          color: true,
          isDefault: true,
          createdAt: true,
          // Vehicle names the manufacturer `brand`, not `make`.
          vehicle: { select: { brand: true, model: true, modelYear: true } },
        },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      },
    },
  })
  if (!user) return null

  const [reviews, saved, posts] = await Promise.all([
    getReviewsByUser(id),
    getSavedStationsForUser(id),
    // The same rows the public community renders, filtered to this account.
    prisma.communityPost.findMany({
      where: { userId: id },
      select: { id: true, title: true, slug: true, commentCount: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    city: user.city,
    vehicle: user.vehicle,
    joinedAt: user.createdAt.toISOString(),
    businessCount: user.businesses.length,
    reviewCount: reviews.length,
    savedCount: saved.length,
    vehicleCount: user.vehicles.length,
    postCount: posts.length,
    isAdmin: user.isAdmin,
    vehicles: user.vehicles.map((row) => ({
      id: row.id,
      name: [row.vehicle.brand, row.vehicle.model, row.vehicle.modelYear]
        .filter(Boolean)
        .join(' '),
      customName: row.customName,
      color: row.color,
      isDefault: row.isDefault,
      addedAt: row.createdAt.toISOString(),
    })),
    posts: posts.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      commentCount: row.commentCount,
      createdAt: row.createdAt.toISOString(),
    })),
    businesses: user.businesses.map((row) => ({
      id: row.id,
      name: row.businessName,
      status: row.status,
      city: row.city,
    })),
    reviews,
    saved: saved.map((station) => ({ id: station.id, name: station.name })),
  }
}

export async function getMemberCount(): Promise<number> {
  return prisma.user.count()
}

// ─── Partners ───────────────────────────────────────────

export interface PartnerRow {
  id: string
  name: string
  /** hotel | restaurant | mall | office | dealership | service-center | home */
  type: string
  city: string
  address: string | null
  description: string | null
  website: string | null
  phone: string | null
  /** First charger photo, if the owner uploaded one. */
  photo: string | null
  chargerCount: number
  portCount: number
  connectorTypes: string[]
  maxPowerKw: number
  rating: number
  reviewCount: number
  joinedAt: string
}

/**
 * The businesses and homes sharing their chargers, for the public partners page.
 *
 * Same two conditions as the map feed and the homepage counter — approved, and
 * a real pin. A listing failing either is not visible to drivers anywhere else,
 * so presenting it here as a partner would be claiming a presence that does not
 * exist.
 */
export async function getPartners(): Promise<PartnerRow[]> {
  const businesses = await getMappableBusinesses()
  if (businesses.length === 0) return []

  const ratings = await getBusinessRatings(businesses.map((business) => business.id))

  return businesses.map((business) => {
    const chargers = business.chargers
    const rating = ratings[business.id]

    return {
      id: business.id,
      name: business.businessName,
      type: business.businessType,
      city: business.city,
      address: business.address,
      description: business.description,
      website: business.website,
      phone: business.phone,
      photo: chargers.find((charger) => charger.photo)?.photo ?? null,
      chargerCount: chargers.length,
      portCount: chargers.reduce((total, charger) => total + (charger.ports || 0), 0),
      // De-duplicated: a venue with three Type2 units offers one connector
      // type, and listing it three times tells a driver nothing.
      connectorTypes: [...new Set(chargers.map((charger) => charger.connectorType))],
      maxPowerKw: chargers.reduce(
        (fastest, charger) => Math.max(fastest, charger.maxPowerKw || 0),
        0,
      ),
      rating: rating?.rating ?? 0,
      reviewCount: rating?.reviewCount ?? 0,
      joinedAt: business.createdAt,
    }
  })
}

/**
 * How many services exist in each category.
 *
 * The homepage preview showed hardcoded figures — 24 dealerships, 38 service
 * centres, 45 accessory shops, 140-odd in total — against a table holding
 * twelve. Grouped in one query rather than six counts, and returned as a plain
 * record so a category with nothing in it reads as absent rather than as a
 * zero somebody has to interpret.
 */
export async function getServiceCategoryCounts(): Promise<Record<string, number>> {
  // Approved only, matching what the directory actually shows. A pending
  // application must not inflate the figure on the home page.
  const rows = await prisma.eVService.groupBy({
    by: ['category'],
    where: { status: 'approved' },
    _count: { _all: true },
  })

  const out: Record<string, number> = {}
  for (const row of rows) out[row.category] = row._count._all
  return out
}

// ─── Vehicles ───────────────────────────────────────

/**
 * The vehicle catalogue, from the database.
 *
 * Mirrors the helpers in src/lib/vehicles.ts, which read the static module.
 * Both exist on purpose: the module is what the seed is built from and what a
 * Client Component can import, and these are what pages read so a car added by
 * an admin appears without a deploy. Same `Vehicle` shape either way, so a
 * caller swaps one for the other with an import change.
 */
export async function getVehicles(): Promise<DbVehicle[]> {
  const rows = await prisma.vehicle.findMany({
    orderBy: [{ brand: 'asc' }, { model: 'asc' }],
  })
  return rows.map(toVehicle)
}

export const getVehicleById = cache(async (id: string): Promise<DbVehicle | null> => {
  const row = await prisma.vehicle.findUnique({ where: { id } })
  return row ? toVehicle(row) : null
})

export async function getVehiclesByBrand(brand: string): Promise<DbVehicle[]> {
  const rows = await prisma.vehicle.findMany({
    where: { brand },
    orderBy: { model: 'asc' },
  })
  return rows.map(toVehicle)
}

/**
 * Search, in the database rather than over a loaded array.
 *
 * Every term must match, so "bmw suv" narrows instead of widening.
 *
 * `mode: 'insensitive'` is required here and was previously forbidden. On
 * SQLite it throws — the provider does not support the option — and it was not
 * needed either, because SQLite's LIKE is already case-insensitive for ASCII.
 * Postgres is the other way round on both counts: the option is supported, and
 * without it `contains` is case-sensitive, so a search for "byd" would stop
 * matching "BYD" and a search for "SUV" would stop matching "Suv".
 *
 * That is the kind of difference that survives a build and a smoke test and
 * only shows up as "search is broken" once somebody types a lowercase brand.
 */
export async function searchVehicles(query: string): Promise<DbVehicle[]> {
  const terms = query.trim().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return getVehicles()

  const rows = await prisma.vehicle.findMany({
    where: {
      AND: terms.map((term) => ({
        OR: [
          { brand: { contains: term, mode: 'insensitive' } },
          { model: { contains: term, mode: 'insensitive' } },
          { powertrain: { contains: term, mode: 'insensitive' } },
          { availability: { contains: term, mode: 'insensitive' } },
          { bodyType: { contains: term, mode: 'insensitive' } },
        ],
      })),
    },
    orderBy: [{ brand: 'asc' }, { model: 'asc' }],
  })
  return rows.map(toVehicle)
}

/** Totals for the catalogue page, counted rather than written down. */
export async function getVehicleStats(): Promise<{
  vehicles: number
  brands: number
  official: number
  electric: number
  withSpecs: number
}> {
  const [vehicles, official, electric, withSpecs, brands] = await Promise.all([
    prisma.vehicle.count(),
    prisma.vehicle.count({ where: { availability: 'official' } }),
    prisma.vehicle.count({ where: { powertrain: 'BEV' } }),
    prisma.vehicle.count({ where: { rangeKm: { not: null } } }),
    prisma.vehicle.groupBy({ by: ['brand'] }),
  ])

  return { vehicles, brands: brands.length, official, electric, withSpecs }
}

/** The cars one driver has added. */
export async function getUserVehicles(userId: string): Promise<OwnedVehicle[]> {
  const rows = await prisma.userVehicle.findMany({
    where: { userId },
    include: { vehicle: true },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  })

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    vehicle: toVehicle(row.vehicle),
    customName: row.customName ?? undefined,
    color: row.color ?? undefined,
    licensePlate: row.licensePlate ?? undefined,
    isDefault: row.isDefault,
  }))
}

// ─── Clubs ──────────────────────────────────────────

/**
 * Owners' clubs.
 *
 * memberCount is the stored baseline plus active memberships. Those seeded
 * totals are historical — they predate any join table — so counting rows alone
 * would show every club dropping to zero the moment this shipped.
 *
 * `userId` is optional: pass it and each club reports whether that driver has
 * joined, which is what the Join button needs to render its own state. Leave it
 * out on a cached page — reading the session would make that page dynamic, and
 * the homepage rail is a preview rather than a place to join from.
 *
 * ── Reads Membership, not ClubMember ──────────────────────────────────
 *
 * Membership is the only thing that decides who is in a club from Phase 1
 * onward, because it is the only one that knows whether the payment behind a
 * join was ever confirmed. ClubMember still exists and is still empty; it is
 * read by nothing now, and a later phase can drop it.
 *
 * Three queries rather than one include, because Membership has no relation to
 * Club — `scopeId` is a plain column so the same table can hold a community
 * membership later. Two of the three are grouped or filtered in the database
 * and neither grows with the number of clubs on the page.
 */
export async function getClubs(userId?: string): Promise<EVClub[]> {
  const [rows, memberCounts, joined] = await Promise.all([
    prisma.club.findMany({ orderBy: { memberCount: 'desc' } }),
    countActiveMembers('club'),
    listActiveMembershipIds(userId, 'club'),
  ])

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    city: row.city,
    description: row.description,
    coverPhoto: row.coverPhoto ?? undefined,
    memberCount: row.memberCount + (memberCounts.get(row.id) ?? 0),
    isJoined: joined.has(row.id),
  }))
}

// ─── Community figures ───────────────────────────────

export interface CommunityCounts {
  /** Posts in the feed. */
  discussions: number
  /** Replies across every post. */
  replies: number
  /** Clubs in the directory. */
  clubs: number
  /** Cities with at least one club. */
  cities: number
  /** Members across every club, as the clubs themselves report it. */
  clubMembers: number
}

/**
 * The community's real figures, counted.
 *
 * This exists because the home page was still printing "5,000+ Active EV
 * Owners / 1,200+ Discussions / 450+ Trip Reports / 18 Cities Active" from a
 * hardcoded const, against a database holding no registered users, twelve
 * posts and eight cities — overstating by roughly a hundred times. The
 * /community page had already been moved onto counted figures; the home page's
 * copy of them had not, so the two pages contradicted each other as well as the
 * data.
 *
 * Same shape and same counting rules as CommunityStats on /community, so the
 * two agree by construction rather than by somebody remembering to update both.
 */
export async function getCommunityCounts(): Promise<CommunityCounts> {
  const [discussions, replies, clubs] = await Promise.all([
    prisma.communityPost.count(),
    prisma.comment.count(),
    prisma.club.findMany({ select: { city: true, memberCount: true } }),
  ])

  return {
    discussions,
    replies,
    clubs: clubs.length,
    cities: new Set(clubs.map((club) => club.city)).size,
    clubMembers: clubs.reduce((sum, club) => sum + club.memberCount, 0),
  }
}

/**
 * The station for the "how it works" phones: most-reviewed, ties broken by
 * the higher average. Its two reviews are verified, highest-rated first, and
 * the shorter of equals first, because they are read on a phone-sized card.
 * Returns null when no station has a review yet, and the carousel falls back to
 * a photograph for those two steps.
 */
export async function getShowcaseStation(): Promise<ShowcaseStation | null> {
  const groups = await prisma.review.groupBy({
    by: ['stationId'],
    where: { stationId: { not: null } },
    _avg: { rating: true },
    _count: { _all: true },
  })
  const top = groups
    .filter((g) => g.stationId)
    .sort((a, b) => b._count._all - a._count._all || (b._avg.rating ?? 0) - (a._avg.rating ?? 0))[0]
  if (!top?.stationId) return null

  const [station, reviews] = await Promise.all([
    prisma.station.findUnique({ where: { id: top.stationId }, select: { slug: true, name: true, city: true } }),
    prisma.review.findMany({
      where: { stationId: top.stationId },
      select: { userName: true, userVehicle: true, rating: true, comment: true, date: true, isVerified: true },
    }),
  ])
  if (!station) return null

  const breakdown: ShowcaseStation['breakdown'] = [0, 0, 0, 0, 0]
  for (const r of reviews) breakdown[5 - Math.min(5, Math.max(1, r.rating))]! += 1

  const picked = reviews
    .filter((r) => r.isVerified)
    .sort((a, b) => b.rating - a.rating || a.comment.length - b.comment.length)
    .slice(0, 2)

  return {
    slug: station.slug,
    name: station.name,
    city: station.city,
    rating: top._avg.rating ?? 0,
    reviewCount: top._count._all,
    breakdown,
    reviews: picked.map((r) => ({
      userName: r.userName,
      userVehicle: r.userVehicle,
      rating: r.rating,
      comment: r.comment,
      date: r.date.toISOString(),
      verified: r.isVerified,
    })),
  }
}

/**
 * Real data for the first two "how it works" phones. See ShowcaseSearch and
 * ShowcaseConnectors. Either half is null when there is nothing to show, and
 * that step falls back to its photograph.
 */
export async function getHowItWorksData(): Promise<HowItWorksData> {
  const stations = await prisma.station.findMany({
    select: {
      slug: true,
      name: true,
      city: true,
      area: true,
      connectors: { select: { type: true, maxPowerKw: true, ports: true, availablePorts: true } },
    },
  })
  if (stations.length === 0) return { search: null, connectors: null }

  // ── The search: the city with the most ports ───────────────────────
  const portsByCity = new Map<string, number>()
  for (const s of stations) {
    const ports = s.connectors.reduce((n, c) => n + c.ports, 0)
    portsByCity.set(s.city, (portsByCity.get(s.city) ?? 0) + ports)
  }
  const city = [...portsByCity.entries()].sort((a, b) => b[1] - a[1])[0]![0]
  const results = stations
    .filter((s) => s.city === city)
    .map((s) => {
      const sorted = [...s.connectors].sort((a, b) => b.maxPowerKw - a.maxPowerKw)
      return {
        slug: s.slug,
        name: s.name,
        area: s.area,
        maxPowerKw: sorted[0]?.maxPowerKw ?? 0,
        ports: s.connectors.reduce((n, c) => n + c.ports, 0),
        availablePorts: s.connectors.reduce((n, c) => n + c.availablePorts, 0),
        connectors: [...new Set(sorted.map((c) => c.type))],
      }
    })
    .sort((a, b) => b.maxPowerKw - a.maxPowerKw)

  // ── The connector filter ───────────────────────────────────────────
  const byType = new Map<string, { stations: Set<string>; maxPowerKw: number }>()
  for (const s of stations)
    for (const c of s.connectors) {
      const t = byType.get(c.type) ?? { stations: new Set<string>(), maxPowerKw: 0 }
      t.stations.add(s.slug)
      t.maxPowerKw = Math.max(t.maxPowerKw, c.maxPowerKw)
      byType.set(c.type, t)
    }
  const types = [...byType.entries()]
    .map(([type, t]) => ({ type, stations: t.stations.size, maxPowerKw: t.maxPowerKw }))
    .sort((a, b) => b.stations - a.stations || b.maxPowerKw - a.maxPowerKw)

  // Shown selected: the most widely fitted DC fast connector, as a fast-
  // charging car would pick. CCS2 on this network.
  const selected = types.find((t) => t.type === 'CCS2')?.type ?? types[0]?.type ?? 'CCS2'
  const minKw = 50
  const matches = stations.filter((s) =>
    s.connectors.some((c) => c.type === selected && c.maxPowerKw >= minKw && c.availablePorts > 0),
  ).length

  return {
    search: results.length > 0 ? { city, results } : null,
    connectors: types.length > 0 ? { types, selected, minKw, matches } : null,
  }
}
