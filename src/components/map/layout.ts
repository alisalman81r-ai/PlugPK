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
