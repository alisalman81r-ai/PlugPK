// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  /**
   * Where the build output goes.
   *
   * `next build` and `next dev` share `.next` by default, so building while a
   * dev server is running overwrites the files that server is mid-flight on.
   * The page keeps rendering from memory but every Server Action call then
   * fails with "TypeError: Failed to fetch", because the action manifest it is
   * looking for has been replaced by the production one.
   *
   * Setting NEXT_DIST_DIR sends a verification build somewhere else, so a
   * type-check-by-building never disturbs a running dev server:
   *
   *   NEXT_DIST_DIR=.next-verify npm run build
   */
  distDir: process.env.NEXT_DIST_DIR || '.next',

  images: {
    // WebP only, which is also the Next default. AVIF was measured here at
    // 2.44s to encode a 828px variant from cold against WebP's 0.41s — six
    // times the work for 21% fewer bytes. On a first visit, where the encode
    // happens in the request path, that trade goes the wrong way. Revisit if
    // this ever sits behind a CDN that absorbs the cold cost once globally.
    formats: ['image/webp'],

    // Trimmed from the defaults, which run to 3840px. Nothing here is ever
    // displayed above ~1920px, and every extra entry is another variant the
    // browser may pick and the server may have to encode from cold.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],

    // Fixed-width slots in the product: 44/64/68/80/88px thumbnails in search
    // results, list rows and preview cards, then the card and gallery widths.
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // These files are immutable — a change ships under a new name. Caching
    // an optimized variant for a year avoids re-encoding it.
    minimumCacheTTL: 60 * 60 * 24 * 365,
  },
}

export default nextConfig
