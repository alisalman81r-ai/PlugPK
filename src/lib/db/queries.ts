// src/lib/db/queries.ts
import 'server-only'

import type { CommunityPost, EVService, Station } from '@/lib/types'

import { prisma } from './client'
import { toPost, toService, toStation } from './serialize'

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

export async function getStationBySlug(slug: string): Promise<Station | null> {
  const row = await prisma.station.findUnique({
    where: { slug },
    include: { connectors: true, reviews: { orderBy: { date: 'desc' } } },
  })
  return row ? toStation(row) : null
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
