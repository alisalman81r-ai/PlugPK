// src/app/robots.ts
import type { MetadataRoute } from 'next'

import { SITE_CONFIG } from '@/lib/constants'

/**
 * /robots.txt
 *
 * Everything public is open. The disallowed paths are the ones that are either
 * behind sign-in (a crawler gets a login redirect, which is noise in its index)
 * or are a form with nothing to rank. They also carry `noindex` in their own
 * metadata; this saves the crawl budget of fetching them to find that out.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/business',
          '/onboarding',
          '/api',
          '/admin',
          '/login',
          '/signup',
          '/forgot-password',
          '/reset-password',
          '/verify-email',
        ],
      },
    ],
    sitemap: `${SITE_CONFIG.url}/sitemap.xml`,
    host: SITE_CONFIG.url,
  }
}
