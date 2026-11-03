// src/app/(main)/community/loading.tsx
import { Skeleton } from '@/components/ui'

/**
 * What /community shows while its first page is fetched: the ink hero, the
 * lifted browse sheet and the card shapes in place, so the page does not jump
 * when the posts arrive.
 */
export default function CommunityLoading() {
  return (
    <div className="bg-chalk" role="status" aria-label="Loading the community">
      <div
        data-theme="dark"
        className="rounded-b-[32px] bg-ink pb-[clamp(132px,13vw,176px)] pt-[clamp(44px,7vw,80px)] sm:rounded-b-[48px]"
      >
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4">
          <div className="h-14 w-3/4 rounded-2xl bg-white/10" />
          <div className="h-14 w-1/2 rounded-2xl bg-white/10" />
          <div className="h-5 w-2/3 rounded-lg bg-white/10" />
          <div className="mt-6 h-16 w-full max-w-[660px] rounded-full bg-white/10" />
        </div>
      </div>

      <div className="relative z-[3] mx-auto -mt-[84px] w-[min(1320px,calc(100%-2*clamp(16px,4vw,64px)))] sm:-mt-28">
        <Skeleton className="h-40 w-full rounded-3xl sm:rounded-[32px]" />
      </div>

      <div className="mx-auto grid w-[min(1320px,calc(100%-2*clamp(16px,4vw,64px)))] items-start gap-7 pb-20 pt-[clamp(40px,4.5vw,64px)] lg:grid-cols-[1fr_360px]">
        <div className="grid gap-4">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-56 w-full rounded-[26px]" />
          ))}
        </div>
        <div className="hidden gap-4 lg:grid">
          <Skeleton className="h-80 w-full rounded-[26px]" />
          <Skeleton className="h-72 w-full rounded-[26px]" />
        </div>
      </div>
    </div>
  )
}
