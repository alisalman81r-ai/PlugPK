// src/app/(main)/community/post/[slug]/loading.tsx
import { Skeleton } from '@/components/ui'

/** A post page's frame while the post and its first comments load. */
export default function CommunityPostLoading() {
  return (
    <div className="container-plug py-10" role="status" aria-label="Loading the post">
      <Skeleton className="mb-8 h-6 w-48" />
      <div className="grid items-start gap-10 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
            <Skeleton className="mb-4 h-7 w-32 rounded-full" />
            <Skeleton className="mb-3 h-9 w-5/6" />
            <Skeleton className="mb-8 h-9 w-2/3" />
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
        <div className="hidden flex-col gap-5 lg:flex">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
