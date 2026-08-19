// src/components/business/BusinessAnalytics.tsx
'use client'

import { Eye, MessageSquare, Navigation2, Star, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react'
import * as React from 'react'

import type { BusinessAnalyticsData } from '@/lib/db/queries'
import { cn } from '@/lib/utils'

/**
 * What the owner's listing actually did.
 *
 * Every figure here comes from BusinessDailyStat and Review — rows written when
 * a real visitor opened the listing or pressed its directions button. Before,
 * this page read a fixed array: 1,240 views and 89 clicks that never moved,
 * shown to any owner regardless of whether their listing was even approved.
 *
 * The premium gate is gone too. It blurred these numbers behind an "Upgrade to
 * Premium" button pointing at /business/upgrade, which does not exist, and a
 * pricing page that was removed — so the owner's own data sat behind a door
 * with nothing on the other side.
 */

export interface BusinessAnalyticsProps {
  analytics: BusinessAnalyticsData
  /** Approved listings can accumulate figures; others cannot be visited. */
  isLive: boolean
}

type RangeKey = 7 | 30 | 60

const RANGES: RangeKey[] = [7, 30, 60]

function percentChange(current: number, previous: number): number | null {
  // No baseline means no percentage. Reporting "+100%" against a month of zero
  // would dress up the first visit as growth.
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

function Delta({ current, previous }: { current: number; previous: number }) {
  const change = percentChange(current, previous)
  if (change === null || change === 0) return null

  const up = change > 0
  const Icon = up ? TrendingUp : TrendingDown

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-ui-xs font-semibold',
        up ? 'text-green-600' : 'text-slate-500',
      )}
    >
      <Icon size={12} aria-hidden="true" />
      {up ? '+' : ''}
      {change}%
    </span>
  )
}

export function BusinessAnalytics({ analytics, isLive }: BusinessAnalyticsProps) {
  const [range, setRange] = React.useState<RangeKey>(30)

  const points = React.useMemo(
    () => analytics.chartData.slice(-range),
    [analytics.chartData, range],
  )

  // At least 1, so a quiet listing draws a flat baseline instead of dividing
  // every bar by zero.
  const maxViews = React.useMemo(
    () => Math.max(...points.map((point) => point.views), 1),
    [points],
  )

  const hasAnyActivity = analytics.chartData.some((point) => point.views > 0 || point.clicks > 0)

  const stats: {
    icon: LucideIcon
    tone: string
    value: string
    label: string
    current: number
    previous: number
  }[] = [
    {
      icon: Eye,
      tone: 'bg-blue-50 text-plug-blue-600',
      value: analytics.thisMonth.profileViews.toLocaleString('en-PK'),
      label: 'Listing views',
      current: analytics.thisMonth.profileViews,
      previous: analytics.lastMonth.profileViews,
    },
    {
      icon: Navigation2,
      tone: 'bg-green-50 text-green-600',
      value: analytics.thisMonth.navigateClicks.toLocaleString('en-PK'),
      label: 'Directions taken',
      current: analytics.thisMonth.navigateClicks,
      previous: analytics.lastMonth.navigateClicks,
    },
    {
      icon: Star,
      tone: 'bg-amber-50 text-amber-600',
      value:
        analytics.thisMonth.avgRating === 0 ? '—' : analytics.thisMonth.avgRating.toFixed(1),
      label: 'Average rating',
      current: analytics.thisMonth.avgRating,
      previous: analytics.lastMonth.avgRating,
    },
    {
      icon: MessageSquare,
      tone: 'bg-purple-50 text-purple-600',
      value: String(analytics.thisMonth.reviewsReceived),
      label: 'Reviews received',
      current: analytics.thisMonth.reviewsReceived,
      previous: analytics.lastMonth.reviewsReceived,
    },
  ]

  return (
    <div>
      {!isLive ? (
        <p className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-ui-sm text-amber-800">
          This listing is not approved yet, so drivers cannot open it. Figures start once it is
          live.
        </p>
      ) : null}

      <div className="mb-8 flex gap-2">
        {RANGES.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setRange(option)}
            aria-pressed={range === option}
            className={cn(
              'h-9 rounded-full px-4 text-sm font-medium transition-all duration-150',
              range === option
                ? 'bg-plug-blue-600 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
            )}
          >
            {option} days
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <span
              className={cn(
                'mb-4 flex h-11 w-11 items-center justify-center rounded-xl',
                stat.tone,
              )}
            >
              <stat.icon size={20} aria-hidden="true" />
            </span>
            <p className="font-mono text-3xl font-black text-slate-900">{stat.value}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-sm text-slate-500">{stat.label}</p>
              <Delta current={stat.current} previous={stat.previous} />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-ui-xs text-slate-400">
        Compared with the 30 days before. Views count once per visitor per day.
      </p>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-5 text-lg font-bold text-slate-900">Views per day</h2>

        {hasAnyActivity ? (
          <>
            <div className="flex h-[200px] items-end gap-1" role="img" aria-label="Daily views">
              {points.map((point) => (
                <span
                  key={point.date}
                  title={`${point.date}: ${point.views} view${point.views === 1 ? '' : 's'}, ${point.clicks} directions`}
                  className="flex-1 rounded-t-sm bg-gradient-brand"
                  // A day with no views still draws a hairline, so the bar chart
                  // reads as "a day with nothing" rather than a gap in the axis.
                  style={{ height: `${Math.max((point.views / maxViews) * 100, 1.5)}%` }}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-ui-xs text-slate-400">
              <span>{points[0]?.date}</span>
              <span>{points[points.length - 1]?.date}</span>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center">
            <Eye size={22} className="mx-auto mb-2 text-slate-400" aria-hidden="true" />
            <p className="text-ui-sm text-slate-500">
              {isLive
                ? 'No visits recorded yet. This fills in as drivers open your listing.'
                : 'Nothing to chart until the listing is live.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
