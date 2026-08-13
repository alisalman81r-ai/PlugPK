// src/app/admin/(protected)/loading.tsx
/**
 * Shown while any admin screen resolves its database reads.
 *
 * Every page here is force-dynamic, so there is always a real round trip
 * between click and content. Without this the operator got a frozen previous
 * page and no signal anything was happening.
 *
 * The shape deliberately matches the screens it stands in for — a header bar
 * and a stack of rows — so content lands where the skeleton was rather than
 * shifting the page.
 */
export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>

      <div className="flex h-[73px] items-center border-b border-slate-200 bg-white px-4 lg:px-8">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
      </div>

      <div className="px-4 py-6 lg:px-8 lg:py-8">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="h-11 border-b border-slate-200 bg-slate-50" />
          {Array.from({ length: 6 }, (_, index) => index).map((index) => (
            <div
              key={index}
              className="flex items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-0"
            >
              <div className="h-4 flex-1 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
              <div className="h-4 w-24 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
              <div className="h-6 w-20 animate-pulse rounded-lg bg-slate-100 motion-reduce:animate-none" />
              <div className="h-8 w-16 animate-pulse rounded-lg bg-slate-100 motion-reduce:animate-none" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
