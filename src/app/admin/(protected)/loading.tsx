// src/app/admin/(protected)/loading.tsx
/**
 * Shown while an admin screen resolves its database reads (every page is
 * force-dynamic). Shaped like the screens it stands in for — the design's
 * page head, then a card of rows — so content lands where the skeleton was.
 */
const BAR = 'animate-pulse rounded-lg bg-stone motion-reduce:animate-none'

export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr">Loading</span>
      <div className="phead">
        <div>
          <div className={`${BAR} h-10 w-64`} />
          <div className={`${BAR} mt-3 h-4 w-80 max-w-full`} />
        </div>
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ height: 48, background: 'var(--paper)', borderBottom: '1px solid var(--line)' }} />
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex items-center gap-4 border-b border-ink/[0.06] px-6 py-5 last:border-0">
            <div className={`${BAR} h-4 flex-1`} />
            <div className={`${BAR} h-4 w-24`} />
            <div className={`${BAR} h-7 w-20 rounded-full`} />
            <div className={`${BAR} h-9 w-16 rounded-full`} />
          </div>
        ))}
      </div>
    </div>
  )
}
