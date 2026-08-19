// src/components/dashboard/DashboardOverview.tsx
import { Bookmark, Calendar, Car, MapPin, Star } from 'lucide-react'
import Link from 'next/link'

import { RatingStars } from '@/components/ui'
import type { MyReviewRow } from '@/lib/db/queries'
import type { Station } from '@/lib/types'
import { formatRelativeTime } from '@/lib/utils'

import type { DashboardStats } from './DashboardSidebar'

/**
 * The signed-in person's own overview.
 *
 * Everything here used to come from MOCK_USER: Ahmed Khan of Lahore, his BYD
 * Atto 3, his three saved stations and his reviews — shown to whoever opened
 * the page, on every account. It now reads the row behind the session.
 *
 * The activity feed is gone with it. Nothing records what an account has done,
 * so the entries were invented; when there is a log to read, it can return.
 */

export interface DashboardOverviewProps {
  user: { name: string; email: string; city?: string; joinedAt: string; vehicle?: string }
  stats: DashboardStats
  savedStations: Station[]
  reviews: MyReviewRow[]
}

const PREVIEW = 3

function EmptyHint({ children, href, cta }: { children: React.ReactNode; href: string; cta: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 px-5 py-8 text-center">
      <p className="text-ui-sm text-slate-500">{children}</p>
      <Link
        href={href}
        className="mt-4 inline-flex h-10 items-center rounded-xl border border-slate-200 px-5 text-ui-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
      >
        {cta}
      </Link>
    </div>
  )
}

export function DashboardOverview({ user, stats, savedStations, reviews }: DashboardOverviewProps) {
  const cards = [
    { icon: Bookmark, tone: 'bg-blue-50 text-plug-blue-600', value: stats.totalSaved, label: 'Saved stations' },
    { icon: Star, tone: 'bg-amber-50 text-amber-600', value: stats.totalReviews, label: 'Reviews written' },
    { icon: Calendar, tone: 'bg-green-50 text-green-600', value: stats.memberDays, label: 'Days as a member' },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* ── Who you are ──────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center gap-4">
          <span
            aria-hidden="true"
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-2xl font-bold text-white"
          >
            {user.name.charAt(0).toUpperCase()}
          </span>

          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
            <p className="mt-0.5 text-ui-sm text-slate-500">{user.email}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-ui-sm text-slate-500">
              {user.city ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={13} className="shrink-0 text-slate-400" aria-hidden="true" />
                  {user.city}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <Car size={13} className="shrink-0 text-slate-400" aria-hidden="true" />
                {user.vehicle ? user.vehicle : 'No vehicle saved'}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <span className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${card.tone}`}>
              <card.icon size={20} aria-hidden="true" />
            </span>
            <p className="font-mono text-3xl font-black text-slate-900">{card.value}</p>
            <p className="mt-1 text-sm text-slate-500">{card.label}</p>
          </div>
        ))}
      </div>

      {/* ── Saved ────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">Saved stations</h2>
          {savedStations.length > PREVIEW ? (
            <Link href="/dashboard/saved" className="text-ui-sm font-semibold text-plug-blue-600 hover:underline">
              See all {savedStations.length}
            </Link>
          ) : null}
        </div>

        {savedStations.length === 0 ? (
          <EmptyHint href="/map" cta="Find stations">
            Nothing saved yet. Use the bookmark on any station to keep it here.
          </EmptyHint>
        ) : (
          <ul className="flex flex-col gap-3">
            {savedStations.slice(0, PREVIEW).map((station) => (
              <li key={station.id}>
                <Link
                  href={`/station/${station.slug}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 transition-colors hover:bg-slate-50"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-slate-900">{station.name}</span>
                    <span className="mt-0.5 block truncate text-ui-sm text-slate-500">
                      {station.address.city} · {station.connectors.length} charger
                      {station.connectors.length === 1 ? '' : 's'}
                    </span>
                  </span>
                  <RatingStars rating={station.rating} size="sm" showNumber />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Your reviews ─────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">Your reviews</h2>
          {reviews.length > PREVIEW ? (
            <Link href="/dashboard/reviews" className="text-ui-sm font-semibold text-plug-blue-600 hover:underline">
              See all {reviews.length}
            </Link>
          ) : null}
        </div>

        {reviews.length === 0 ? (
          <EmptyHint href="/map" cta="Browse stations">
            You have not written a review yet.
          </EmptyHint>
        ) : (
          <ul className="flex flex-col gap-3">
            {reviews.slice(0, PREVIEW).map((review) => (
              <li key={review.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{review.listingName}</p>
                  <span className="text-ui-xs text-slate-400">{formatRelativeTime(review.date)}</span>
                </div>
                <div className="mt-1.5">
                  <RatingStars rating={review.rating} size="sm" />
                </div>
                <p className="mt-2 line-clamp-2 text-ui-sm text-slate-600">{review.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
