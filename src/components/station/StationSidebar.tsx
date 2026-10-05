// src/components/station/StationSidebar.tsx
'use client'

import {
  Bookmark,
  BookmarkCheck,
  Check,
  Clock,
  Copy,
  Flag,
  Globe,
  MapPin,
  Navigation2,
  Phone,
  Share2,
} from '@/components/ui/icons'
import Link from 'next/link'
import * as React from 'react'

import { AnimatedIcon, HoverButton, MorphIcon, RatingStars } from '@/components/ui'
import { useSavedStations } from '@/hooks/useSavedStations'
import { recordBusinessDirections } from '@/lib/db/business-actions'
import { SITE_CONFIG } from '@/lib/constants'
import { isSampleListing, publicWebsite } from '@/lib/sample-listings'
import type { DayHours, OperatingHours, Station } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface StationSidebarProps {
  station: Station
}

/** Where problems with a listing are reported — the address the legal pages use. */
const SUPPORT_EMAIL = SITE_CONFIG.email

function openDirections(station: Station) {
  // Counted before the tab opens, and deliberately not awaited: a driver asking
  // for directions should never wait on a metric. Business listings only —
  // stations entered by an operator have no owner to report to.
  if (station.businessId) {
    void recordBusinessDirections(station.businessId).catch(() => {})
  }

  window.open(
    `https://www.google.com/maps/dir/?api=1&destination=${station.coordinates.lat},${station.coordinates.lng}`,
    '_blank',
    'noopener,noreferrer',
  )
}

/**
 * Save, Share and Report — one implementation for the desktop sidebar and the
 * phone's bottom bar.
 *
 * ── Why the saved state is fetched here ──────────────────────────────
 *
 * The page used to read the session on the server to fill this in, which made
 * every station page dynamic: one cookie read, and nothing under /station could
 * be cached. The page is static now and this asks once, on the client, through
 * the same shared store every other Save button on the site uses.
 *
 * ── Why Save is shown to signed-out visitors ─────────────────────────
 *
 * It was hidden from them, so the one action a visitor came to find was not
 * there and nothing said why. Signed out, it is a link to sign in that comes
 * straight back to this station.
 */
function useStationActions(station: Station) {
  const { signedIn, isSaved, toggle } = useSavedStations()
  const [saveError, setSaveError] = React.useState<string | null>(null)
  const [shareState, setShareState] = React.useState<'idle' | 'copied' | 'failed'>('idle')
  const [pageUrl, setPageUrl] = React.useState(`/station/${station.slug}`)

  // The absolute URL is only known in the browser; the path stands in for the
  // first paint so the mailto body is never empty.
  React.useEffect(() => {
    setPageUrl(`${window.location.origin}${window.location.pathname}`)
  }, [])

  const saved = isSaved(station.id)
  const signInHref = `/login?redirect=${encodeURIComponent(`/station/${station.slug}`)}`

  const onSave = async () => {
    setSaveError(null)
    const ok = await toggle(station.id)
    if (!ok) setSaveError('Could not save this listing. Try again.')
  }

  const onShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: station.name, url })
        return
      } catch {
        // Dismissed, or the platform refused — fall through to copying.
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setShareState('copied')
    } catch {
      setShareState('failed')
    }
    window.setTimeout(() => setShareState('idle'), 2000)
  }

  const reportHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    `Problem with ${station.name}`,
  )}&body=${encodeURIComponent(pageUrl)}`

  return { signedIn, saved, signInHref, onSave, saveError, onShare, shareState, reportHref }
}

const TILE =
  'group/act flex h-11 flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 transition-colors duration-150 hover:border-plug-blue-200 hover:bg-plug-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500'
const TILE_ICON = 'text-slate-500 group-hover/act:text-plug-blue-600'
const TILE_LABEL = 'text-ui-xs font-medium text-slate-500'

function ActionTiles({ station, className }: { station: Station; className?: string }) {
  const { signedIn, saved, signInHref, onSave, saveError, onShare, shareState, reportHref } =
    useStationActions(station)

  return (
    <>
      <div className={cn('grid grid-cols-3 gap-3', className)}>
        {signedIn === false ? (
          <Link href={signInHref} className={TILE} aria-label={`Sign in to save ${station.name}`}>
            <Bookmark size={18} className={TILE_ICON} aria-hidden="true" />
            <span className={TILE_LABEL}>Save</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => void onSave()}
            // Unknown for a moment while the session is read; not pressable
            // until then, so a tap cannot be lost.
            disabled={signedIn === null}
            aria-pressed={saved}
            className={cn(TILE, saved && 'border-plug-blue-200 bg-plug-blue-50', 'disabled:opacity-60')}
          >
            <MorphIcon
              active={saved}
              on={BookmarkCheck}
              off={Bookmark}
              size={18}
              className={saved ? 'text-plug-blue-600' : TILE_ICON}
            />
            <span className={cn(TILE_LABEL, saved && 'text-plug-blue-600')}>
              {saved ? 'Saved' : 'Save'}
            </span>
          </button>
        )}

        <button type="button" onClick={() => void onShare()} className={TILE}>
          <MorphIcon
            active={shareState === 'copied'}
            on={Check}
            off={Share2}
            size={18}
            className={shareState === 'copied' ? 'text-green-600' : TILE_ICON}
          />
          <span className={TILE_LABEL} aria-live="polite">
            {shareState === 'copied' ? 'Link copied' : shareState === 'failed' ? 'Copy failed' : 'Share'}
          </span>
        </button>

        <a href={reportHref} className={TILE}>
          <Flag size={18} className={TILE_ICON} aria-hidden="true" />
          <span className={TILE_LABEL}>Report</span>
        </a>
      </div>

      {saveError ? (
        <p role="alert" className="mt-3 text-center text-ui-sm text-red-600">
          {saveError}
        </p>
      ) : null}
    </>
  )
}

/**
 * Mobile sticky bar: the name, Navigate, and the same Save / Share / Report the
 * desktop sidebar carries. The sidebar is `hidden lg:block`, so before this row
 * existed a phone could navigate to a station and do nothing else with it.
 *
 * Lives here rather than in its own file because it shares this module's
 * navigate and action logic. Sits above the 64px BottomTabBar plus the device
 * safe area.
 */
export function StationMobileBar({ station }: StationSidebarProps) {
  return (
    <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 border-t border-slate-100 bg-white px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] lg:hidden">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">{station.name}</p>
          {station.reviewCount > 0 ? (
            <RatingStars rating={station.rating} size="sm" showNumber />
          ) : (
            <p className="text-ui-xs text-slate-500">No reviews yet</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => openDirections(station)}
          className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-gradient-brand px-6 font-semibold text-white shadow-[0_8px_20px_rgba(11,51,44,0.30)]"
        >
          Navigate
          <Navigation2 size={18} aria-hidden="true" />
        </button>
      </div>

      <ActionTiles station={station} className="mt-3" />
    </div>
  )
}

const DAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const

type DayKey = (typeof DAY_KEYS)[number]

const DAY_LABEL: Record<DayKey, string> = {
  sunday: 'Sunday',
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
}

/** Monday-first display order, independent of the Date.getDay() indexing. */
const DISPLAY_ORDER: DayKey[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

function formatDay(hours: DayHours | undefined): string {
  if (!hours) return '—'
  return hours.isClosed ? 'Closed' : `${hours.open} – ${hours.close}`
}

/**
 * Whether any hours were actually given.
 *
 * Business listings do not collect opening times, and arrive with every day
 * marked closed so the type holds (HOURS_UNKNOWN in business-to-station). Drawn
 * as a table, that read "Closed" seven days a week — a claim nobody made.
 */
function hoursStated(hours: OperatingHours | undefined): boolean {
  if (!hours) return false
  if (hours.is24Hours) return true
  return DISPLAY_ORDER.some((day) => {
    const entry = hours[day]
    return entry !== undefined && !entry.isClosed && entry.open !== ''
  })
}

export function StationSidebar({ station }: StationSidebarProps) {
  const [isCopied, setIsCopied] = React.useState(false)
  const [todayKey, setTodayKey] = React.useState<DayKey | null>(null)

  // Resolved after mount so the highlighted row reflects the visitor's day
  // rather than the day this page was statically generated.
  React.useEffect(() => {
    setTodayKey(DAY_KEYS[new Date().getDay()] ?? null)
  }, [])

  const fullAddress = [
    station.address.street,
    station.address.area,
    station.address.city,
    station.address.province,
  ]
    .filter(Boolean)
    .join(', ')

  /*
    Contact details only when they can be used. A sample listing's phone number
    was made up with the sample data — and a made-up number can belong to
    somebody real — and an example.pk website goes nowhere.
  */
  const isExample = isSampleListing(station.id)
  const phone = isExample ? null : (station.phone ?? null)
  const website = publicWebsite(station.website)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullAddress)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      // Clipboard can be blocked by permissions; failing silently is fine here.
    }
  }

  const handleNavigate = () => openDirections(station)

  return (
    <div className="flex w-[340px] shrink-0 flex-col gap-5">
      {/* ── Main action card ─────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        {/* No status badge: there is no live feed from the hardware, so
            "Available" would be a claim. No "Verified" either — nothing
            verifies a station. */}
        <h2 className="mb-1 text-xl font-bold text-slate-900">{station.name}</h2>

        <div className="mb-4">
          {station.reviewCount > 0 ? (
            <RatingStars
              rating={station.rating}
              reviewCount={station.reviewCount}
              size="sm"
              showNumber
              showCount
            />
          ) : (
            <p className="text-sm text-slate-500">No reviews yet</p>
          )}
        </div>

        <div className="mb-6 flex items-start gap-2">
          <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-slate-600">
            {fullAddress}
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy address"
              className="ml-1.5 inline-flex translate-y-0.5 text-slate-400 transition-colors hover:text-plug-blue-600"
            >
              <MorphIcon
                active={isCopied}
                on={Check}
                off={Copy}
                size={14}
                className={cn('inline-flex', isCopied && 'text-green-500')}
              />
            </button>
          </p>
        </div>

        <div className="border-t border-slate-100" />

        <HoverButton
          type="button"
          onClick={handleNavigate}
          className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-brand text-base font-bold text-white shadow-[0_12px_35px_rgba(11,51,44,0.30)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_45px_rgba(11,51,44,0.45)]"
        >
          Navigate
          <AnimatedIcon motion="travel">
            <Navigation2 size={20} aria-hidden="true" />
          </AnimatedIcon>
        </HoverButton>

        <ActionTiles station={station} className="mt-3" />
      </div>

      {/* ── Hours ────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
          <Clock size={18} className="text-plug-blue-600" aria-hidden="true" />
          Operating Hours
        </h3>

        {!hoursStated(station.operatingHours) ? (
          <p className="text-sm text-slate-500">Opening hours have not been given for this listing.</p>
        ) : station.operatingHours.is24Hours ? (
          <span className="inline-flex rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700">
            Open 24 Hours
          </span>
        ) : (
          <div className="flex flex-col gap-1">
            {DISPLAY_ORDER.map((day) => {
              const isToday = day === todayKey

              return (
                <div
                  key={day}
                  className={cn(
                    'flex items-center justify-between rounded-lg px-2 py-1',
                    isToday && 'bg-plug-blue-50',
                  )}
                >
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isToday ? 'text-plug-blue-700' : 'text-slate-700',
                    )}
                  >
                    {DAY_LABEL[day]}
                  </span>
                  <span
                    className={cn(
                      'font-mono text-sm',
                      isToday ? 'text-plug-blue-700' : 'text-slate-500',
                    )}
                  >
                    {formatDay(station.operatingHours[day])}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Contact ──────────────────────────────────────────── */}
      {phone || website ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="mb-4 font-semibold text-slate-900">Contact</h3>

          <div className="flex flex-col gap-3">
            {phone ? (
              <a
                href={`tel:${phone.replace(/\s/g, '')}`}
                className="flex items-center gap-3 text-sm text-slate-700 transition-colors hover:text-plug-blue-600"
              >
                <Phone size={16} className="shrink-0 text-plug-blue-600" aria-hidden="true" />
                {phone}
              </a>
            ) : null}

            {website ? (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 truncate text-sm text-plug-blue-600 hover:underline"
              >
                <Globe size={16} className="shrink-0" aria-hidden="true" />
                <span className="truncate">
                  {website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </span>
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
