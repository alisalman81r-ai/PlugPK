// src/components/business/BusinessOverview.tsx
'use client'

import { ArrowRight, CheckCircle2, Eye, Navigation2, Star, TrendingUp, Zap, type LucideIcon } from 'lucide-react'
import Link from 'next/link'

import { ConnectorBadge, RatingStars, SpeedBadge } from '@/components/ui'
import type { BusinessAnalytics } from '@/lib/mock-data'
import type { Business } from '@/lib/types'
import { cn, formatRelativeTime } from '@/lib/utils'

export interface BusinessOverviewProps {
  business: Business
  analytics: BusinessAnalytics
  totalViews: number
  totalClicks: number
  conversionRate: string
  viewsGrowth: number
  clicksGrowth: number
}

interface StatCard {
  icon: LucideIcon
  tone: string
  value: string
  label: string
  growth?: number
  note?: string
}

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning,'
  if (hour < 18) return 'Good afternoon,'
  return 'Good evening,'
}

const PREMIUM_BENEFITS = [
  'Priority placement on map',
  'Full analytics dashboard',
  'Promoted in search results',
]

export function BusinessOverview({
  business,
  analytics,
  totalViews,
  totalClicks,
  conversionRate,
  viewsGrowth,
  clicksGrowth,
}: BusinessOverviewProps) {
  const station = business.stations[0]
  const reviews = station?.reviews ?? []
  const listingSlug = station?.slug

  const stats: StatCard[] = [
    {
      icon: Eye,
      tone: 'bg-blue-50 text-plug-blue-600',
      value: totalViews.toLocaleString('en-PK'),
      label: 'Profile Views',
      growth: viewsGrowth,
    },
    {
      icon: Navigation2,
      tone: 'bg-green-50 text-green-600',
      value: totalClicks.toLocaleString('en-PK'),
      label: 'Navigate Clicks',
      growth: clicksGrowth,
    },
    {
      icon: Star,
      tone: 'bg-amber-50 text-amber-600',
      value: analytics.thisMonth.avgRating.toFixed(1),
      label: 'Avg Rating',
    },
    {
      icon: TrendingUp,
      tone: 'bg-purple-50 text-purple-600',
      value: conversionRate,
      label: 'Conversion Rate',
      note: 'clicks per 100 views',
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      {/* ── Welcome banner ───────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px]"
        />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0">
            <p className="text-base text-white/60">{greeting()}</p>
            <p className="text-3xl font-black text-white">{business.name}</p>

            <span
              className={cn(
                'mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5',
                business.isVerified
                  ? 'border-green-400/30 bg-green-500/20'
                  : 'border-amber-400/30 bg-amber-500/20',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  business.isVerified ? 'bg-green-400' : 'bg-amber-400',
                )}
              />
              <span
                className={cn(
                  'text-xs font-semibold',
                  business.isVerified ? 'text-green-300' : 'text-amber-300',
                )}
              >
                {business.isVerified ? 'Live ✓' : 'Under Review'}
              </span>
            </span>
          </div>

          {listingSlug ? (
            <Link
              href={`/station/${listingSlug}`}
              className="hidden items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 font-semibold text-white transition-colors hover:bg-white/20 sm:flex"
            >
              View Your Listing
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="mb-4 flex items-start justify-between gap-2">
                <span
                  className={cn('flex h-11 w-11 items-center justify-center rounded-xl', stat.tone)}
                >
                  <Icon size={20} aria-hidden="true" />
                </span>

                {stat.growth !== undefined ? (
                  <span
                    className={cn(
                      'rounded-full px-2 py-1 text-xs font-semibold',
                      stat.growth >= 0
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700',
                    )}
                  >
                    {stat.growth >= 0 ? '↑' : '↓'} {Math.abs(stat.growth)}%
                  </span>
                ) : null}
              </div>

              <p className="font-mono text-3xl font-black text-slate-900">{stat.value}</p>
              <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
              <p className="mt-2 text-xs text-slate-400">{stat.note ?? 'vs last month'}</p>
            </div>
          )
        })}
      </div>

      {/* ── Content grid ─────────────────────────────────────── */}
      <div className="grid items-start gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex min-w-0 flex-col gap-8">
          <section>
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-900">Your Chargers</h2>
              <Link
                href="/business/chargers"
                className="flex items-center gap-1 text-sm font-medium text-plug-blue-600 hover:underline"
              >
                Manage
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              {(station?.connectors ?? []).map((charger) => (
                <div
                  key={charger.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <ConnectorBadge type={charger.type} size="sm" />
                    <SpeedBadge speedKw={charger.maxPowerKw} size="sm" />
                  </span>

                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={cn(
                        'h-2 w-2 rounded-full',
                        charger.status === 'offline' ? 'bg-red-400' : 'bg-green-500',
                      )}
                    />
                    <span className="text-sm text-slate-600">
                      {charger.status === 'offline' ? 'Offline' : 'Available'}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-900">Recent Reviews</h2>
              <Link
                href="/business/reviews"
                className="flex items-center gap-1 text-sm font-medium text-plug-blue-600 hover:underline"
              >
                View all
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              {reviews.slice(0, 3).map((review) => (
                <div key={review.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                    <RatingStars rating={review.rating} size="sm" showNumber />
                    <span className="text-xs text-slate-400">
                      {formatRelativeTime(review.date)}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">
                    {review.comment}
                  </p>
                  <Link
                    href="/business/reviews"
                    className="mt-3 inline-block text-sm font-medium text-plug-blue-600 hover:underline"
                  >
                    Reply
                  </Link>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-8">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-5 text-lg font-bold text-slate-900">Traffic Sources</h2>

            {analytics.topReferrers.map((referrer) => (
              <div key={referrer.source} className="mb-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-700">{referrer.source}</span>
                  <span className="text-sm font-bold text-slate-900">{referrer.count}</span>
                </div>
                <span className="mt-1 block h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  {/* Width is data-driven, so it cannot be a static utility. */}
                  <span
                    className="block h-full rounded-full bg-gradient-brand"
                    style={{ width: `${referrer.percent}%` }}
                  />
                </span>
              </div>
            ))}
          </section>

          {!business.isPremium ? (
            <section className="rounded-2xl bg-gradient-brand p-6">
              <Zap size={28} className="mb-3 text-white" aria-hidden="true" />
              <h2 className="mb-2 text-lg font-bold text-white">Unlock Premium Features</h2>
              <p className="mb-5 text-sm text-white/70">
                Priority listing, analytics, and more.
              </p>

              <ul className="mb-5 flex flex-col gap-2">
                {PREMIUM_BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="shrink-0 text-white" aria-hidden="true" />
                    <span className="text-sm text-white/90">{benefit}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/business/upgrade"
                className="flex h-11 w-full items-center justify-center rounded-xl bg-white font-bold text-plug-blue-600 transition-colors hover:bg-blue-50"
              >
                Upgrade to Premium &rarr;
              </Link>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}
