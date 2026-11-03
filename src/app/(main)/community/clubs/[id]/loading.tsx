// src/app/(main)/community/clubs/[id]/loading.tsx

/**
 * The club page's own loading state. Besides showing the shape of the page
 * while the club loads, it puts a boundary at this segment, which is what lets
 * an unknown club id render not-found.tsx rather than crash the stream that
 * the parent /community loading screen had already started.
 */
export default function ClubLoading() {
  return (
    <div className="bg-chalk pb-20" aria-busy="true">
      <div data-theme="dark" className="rounded-b-[32px] bg-ink pb-[clamp(132px,13vw,176px)] pt-[clamp(44px,7vw,80px)] sm:rounded-b-[48px]">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4">
          <div className="h-3 w-24 rounded-full bg-white/10" />
          <div className="h-14 w-3/4 rounded-2xl bg-white/10" />
          <div className="h-5 w-2/3 rounded-lg bg-white/10" />
        </div>
      </div>
      <div
        data-theme="light"
        className="relative z-[3] mx-auto -mt-[84px] w-[min(1320px,calc(100%-2*clamp(16px,4vw,64px)))] overflow-hidden rounded-3xl border border-white/60 bg-paper shadow-e4 sm:-mt-28 sm:rounded-[32px]"
      >
        <div className="m-2 h-48 animate-pulse rounded-[18px] bg-stone sm:m-3 sm:h-64 sm:rounded-[24px]" />
        <div className="space-y-3 px-[18px] pb-7 pt-4 sm:px-7">
          <div className="h-8 w-1/3 animate-pulse rounded-lg bg-stone" />
          <div className="h-16 w-full animate-pulse rounded-[18px] bg-stone/60" />
        </div>
      </div>
    </div>
  )
}
