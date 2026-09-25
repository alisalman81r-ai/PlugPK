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
 * Dark hero band, the filter rail's white mount, the map frame at its real
 * height, then the results grid. The proportions are the page's own, so the
 * swap is a content change rather than a layout jump.
 */

/** Mirrors STAGE in page.tsx — one measure down the whole page. */
const STAGE = 'mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10'

/** Mirrors MAP_HEIGHT in page.tsx, so the frame does not resize on arrival. */
const MAP_HEIGHT = 'h-[27rem] sm:h-[clamp(28rem,68vh,46rem)]'

export default function MapLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading the charging map…</span>

      {/* The hero band in silhouette: same ground and same glow as the real
          one, so what changes on arrival is the words, not the background. */}
      <section className="relative isolate overflow-hidden bg-plug-navy-950 pb-28 pt-16 lg:pb-36 lg:pt-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-40 -top-48 -z-10 h-[34rem] w-[34rem] rounded-full bg-plug-blue-600/20 blur-[130px]"
        />
        <div className={STAGE}>
          <div className="h-7 w-44 animate-pulse rounded-full bg-white/10" />
          <div className="mt-5 h-11 w-full max-w-xl animate-pulse rounded-2xl bg-white/10" />
          <div className="mt-4 h-5 w-full max-w-lg animate-pulse rounded-full bg-white/[0.07]" />
        </div>
      </section>

      {/* The rail and the map wear the same white mount as the real console,
          and the map keeps its exact working height. */}
      <div className={`${STAGE} -mt-16 lg:-mt-24`}>
        <div className="rounded-3xl bg-white p-2 shadow-[0_24px_60px_-28px_rgba(5,36,30,0.35)]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="h-11 flex-1 animate-pulse rounded-full bg-slate-100" />
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-9 w-28 animate-pulse rounded-full bg-slate-100" />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-3xl bg-white p-2 shadow-[0_24px_60px_-28px_rgba(5,36,30,0.35)]">
          {/* The faint grid the real map's own loader uses, so the two agree
              rather than handing off between different greys. */}
          <div className={`relative ${MAP_HEIGHT} w-full overflow-hidden rounded-2xl bg-slate-100`}>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(5,36,30,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(5,36,30,0.05)_1px,transparent_1px)] [background-size:44px_44px]"
            />
          </div>
        </div>

        {/* Results: six cards is enough to fill the fold without animating a
            screenful of boxes below it. */}
        <div className="mt-10 pb-16">
          <div className="h-7 w-52 animate-pulse rounded-lg bg-slate-100" />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-xl border border-slate-200/90 bg-white p-5">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 shrink-0 animate-pulse rounded-lg bg-slate-100" />
                  <div className="flex-1">
                    <div className="h-4 w-36 animate-pulse rounded bg-slate-100" />
                    <div className="mt-2 h-3 w-28 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <div className="h-8 w-24 animate-pulse rounded-full bg-slate-100" />
                  <div className="h-8 w-20 animate-pulse rounded-full bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
