// src/app/(main)/services/(index)/loading.tsx

/**
 * Shown while the services directory reads the table.
 *
 * The page is force-dynamic, so every visit waits on the database. Shaped like
 * what replaces it — the dark hero band, the category tabs, a filter bar and a
 * grid of cards — so the content lands where the skeleton was.
 *
 * Scoped to the (index) group on purpose: see the note in page.tsx about
 * keeping notFound() on the category and detail pages a real 404.
 */
export default function ServicesLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading services…</span>

      <section className="bg-plug-navy-950 py-20 lg:py-24">
        <div className="container-plug flex flex-col items-center gap-5">
          <div className="h-6 w-32 animate-pulse rounded-full bg-white/10 motion-reduce:animate-none" />
          <div className="h-12 w-full max-w-2xl animate-pulse rounded-2xl bg-white/10 motion-reduce:animate-none" />
          <div className="h-5 w-full max-w-md animate-pulse rounded-full bg-white/[0.07] motion-reduce:animate-none" />
          <div className="mt-4 h-14 w-full max-w-3xl animate-pulse rounded-full bg-white/[0.07] motion-reduce:animate-none" />
        </div>
      </section>

      <div className="container-plug py-8">
        <div className="flex gap-2.5 overflow-hidden">
          {Array.from({ length: 7 }, (_, index) => (
            <div
              key={index}
              className="h-11 w-32 shrink-0 animate-pulse rounded-full bg-slate-100 motion-reduce:animate-none"
            />
          ))}
        </div>

        <div className="mt-8 h-10 w-full animate-pulse rounded-xl bg-slate-100 motion-reduce:animate-none" />

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="aspect-[16/10] animate-pulse bg-slate-100 motion-reduce:animate-none" />
              <div className="p-5">
                <div className="h-5 w-40 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
                <div className="mt-2 h-3 w-28 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
                <div className="mt-4 h-3 w-full animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
                <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
