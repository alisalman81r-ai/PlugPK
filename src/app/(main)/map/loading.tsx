// src/app/(main)/map/loading.tsx

/**
 * Shown while the map route resolves.
 *
 * ── Why this file is worth more than the pixels it draws ──────────────
 *
 * Next only prefetches a dynamic route as far as its nearest loading boundary.
 * Every page under (main) is dynamic — the group's layout reads cookies to name
 * the signed-in account — so before this existed there was no boundary to
 * prefetch to, and hovering or idling on a link to /map fetched nothing at all.
 * Measured on a production build: idling on the homepage produced zero requests
 * for /map, and the click that followed paid for the whole round trip with the
 * old page still on screen and nothing to show it had been heard.
 *
 * A loading boundary is what lets the router commit the navigation immediately:
 * the URL changes, this renders, and the page streams in behind it.
 *
 * ── Why it is here and not on the (main) group ────────────────────────
 *
 * A group-level boundary would cover every nested route at once, which is the
 * tempting version and the broken one. A Suspense boundary makes Next stream
 * the response, so the 200 header is flushed before the page body runs and a
 * later notFound() can no longer set a status — cars/(index)/loading.tsx
 * records exactly that: an unknown car URL came back 200 carrying the 404 body.
 * /map has no nested routes, so the boundary stops here and no [slug] route
 * loses its 404.
 *
 * ── Shaped like the page, not a spinner ───────────────────────────────
 *
 * The ink hero, the paper filter sheet lifted into it, the map frame at its
 * real height, then the results grid. The proportions are the page's own, so
 * the swap is a content change rather than a layout jump.
 */

import { MapLoadingMark } from '@/components/map/MapLoadingMark'
import { MAP_HEIGHT, RAIL_LIFT } from '@/components/map/layout'
import { WRAP } from '@/components/v2/ui'

const PULSE = 'animate-pulse motion-reduce:animate-none'

export default function MapLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className="bg-chalk">
      <span className="sr-only">Loading the charging map…</span>

      <section
        data-theme="dark"
        className="relative overflow-hidden rounded-b-[32px] bg-ink pb-[150px] pt-[clamp(44px,7vw,80px)] sm:rounded-b-[48px] sm:pb-[196px]"
      >
        <div className="mx-auto grid w-[min(980px,calc(100%-2*clamp(16px,4vw,64px)))] justify-items-center">
          <div className={`h-[clamp(42px,5.6vw,88px)] w-full max-w-[640px] rounded-2xl bg-white/10 ${PULSE}`} />
          <div className={`mt-3 h-[clamp(42px,5.6vw,88px)] w-full max-w-[760px] rounded-2xl bg-volt/15 ${PULSE}`} />
          <div className={`mt-6 h-5 w-full max-w-[560px] rounded-full bg-white/[0.07] ${PULSE}`} />
          <div className={`mt-[34px] h-[58px] w-full max-w-[640px] rounded-full bg-white/90 sm:h-16`} />
          <div className={`mt-[18px] h-[58px] w-full rounded-full bg-volt/30 sm:w-64 ${PULSE}`} />
        </div>
      </section>

      <div className={`relative z-10 ${RAIL_LIFT} ${WRAP}`}>
        <div className="overflow-hidden rounded-3xl border border-white/60 bg-paper shadow-e4 sm:rounded-[32px]">
          <div className="flex items-center gap-4 border-b border-ink/10 bg-[linear-gradient(90deg,#F4F3EE,#fff)] px-[18px] py-[22px] sm:px-7">
            <div className="h-[46px] w-[46px] rounded-[14px] bg-chalk" />
            <div className={`h-7 w-48 rounded-lg bg-stone ${PULSE}`} />
          </div>
          <div className="flex flex-wrap gap-2 px-[18px] py-6 sm:px-7">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className={`h-10 w-24 rounded-full bg-stone ${PULSE}`} />
            ))}
          </div>
        </div>
      </div>

      <div className={`${WRAP} pt-5 sm:pt-7`}>
        <div className={`relative ${MAP_HEIGHT} overflow-hidden rounded-[28px] border border-ink/10 sm:rounded-[36px]`}>
          <MapLoadingMark />
        </div>
      </div>

      <div className={`${WRAP} pb-16 pt-[clamp(64px,7vw,104px)]`}>
        <div className={`h-10 w-72 rounded-lg bg-stone ${PULSE}`} />
        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-[200px] rounded-[24px] border border-ink/10 bg-white shadow-e1" />
          ))}
        </div>
      </div>
    </div>
  )
}
