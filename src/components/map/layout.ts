// src/components/map/layout.ts
//
// Measures shared by the map page and its loading state. A plain module, so
// the server-rendered loading.tsx can read them (a 'use client' module's
// exports reach a Server Component as references, not values).

/** The map frame's working height: 62vh within limits, taller on a phone. */
export const MAP_HEIGHT =
  'h-[72vh] min-h-[440px] max-h-[600px] sm:h-[clamp(460px,62vh,680px)] sm:max-h-none'

/** How far the filter sheet is pulled up into the hero above it. */
export const RAIL_LIFT = '-mt-24 sm:-mt-[132px]'

/**
 * .scard2 / .card--hover: the card rises 4px on the `translate` property, so
 * it never fights the GSAP `y` (transform) its entrance leaves behind.
 * transition: translate .45s e-out, box-shadow .45s e-out, border-color .3s.
 */
export const SCARD_HOVER =
  '[transition:translate_.45s_cubic-bezier(.16,1,.3,1),box-shadow_.45s_cubic-bezier(.16,1,.3,1),border-color_.3s] hover:[translate:0_-4px] hover:border-ink/[.18] hover:shadow-e2'
