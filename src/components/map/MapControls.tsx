// src/components/map/MapControls.tsx
'use client'

import { LocateFixed, SlidersHorizontal } from '@/components/ui/icons'

import { cn } from '@/lib/utils'

export interface MapControlsProps {
  onFilterClick: () => void
  activeFilterCount: number
  resultCount: number
  onLocateMe: () => void
  isLocating: boolean
  /**
   * Whether to offer the Filters button.
   *
   * Explicit, because the desktop layout used to hide it with
   * `[&>button:first-child]:hidden` from the page — which silently coupled that
   * page to the order of the buttons in here. Adding a control at the front
   * would have hidden the wrong one.
   */
  showFilterButton?: boolean
  className?: string
}

export function MapControls({
  onFilterClick,
  activeFilterCount,
  resultCount,
  onLocateMe,
  isLocating,
  showFilterButton = true,
  className,
}: MapControlsProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {showFilterButton ? (
        <button
        type="button"
        onClick={onFilterClick}
        aria-label={`Filters, ${resultCount} stations found`}
        className={cn(
          'flex h-11 shrink-0 items-center gap-2 rounded-full border border-ink/10 bg-paper/95 px-4 text-sm font-semibold text-ink shadow-e1 transition-colors duration-150 hover:bg-ink hover:text-white',
        )}
      >
        <SlidersHorizontal size={18} className="shrink-0" aria-hidden="true" />
        Filters
        {activeFilterCount > 0 ? (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-volt font-mono text-[11px] font-semibold text-ink">
            {activeFilterCount}
          </span>
        ) : null}
        </button>
      ) : null}

      <button
        type="button"
        onClick={onLocateMe}
        aria-label="Find my location"
        className="group/loc grid h-11 w-11 shrink-0 place-items-center rounded-[14px] border border-ink/10 bg-paper/95 text-ink shadow-e1 backdrop-blur-[10px] [transition:background-color_.25s,color_.25s,transform_.3s_cubic-bezier(.34,1.56,.64,1)] hover:bg-ink hover:text-white active:scale-[0.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
      >
        <LocateFixed
          size={19}
          className={cn(isLocating && 'animate-spin motion-reduce:animate-none')}
          aria-hidden="true"
        />
      </button>
    </div>
  )
}
