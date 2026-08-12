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
  ShieldCheck,
} from 'lucide-react'
import * as React from 'react'

import { RatingStars, StatusBadge } from '@/components/ui'
import type { DayHours, Station } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface StationSidebarProps {
  station: Station
}

function openDirections(station: Station) {
  window.open(
    `https://www.google.com/maps/dir/?api=1&destination=${station.coordinates.lat},${station.coordinates.lng}`,
    '_blank',
    'noopener,noreferrer',
  )
}

/**
 * Mobile sticky navigate bar. Lives here rather than in its own file because
 * the phase's file list is fixed, and it shares this module's navigate logic.
 * Sits above the 64px BottomTabBar plus the device safe area.
 */
export function StationMobileBar({ station }: StationSidebarProps) {
  return (
    <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 flex items-center gap-3 border-t border-slate-100 bg-white px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] lg:hidden">
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-slate-900">{station.name}</p>
        <RatingStars rating={station.rating} size="sm" showNumber />
      </div>

      <button
        type="button"
        onClick={() => openDirections(station)}
        className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-gradient-brand px-6 font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.30)]"
      >
        Navigate
        <Navigation2 size={18} aria-hidden="true" />
      </button>
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

function formatDay(hours: DayHours): string {
  return hours.isClosed ? 'Closed' : `${hours.open} – ${hours.close}`
}

export function StationSidebar({ station }: StationSidebarProps) {
  const [isSaved, setIsSaved] = React.useState(false)
  const [isCopied, setIsCopied] = React.useState(false)
  const [todayKey, setTodayKey] = React.useState<DayKey | null>(null)

  // Resolved after mount so the highlighted row reflects the visitor's day
  // rather than the day this page was statically generated.
  React.useEffect(() => {
    setTodayKey(DAY_KEYS[new Date().getDay()] ?? null)
  }, [])

  const fullAddress = `${station.address.street}, ${station.address.area}, ${station.address.city}, ${station.address.province}`

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

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: station.name, url })
        return
      } catch {
        // User dismissed the share sheet.
      }
    }
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // Ignore — nothing else to fall back to.
    }
  }

  return (
    <div className="flex w-[340px] shrink-0 flex-col gap-5">
      {/* ── Main action card ─────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="mb-5">
          <StatusBadge status={station.status} className="w-full justify-center" />
        </div>

        <h2 className="mb-1 flex items-center gap-2 text-xl font-bold text-slate-900">
          {station.name}
          {station.isVerified ? (
            <span className="group/tip relative inline-flex shrink-0">
              <ShieldCheck size={18} className="text-plug-blue-600" aria-label="Verified station" />
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover/tip:opacity-100">
                Verified by Plug.pk
              </span>
            </span>
          ) : null}
        </h2>

        <div className="mb-4">
          <RatingStars
            rating={station.rating}
            reviewCount={station.reviewCount}
            size="sm"
            showNumber
            showCount
          />
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
              {isCopied ? (
                <Check size={14} className="text-green-500" />
              ) : (
                <Copy size={14} />
              )}
            </button>
          </p>
        </div>

        <div className="border-t border-slate-100" />

        <button
          type="button"
          onClick={handleNavigate}
          className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-brand text-base font-bold text-white shadow-[0_12px_35px_rgba(37,99,235,0.30)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_45px_rgba(37,99,235,0.45)]"
        >
          Navigate
          <Navigation2 size={20} aria-hidden="true" />
        </button>

        <div className="mt-3 grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setIsSaved((current) => !current)}
            aria-pressed={isSaved}
            className={cn(
              'group/act flex h-11 flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 transition-colors duration-150 hover:border-blue-200 hover:bg-blue-50',
              isSaved && 'border-blue-200 bg-blue-50',
            )}
          >
            {isSaved ? (
              <BookmarkCheck size={18} className="text-plug-blue-600" aria-hidden="true" />
            ) : (
              <Bookmark
                size={18}
                className="text-slate-500 group-hover/act:text-plug-blue-600"
                aria-hidden="true"
              />
            )}
            <span
              className={cn(
                'text-ui-xs font-medium',
                isSaved ? 'text-plug-blue-600' : 'text-slate-500',
              )}
            >
              {isSaved ? 'Saved' : 'Save'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="group/act flex h-11 flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 transition-colors duration-150 hover:border-blue-200 hover:bg-blue-50"
          >
            <Share2
              size={18}
              className="text-slate-500 group-hover/act:text-plug-blue-600"
              aria-hidden="true"
            />
            <span className="text-ui-xs font-medium text-slate-500">Share</span>
          </button>

          <button
            type="button"
            className="group/act flex h-11 flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 transition-colors duration-150 hover:border-blue-200 hover:bg-blue-50"
          >
            <Flag
              size={18}
              className="text-slate-500 group-hover/act:text-plug-blue-600"
              aria-hidden="true"
            />
            <span className="text-ui-xs font-medium text-slate-500">Report</span>
          </button>
        </div>
      </div>

      {/* ── Hours ────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
          <Clock size={18} className="text-plug-blue-600" aria-hidden="true" />
          Operating Hours
        </h3>

        {station.operatingHours.is24Hours ? (
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
                    isToday && 'bg-blue-50',
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
      {station.phone || station.website ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="mb-4 font-semibold text-slate-900">Contact</h3>

          <div className="flex flex-col gap-3">
            {station.phone ? (
              <a
                href={`tel:${station.phone.replace(/\s/g, '')}`}
                className="flex items-center gap-3 text-sm text-slate-700 transition-colors hover:text-plug-blue-600"
              >
                <Phone size={16} className="shrink-0 text-plug-blue-600" aria-hidden="true" />
                {station.phone}
              </a>
            ) : null}

            {station.website ? (
              <a
                href={station.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 truncate text-sm text-plug-blue-600 hover:underline"
              >
                <Globe size={16} className="shrink-0" aria-hidden="true" />
                <span className="truncate">{station.website.replace(/^https?:\/\//, '')}</span>
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
