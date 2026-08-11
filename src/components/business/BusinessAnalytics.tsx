// src/components/business/BusinessAnalytics.tsx
'use client'

import { BarChart2, Eye, Navigation2, Star, TrendingUp, type LucideIcon } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui'
import type { BusinessAnalytics as BusinessAnalyticsData } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export interface BusinessAnalyticsProps {
  analytics: BusinessAnalyticsData
  isPremium: boolean
}

type RangeKey = 7 | 30 | 90

const RANGES: RangeKey[] = [7, 30, 90]

export function BusinessAnalytics({ analytics, isPremium }: BusinessAnalyticsProps) {
  const [range, setRange] = React.useState<RangeKey>(30)

  const points = React.useMemo(
    () => analytics.chartData.slice(-Math.min(range, analytics.chartData.length)),
    [analytics.chartData, range],
  )

  const maxViews = React.useMemo(
    () => Math.max(...points.map((point) => point.views), 1),
    [points],
  )

  const topDays = React.useMemo(
    () => [...analytics.chartData].sort((a, b) => b.views - a.views).slice(0, 10),
    [analytics.chartData],
  )

  const stats: { icon: LucideIcon; tone: string; value: string; label: string }[] = [
    {
      icon: Eye,
      tone: 'bg-blue-50 text-plug-blue-600',
      value: analytics.thisMonth.profileViews.toLocaleString('en-PK'),
      label: 'Profile Views',
    },
    {
      icon: Navigation2,
      tone: 'bg-green-50 text-green-600',
      value: String(analytics.thisMonth.navigateClicks),
      label: 'Navigate Clicks',
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
      value: String(analytics.thisMonth.reviewsReceived),
      label: 'Reviews Received',
    },
  ]

  if (!isPremium) {
    return (
      <div className="relative">
        {/* Blurred teaser of the real dashboard behind the gate. */}
        <div aria-hidden="true" className="pointer-events-none select-none blur-[6px]">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5">
                <span className={cn('mb-4 flex h-11 w-11 items-center justify-center rounded-xl', stat.tone)}>
                  <stat.icon size={20} />
                </span>
                <p className="font-mono text-3xl font-black text-slate-900">{stat.value}</p>
                <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex h-[200px] items-end gap-1">
              {points.map((point) => (
                <span
                  key={point.date}
                  className="flex-1 rounded-t-sm bg-gradient-brand"
                  style={{ height: `${(point.views / maxViews) * 100}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-10 text-center shadow-xl">
            <BarChart2 size={56} className="mx-auto mb-5 text-plug-blue-600" aria-hidden="true" />
            <h2 className="mb-3 text-2xl font-bold text-slate-900">
              Analytics Available on Premium
            </h2>
            <p className="mb-8 text-slate-500">
              Upgrade to see detailed analytics about your listing performance.
            </p>

            <Button href="/business/upgrade" variant="gradient" fullWidth className="h-12">
              Upgrade to Premium &rarr;
            </Button>
            <Button href="/for-businesses#pricing" variant="ghost" fullWidth className="mt-3">
              View Pricing
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
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
        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5">
              <span
                className={cn('mb-4 flex h-11 w-11 items-center justify-center rounded-xl', stat.tone)}
              >
                <Icon size={20} aria-hidden="true" />
              </span>
              <p className="font-mono text-3xl font-black text-slate-900">{stat.value}</p>
              <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
            </div>
          )
        })}
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-5 font-bold text-slate-900">Daily Profile Views</h2>

        <div className="flex h-[200px] items-end gap-1">
          {points.map((point) => (
            <span key={point.date} className="group/bar relative flex-1">
              <span
                className="block w-full rounded-t-sm bg-gradient-brand transition-[height] duration-[800ms]"
                style={{ height: `${Math.max((point.views / maxViews) * 200, 4)}px` }}
              />
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover/bar:opacity-100">
                {point.date} · {point.views} views
              </span>
            </span>
          ))}
        </div>

        <div className="mt-2 flex justify-between">
          {points
            .filter((_, index) => index % 5 === 0)
            .map((point) => (
              <span key={point.date} className="text-[10px] text-slate-400">
                {point.date.slice(5)}
              </span>
            ))}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-5 font-bold text-slate-900">Traffic Sources</h2>

        {analytics.topReferrers.map((referrer) => (
          <div key={referrer.source} className="mb-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-700">{referrer.source}</span>
              <span className="font-mono text-sm font-bold text-slate-900">
                {referrer.count} · {referrer.percent}%
              </span>
            </div>
            <span className="mt-1 block h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <span
                className="block h-full rounded-full bg-gradient-brand"
                style={{ width: `${referrer.percent}%` }}
              />
            </span>
          </div>
        ))}
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <h2 className="border-b border-slate-100 p-6 font-bold text-slate-900">
          Top Performing Days
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-400">
                <th scope="col" className="px-6 py-3 font-semibold">Day</th>
                <th scope="col" className="px-6 py-3 text-right font-semibold">Views</th>
                <th scope="col" className="px-6 py-3 text-right font-semibold">Clicks</th>
                <th scope="col" className="px-6 py-3 text-right font-semibold">Conversion</th>
              </tr>
            </thead>
            <tbody>
              {topDays.map((day) => (
                <tr key={day.date} className="border-b border-slate-50 last:border-0">
                  <td className="px-6 py-3 font-mono text-slate-700">{day.date}</td>
                  <td className="px-6 py-3 text-right font-mono font-bold text-slate-900">
                    {day.views}
                  </td>
                  <td className="px-6 py-3 text-right font-mono text-slate-700">{day.clicks}</td>
                  <td className="px-6 py-3 text-right font-mono text-slate-500">
                    {((day.clicks / day.views) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
