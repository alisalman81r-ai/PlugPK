// src/app/(main)/cars/(index)/loading.tsx

/**
 * Shown while the cars route resolves.
 *
 * Shaped like the page it replaces — the ink hero, the brand strip, the toolbar, then a grid of
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

      {/* The hero in silhouette, on the same ink ground as the real one, so
          the swap is a content change rather than a background flash. */}
      <section
        data-theme="dark"
        className="rounded-b-[32px] bg-ink pb-[clamp(120px,10vw,128px)] pt-[clamp(44px,7vw,80px)] sm:rounded-b-[48px]"
      >
        <div className="mx-auto flex w-[min(980px,calc(100%-32px))] flex-col items-center gap-5">
          <div className="h-[clamp(84px,10vw,170px)] w-full max-w-2xl animate-pulse rounded-3xl bg-white/10" />
          <div className="h-5 w-full max-w-md animate-pulse rounded-full bg-white/[0.07]" />
          <div className="mt-4 h-16 w-full max-w-[660px] animate-pulse rounded-full bg-white/[0.12]" />
          <div className="mt-6 h-[74px] w-full max-w-xs animate-pulse rounded-[22px] bg-white/[0.05]" />
        </div>
      </section>

      {/* The brand strip */}
      <div className="relative z-[3] mx-auto -mt-10 h-[62px] w-[min(1320px,calc(100%-32px))] rounded-[20px] bg-paper shadow-e4 sm:-mt-12 sm:h-20 sm:rounded-[26px]" />

      <section data-theme="light" className="bg-chalk pb-20 pt-[clamp(48px,5vw,72px)]">
        <div className="mx-auto w-[min(1320px,calc(100%-2*clamp(16px,4vw,64px)))]">
          {/* The powertrain chips and the filter button */}
          <div className="flex items-center gap-3">
            <div className="flex flex-1 gap-2 overflow-hidden">
              {[86, 72, 90, 84, 96].map((width, index) => (
                <div key={index} className="h-11 shrink-0 animate-pulse rounded-full bg-white" style={{ width }} />
              ))}
            </div>
            <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-white" />
          </div>

          {/* The grid, in the cards' own shape */}
          <div className="mt-[94px] grid grid-cols-1 gap-3 min-[421px]:grid-cols-2 sm:gap-[clamp(14px,1.6vw,22px)] min-[1101px]:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="overflow-hidden rounded-[28px] border border-ink/10 bg-white">
                <div className="mx-2 mt-2 aspect-[16/11] animate-pulse rounded-[22px] bg-stone" />
                <div className="px-5 pb-[18px] pt-[18px]">
                  <div className="h-7 w-32 animate-pulse rounded-lg bg-stone" />
                  <div className="mt-2 h-4 w-48 animate-pulse rounded-full bg-stone/70" />
                  <div className="mt-4 h-4 w-36 animate-pulse rounded-full bg-stone/70" />
                  <div className="mt-4 flex items-end justify-between border-t border-ink/10 pt-4">
                    <div className="h-9 w-36 animate-pulse rounded-lg bg-stone" />
                    <div className="h-11 w-11 animate-pulse rounded-full bg-stone" />
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
