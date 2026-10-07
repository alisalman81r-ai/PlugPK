// src/app/(main)/community/clubs/[id]/loading.tsx

/**
 * The club page's own loading state. Besides showing the shape of the page
 * while the club loads, it puts a boundary at this segment, which is what lets
 * an unknown club id render not-found.tsx rather than crash the stream that
 * the parent /community loading screen had already started.
 */
export default function ClubLoading() {
  return (
    <div className="min-h-below-nav bg-slate-50 pb-20" aria-busy="true">
      <div className="h-36 rounded-b-[2rem] bg-plug-navy-950 sm:h-40" />
      <div className="mx-auto -mt-20 w-full max-w-[1100px] px-4 sm:-mt-24 sm:px-6 lg:px-10">
        <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white">
          <div className="h-44 animate-pulse bg-slate-200 sm:h-56" />
          <div className="space-y-3 p-6 sm:p-8">
            <div className="h-8 w-2/3 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-full max-w-xl animate-pulse rounded bg-slate-100" />
          </div>
        </div>
        <div className="mt-6 h-48 animate-pulse rounded-[1.75rem] border border-slate-200 bg-white" />
      </div>
    </div>
  )
}
