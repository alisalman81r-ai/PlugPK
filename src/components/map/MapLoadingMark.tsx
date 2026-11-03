// src/components/map/MapLoadingMark.tsx

/** The design's loading state: the plugpk mark pulsing on a dotted chalk ground. */
export function MapLoadingMark({ label = 'Loading the map…' }: { label?: string }) {
  return (
    <div
      role="status"
      className="pointer-events-none absolute inset-0 z-[4] grid place-content-center justify-items-center gap-3.5 bg-[#ECEAE3] bg-[radial-gradient(rgba(11,12,14,.07)_1px,transparent_1.5px)] [background-size:14px_14px]"
    >
      <svg viewBox="0 0 32 32" aria-hidden="true" className="h-11 w-11 animate-pulse motion-reduce:animate-none">
        <rect width="32" height="32" rx="9" fill="#0B0C0E" />
        <path d="M18.6 4.5 8.5 18h6.8l-1.9 9.5L23.5 14h-6.8z" fill="#D4FF3A" />
      </svg>
      <span className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</span>
    </div>
  )
}
