// src/app/(main)/services/(index)/loading.tsx
import { WRAP } from '@/components/v2/ui'

/**
 * Shown while the services directory reads the table.
 *
 * The page is force-dynamic, so every visit waits on the database. Shaped like
 * what replaces it — the ink hero, the lifted category bar, the toolbar and a
 * grid of cards — so the content lands where the skeleton was.
 *
 * Scoped to the (index) group on purpose: see the note in page.tsx about
 * keeping notFound() on the category and detail pages a real 404.
 */
const PULSE = 'animate-pulse motion-reduce:animate-none'

export default function ServicesLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading services…</span>

      <section data-theme="dark" className="rounded-b-[32px] bg-ink pb-[clamp(120px,11vw,150px)] pt-[clamp(44px,7vw,80px)] sm:rounded-b-[48px]">
        <div className="mx-auto flex w-[min(980px,calc(100%-32px))] flex-col items-center gap-5">
          <div className={`h-14 w-full max-w-2xl rounded-2xl bg-white/10 ${PULSE}`} />
          <div className={`h-14 w-full max-w-md rounded-2xl bg-white/10 ${PULSE}`} />
          <div className={`h-5 w-full max-w-lg rounded-full bg-white/[0.07] ${PULSE}`} />
          <div className={`mt-4 h-16 w-full max-w-[660px] rounded-full bg-white/[0.12] ${PULSE}`} />
          <div className={`mt-6 h-[78px] w-full max-w-[380px] rounded-[22px] bg-white/[0.05] ${PULSE}`} />
        </div>
      </section>

      <div className={`${WRAP} relative z-[3] -mt-16 rounded-3xl border border-white/60 bg-paper p-4 shadow-e4 sm:-mt-[72px] sm:rounded-[32px]`}>
        <div className="flex gap-2 overflow-hidden lg:justify-center">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className={`h-[46px] w-36 shrink-0 rounded-full bg-stone ${PULSE}`} />
          ))}
        </div>
      </div>

      <div className={`${WRAP} pb-20 pt-12`}>
        <div className={`h-11 w-full rounded-full bg-stone ${PULSE}`} />

        <div className="mt-[26px] grid gap-4 sm:grid-cols-2 sm:gap-[22px] xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="overflow-hidden rounded-[28px] border border-ink/10 bg-white shadow-e1">
              <div className={`aspect-[16/10] bg-stone ${PULSE}`} />
              <div className="p-[22px]">
                <div className={`h-6 w-48 rounded bg-stone ${PULSE}`} />
                <div className={`mt-3 h-3 w-28 rounded bg-stone ${PULSE}`} />
                <div className={`mt-4 h-3 w-full rounded bg-stone ${PULSE}`} />
                <div className={`mt-2 h-3 w-2/3 rounded bg-stone ${PULSE}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
