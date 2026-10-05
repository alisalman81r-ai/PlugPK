// src/app/sitemap.ts
import type { MetadataRoute } from 'next'

import { SERVICE_CATEGORY_KEYS, SITE_CONFIG } from '@/lib/constants'
import { getCarSlugs } from '@/lib/db/car-queries'
import { getPostSlugs, getServiceParams, getStationSlugs } from '@/lib/db/queries'

/**
 * /sitemap.xml — every public page a search engine should know about.
 *
 * Rebuilt hourly rather than per request: the catalogue and the station list
 * change a few times a week, and a crawler hitting this file should not cost a
 * round of database queries every time.
 *
 * Only public pages are listed. The account, business and admin areas are
 * either behind sign-in or noindex, and robots.ts disallows them, so listing
 * them here would only send a crawler to a login wall.
 */
export const revalidate = 3600

const BASE = SITE_CONFIG.url

/** The pages that exist whatever is in the database. */
const STATIC_ROUTES: { path: string; priority: number; changeFrequency: 'daily' | 'weekly' | 'monthly' }[] = [
  { path: '/', priority: 1, changeFrequency: 'daily' },
  { path: '/map', priority: 0.9, changeFrequency: 'daily' },
  { path: '/routes', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/cars', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/cars/compare', priority: 0.5, changeFrequency: 'weekly' },
  { path: '/charging-calculator', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/range-converter', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/services', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/services/list', priority: 0.5, changeFrequency: 'weekly' },
  { path: '/community', priority: 0.7, changeFrequency: 'daily' },
  { path: '/community/clubs', priority: 0.5, changeFrequency: 'weekly' },
  { path: '/partners', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/credits', priority: 0.2, changeFrequency: 'monthly' },
  { path: '/terms', priority: 0.2, changeFrequency: 'monthly' },
  { path: '/privacy', priority: 0.2, changeFrequency: 'monthly' },
]

/**
 * Runs one source of dynamic URLs, and returns nothing if it fails.
 *
 * Each list is fetched on its own so one failing query — a table mid-migration,
 * a dropped connection — costs that list and not the whole file. A sitemap that
 * still lists the static pages is far better than a 500 a crawler remembers.
 */
async function safely(load: () => Promise<string[]>): Promise<string[]> {
  try {
    return await load()
  } catch (error) {
    console.warn('[sitemap] a dynamic list could not be loaded:', error)
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const [cars, stations, services, posts] = await Promise.all([
    safely(async () => (await getCarSlugs()).map((slug) => `/cars/${slug}`)),
    safely(async () => (await getStationSlugs()).map((slug) => `/station/${slug}`)),
    safely(async () =>
      (await getServiceParams()).map(({ category, slug }) => `/services/${category}/${slug}`),
    ),
    safely(async () => (await getPostSlugs()).map((slug) => `/community/post/${slug}`)),
  ])

  const categories = SERVICE_CATEGORY_KEYS.map((category) => `/services/${category}`)

  return [
    ...STATIC_ROUTES.map((route) => ({
      url: `${BASE}${route.path === '/' ? '' : route.path}`,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...categories.map((path) => ({ url: `${BASE}${path}`, lastModified: now, priority: 0.6 })),
    ...cars.map((path) => ({ url: `${BASE}${path}`, lastModified: now, priority: 0.8 })),
    ...stations.map((path) => ({ url: `${BASE}${path}`, lastModified: now, priority: 0.7 })),
    ...services.map((path) => ({ url: `${BASE}${path}`, lastModified: now, priority: 0.5 })),
    ...posts.map((path) => ({ url: `${BASE}${path}`, lastModified: now, priority: 0.4 })),
  ]
}
