// src/components/station/SaveStationButton.tsx
'use client'

import Link from 'next/link'
import * as React from 'react'

import { MorphIcon } from '@/components/ui'
import { Bookmark, BookmarkCheck } from '@/components/ui/icons'
import { useSavedStations } from '@/hooks/useSavedStations'
import { cn } from '@/lib/utils'

/**
 * Save a station to the account, from anywhere a station is shown.
 *
 * Renders nothing while the session is being worked out. For a visitor who is
 * signed out it renders nothing either — unless `signedOutHref` is given, in
 * which case it is a link to sign in that comes back here. The station page
 * passes one, because "Save" is the action a visitor came there to find; a grid
 * of cards does not, because twelve sign-in links on one screen is noise.
 * Saved stations appear on the dashboard's Saved Stations.
 *
 *   overlay  a round icon for the corner of a photo
 *   chip     an icon-and-word button for a list row
 */

export interface SaveStationButtonProps {
  stationId: string
  stationName: string
  variant?: 'overlay' | 'chip'
  /** Where a signed-out visitor is sent instead, e.g. `/login?redirect=...`. */
  signedOutHref?: string
  className?: string
}

export function SaveStationButton({
  stationId,
  stationName,
  variant = 'chip',
  signedOutHref,
  className,
}: SaveStationButtonProps) {
  const { signedIn, isSaved, toggle } = useSavedStations()
  if (signedIn === false && signedOutHref) {
    return (
      <Link
        href={signedOutHref}
        aria-label={`Sign in to save `}
        className={cn(
          'inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-ui-sm font-semibold text-slate-600 transition-colors hover:border-plug-blue-200 hover:text-plug-blue-700',
          className,
        )}
      >
        <Bookmark size={15} aria-hidden="true" />
        Save
      </Link>
    )
  }
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
