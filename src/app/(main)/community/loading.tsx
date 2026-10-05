// src/app/(main)/community/loading.tsx
import { Skeleton } from '@/components/ui'

/**
 * What /community shows while its first page is fetched: the dark band and
 * card shapes in place, so the page does not jump when the posts arrive.
 */
export default function CommunityLoading() {
  return (
    <div className="min-h-below-nav bg-slate-50" role="status" aria-label="Loading the community">
      <div className="rounded-b-[2rem] bg-plug-navy-950 pb-32 pt-10 sm:rounded-b-[2.5rem] sm:pb-36 lg:pb-40 lg:pt-14">
        <div className="container-plug mx-auto flex max-w-3xl flex-col items-center gap-4">
          <div className="h-10 w-3/4 rounded-xl bg-white/10" />
          <div className="h-5 w-2/3 rounded-lg bg-white/10" />
          <div className="mt-4 h-14 w-full max-w-xl rounded-2xl bg-white/10" />
        </div>
      </div>

      <div className="mx-auto -mt-20 w-full max-w-[1400px] px-4 sm:-mt-24 sm:px-6 lg:-mt-28 lg:px-10">
        <Skeleton className="h-40 w-full rounded-3xl" />
      </div>

      <div className="mx-auto grid w-full max-w-[1400px] items-start gap-10 px-4 pb-20 pt-10 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-10 lg:pt-12">
        <div className="flex flex-col gap-5">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-56 w-full rounded-2xl" />
          ))}
        </div>
        <div className="hidden flex-col gap-6 lg:flex">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
