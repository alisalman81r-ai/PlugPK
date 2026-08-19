// src/lib/db/queries.ts
import 'server-only'

import type { CommunityPost, EVService, Station } from '@/lib/types'

import { businessToStation } from './business-to-station'
import { prisma } from './client'
import { toConnector, toPost, toService, toStation } from './serialize'

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

export async function getStations(): Promise<Station[]> {
  const rows = await prisma.station.findMany({
    include: { connectors: true },
    orderBy: { createdAt: 'asc' },
  })
  return rows.map(toStation)
}

/**
 * A listing by slug, from either table.
 *
 * Falls back to an approved business when no station matches. Businesses have
 * been appearing as pins on the map since they were added to the feed, but the
 * detail page only ever looked at the Station table — so every one of those
 * pins led to a 404 when a driver tapped it. The map hands out the business id
 * as the slug, so the same URL resolves here.
 */
export async function getStationBySlug(slug: string): Promise<Station | null> {
  const row = await prisma.station.findUnique({
    where: { slug },
    include: { connectors: true, reviews: { orderBy: { date: 'desc' } } },
  })
  if (row) return toStation(row)

  return getBusinessAsStation(slug)
}

export async function getStationById(id: string): Promise<Station | null> {
  const row = await prisma.station.findUnique({
    where: { id },
    include: { connectors: true, reviews: { orderBy: { date: 'desc' } } },
  })
  return row ? toStation(row) : null
}

/** Slugs only — for generateStaticParams, which needs nothing else. */
export async function getStationSlugs(): Promise<string[]> {
  const rows = await prisma.station.findMany({ select: { slug: true } })
  return rows.map((row) => row.slug)
}

// ─── Services ───────────────────────────────────────

export async function getServices(): Promise<EVService[]> {
  const rows = await prisma.eVService.findMany({ orderBy: { name: 'asc' } })
  return rows.map(toService)
}

export async function getServiceBySlug(
  category: string,
  slug: string,
): Promise<EVService | null> {
  const row = await prisma.eVService.findUnique({ where: { slug } })
  // The URL carries both, so a mismatched pair is a 404 rather than a
  // redirect — otherwise /services/insurance/some-dealer would resolve.
  if (!row || row.category !== category) return null
  return toService(row)
}

export async function getServiceById(id: string): Promise<EVService | null> {
  const row = await prisma.eVService.findUnique({ where: { id } })
  return row ? toService(row) : null
}

export async function getServiceParams(): Promise<{ category: string; slug: string }[]> {
  const rows = await prisma.eVService.findMany({ select: { category: true, slug: true } })
  return rows
}

// ─── Community ──────────────────────────────────────

export async function getPosts(): Promise<CommunityPost[]> {
  const rows = await prisma.communityPost.findMany({ orderBy: { createdAt: 'desc' } })
  return rows.map(toPost)
}

export async function getPostBySlug(slug: string): Promise<CommunityPost | null> {
  const row = await prisma.communityPost.findUnique({
    where: { slug },
    include: { comments: { orderBy: { createdAt: 'asc' } } },
  })
  return row ? toPost(row) : null
}

export async function getPostById(id: string): Promise<CommunityPost | null> {
  const row = await prisma.communityPost.findUnique({
    where: { id },
    include: { comments: { orderBy: { createdAt: 'asc' } } },
  })
  return row ? toPost(row) : null
}

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
export async function getMappableBusinesses(): Promise<BusinessRow[]> {
  const rows = await prisma.business.findMany({
    where: { status: 'approved', lat: { not: null }, lng: { not: null } },
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

export async function getReviewsForBusiness(businessId: string): Promise<BusinessReviewRow[]> {
  const rows = await prisma.review.findMany({
    where: { businessId },
    orderBy: { date: 'desc' },
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
export async function getBusinessAsStation(id: string): Promise<Station | null> {
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
}
