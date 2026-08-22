// src/app/(main)/cars/(index)/loading.tsx

/**
 * Shown while the cars route resolves.
 *
 * Shaped like the page it replaces — dark hero band, brand rail, then a grid of
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

      {/* The hero in silhouette. Same ground and blur as the real one, so the
          swap is a content change rather than a background flash. */}
      <section className="relative isolate overflow-hidden bg-slate-950 py-20 lg:py-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-40 -top-48 -z-10 h-[34rem] w-[34rem] rounded-full bg-plug-blue-600/20 blur-[130px]"
        />
        <div className="container-plug flex flex-col items-center gap-5">
          <div className="h-7 w-40 animate-pulse rounded-full bg-white/10" />
          <div className="h-12 w-full max-w-2xl animate-pulse rounded-2xl bg-white/10" />
          <div className="h-5 w-full max-w-md animate-pulse rounded-full bg-white/[0.07]" />
          <div className="mt-5 h-16 w-full max-w-3xl animate-pulse rounded-full bg-white/[0.07]" />
          <div className="mt-5 h-20 w-full max-w-md animate-pulse rounded-2xl bg-white/[0.05]" />
        </div>
      </section>

      <section className="bg-white py-12 lg:py-16">
        <div className="container-plug">
          <div className="flex gap-2.5 overflow-hidden">
            {Array.from({ length: 7 }).map((_, index) => (
              <div
                key={index}
                className="h-[4.75rem] w-[6.5rem] shrink-0 animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>

          <div className="mt-12 lg:grid lg:grid-cols-[17.5rem_1fr] lg:gap-8 xl:gap-10">
            <div className="hidden h-[32rem] animate-pulse rounded-2xl bg-slate-100 lg:block" />

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {/* Six, not twenty-eight: enough to fill the fold without
                  animating a screenful of boxes below it. */}
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-3xl border border-slate-200">
                  <div className="aspect-[16/10] animate-pulse bg-slate-100" />
                  <div className="flex flex-col gap-3 p-5">
                    <div className="h-3 w-16 animate-pulse rounded-full bg-slate-100" />
                    <div className="h-5 w-32 animate-pulse rounded-full bg-slate-100" />
                    <div className="h-6 w-24 animate-pulse rounded-full bg-slate-100" />
                    <div className="mt-2 grid grid-cols-2 gap-2.5">
                      {Array.from({ length: 4 }).map((__, cell) => (
                        <div key={cell} className="h-8 animate-pulse rounded-lg bg-slate-100" />
                      ))}
                    </div>
                    <div className="mt-2 h-10 animate-pulse rounded-full bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
