// src/app/(main)/community/post/[slug]/loading.tsx
import { Skeleton } from '@/components/ui'

/** A post page's frame while the post and its first comments load. */
export default function CommunityPostLoading() {
  return (
    <div className="bg-chalk pb-20" role="status" aria-label="Loading the post">
      <div
        data-theme="dark"
        className="rounded-b-[32px] bg-ink pb-[clamp(132px,13vw,176px)] pt-[clamp(44px,7vw,80px)] sm:rounded-b-[48px]"
      >
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4">
          <div className="h-3 w-28 rounded-full bg-white/10" />
          <div className="h-12 w-5/6 rounded-2xl bg-white/10" />
          <div className="h-12 w-2/3 rounded-2xl bg-white/10" />
          <div className="mt-4 h-11 w-72 rounded-full bg-white/10" />
        </div>
      </div>
      <div className="relative z-[3] mx-auto -mt-[84px] grid w-[min(1320px,calc(100%-2*clamp(16px,4vw,64px)))] items-start gap-7 sm:-mt-28 lg:grid-cols-[1fr_340px]">
        <div className="grid gap-5">
          <div className="rounded-[32px] border border-ink/10 bg-white p-6 shadow-e4 sm:p-10">
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="mb-2 h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="h-40 w-full rounded-[32px]" />
        </div>
        <div className="hidden gap-4 lg:grid">
          <Skeleton className="h-36 w-full rounded-[26px]" />
          <Skeleton className="h-56 w-full rounded-[26px]" />
        </div>
      </div>
    </div>
  )
}
