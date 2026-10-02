// src/components/station/SaveStationButton.tsx
'use client'

import * as React from 'react'

import { MorphIcon } from '@/components/ui'
import { Bookmark, BookmarkCheck } from '@/components/ui/icons'
import { useSavedStations } from '@/hooks/useSavedStations'
import { cn } from '@/lib/utils'

/**
 * Save a station to the account, from anywhere a station is shown.
 *
 * Renders nothing for a visitor who is not signed in (or while that is still
 * being worked out). Saved stations appear on the dashboard's Saved Stations.
 *
 *   overlay  a round icon for the corner of a photo
 *   chip     an icon-and-word button for a list row
 */

export interface SaveStationButtonProps {
  stationId: string
  stationName: string
  variant?: 'overlay' | 'chip'
  className?: string
}

export function SaveStationButton({ stationId, stationName, variant = 'chip', className }: SaveStationButtonProps) {
  const { signedIn, isSaved, toggle } = useSavedStations()
  if (!signedIn) return null

  const saved = isSaved(stationId)
  const onClick = (event: React.MouseEvent) => {
    // These sit inside clickable cards; saving must not also open the station.
    event.preventDefault()
    event.stopPropagation()
    void toggle(stationId)
  }

  if (variant === 'overlay') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${stationName} from saved` : `Save ${stationName}`}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-colors',
          saved ? 'bg-white text-plug-blue-600' : 'bg-black/[0.55] text-white hover:bg-black/70',
          className,
        )}
      >
        <MorphIcon active={saved} on={BookmarkCheck} off={Bookmark} size={16} />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${stationName} from saved` : `Save ${stationName}`}
      className={cn(
        'inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border px-3 text-ui-sm font-semibold transition-colors',
        saved
          ? 'border-plug-blue-200 bg-plug-blue-50 text-plug-blue-700'
          : 'border-slate-200 bg-white text-slate-600 hover:border-plug-blue-200 hover:text-plug-blue-700',
        className,
      )}
    >
      <MorphIcon active={saved} on={BookmarkCheck} off={Bookmark} size={15} />
      {saved ? 'Saved' : 'Save'}
    </button>
  )
}
