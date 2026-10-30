// src/app/(main)/cars/(index)/loading.tsx

/**
 * Shown while the cars route resolves.
 *
 * Shaped like the page it replaces — the dark hero, the toolbar, then a grid of
 * cards — rather than a spinner in the middle of nothing. A skeleton that
 * matches the layout means little jumps when the real content arrives; a
 * centred spinner guarantees everything will.
 *
 * The catalogue is a static module, so in practice this is only visible on a
 * cold navigation over a slow connection. It exists because that is exactly
 * when a blank screen does the most damage.
 *
 * Why it lives in an (index) route group rather than at cars/ — which is where
 * it started. A loading boundary wraps every nested route too, and a Suspense
 * boundary makes Next stream the response: the 200 header is flushed before the
 * page body runs, so notFound() in cars/[slug] could no longer set a status and
 * an unknown car URL came back 200 with the 404 body. Measured, not guessed:
 * removing this file turned /cars/nope from 200 back into 404.
 *
 * The group scopes the boundary to the listing alone. Route groups do not
 * appear in the URL, so /cars is unchanged and [slug] sits outside it.
 */
export default function CarsLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading cars…</span>

      {/* The hero in silhouette, on the same ground as the real one, so the
          swap is a content change rather than a background flash. */}
      <section className="relative isolate overflow-hidden bg-plug-navy-950 py-20 lg:py-28">
        <div className="container-plug flex flex-col items-center gap-5">
          <div className="h-12 w-full max-w-2xl animate-pulse rounded-2xl bg-white/10" />
          <div className="h-5 w-full max-w-md animate-pulse rounded-full bg-white/[0.07]" />
          <div className="mt-5 h-16 w-full max-w-3xl animate-pulse rounded-full bg-white/[0.07]" />
          <div className="mt-5 h-[5.5rem] w-full max-w-md animate-pulse rounded-2xl bg-white/[0.05]" />
        </div>
      </section>

      <section className="bg-slate-50 pb-20 pt-8 sm:pt-10">
        <div className="container-plug">
          {/* The toolbar: the powertrain pills and the filter button */}
          <div className="flex items-center gap-3">
            <div className="flex flex-1 gap-2 overflow-hidden">
              {[90, 84, 100, 92, 104].map((width, index) => (
                <div key={index} className="h-12 shrink-0 animate-pulse rounded-full bg-white" style={{ width }} />
              ))}
            </div>
            <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-white" />
          </div>

          {/* The grid, in the cards' own shape */}
          <div className="mt-[4.25rem] grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="overflow-hidden rounded-[1.75rem] bg-slate-100">
                <div className="aspect-[16/10] animate-pulse bg-slate-200/50" />
                <div className="px-6 pb-6 pt-4">
                  <div className="h-7 w-32 animate-pulse rounded-lg bg-slate-200" />
                  <div className="mt-2 h-4 w-48 animate-pulse rounded-full bg-slate-200/70" />
                  <div className="mt-4 h-4 w-36 animate-pulse rounded-full bg-slate-200/70" />
                  <div className="mt-4 flex items-end justify-between border-t border-slate-300/60 pt-4">
                    <div className="h-9 w-36 animate-pulse rounded-lg bg-slate-200" />
                    <div className="h-12 w-12 animate-pulse rounded-full bg-slate-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
