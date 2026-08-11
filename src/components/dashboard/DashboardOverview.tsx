// src/components/dashboard/DashboardOverview.tsx
'use client'

import {
  ArrowRight,
  Bookmark,
  Calendar,
  Car,
  Plus,
  Route,
  Star,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'

import { StationCard } from '@/components/home/StationCard'
import { RatingStars } from '@/components/ui'
import type { DashboardStats } from '@/hooks/useDashboard'
import type { ActivityItem, Review, Station, User, UserVehicle } from '@/lib/types'
import { cn, formatRelativeTime } from '@/lib/utils'
import { ActivityFeed } from './ActivityFeed'

export interface DashboardOverviewProps {
  user: User
  stats: DashboardStats
  savedStations: Station[]
  userReviews: Review[]
  activity: ActivityItem[]
  vehicles: UserVehicle[]
}

interface StatCard {
  icon: LucideIcon
  tone: string
  value: number
  label: string
  href?: string
}

interface QuickAction {
  icon: LucideIcon
  tone: string
  label: string
  href: string
}

const QUICK_ACTIONS: QuickAction[] = [
  { icon: Zap, tone: 'bg-blue-50 text-plug-blue-600', label: 'Find Charger', href: '/map' },
  { icon: Route, tone: 'bg-purple-50 text-purple-600', label: 'Plan Route', href: '/routes' },
  { icon: Star, tone: 'bg-amber-50 text-amber-600', label: 'Add Review', href: '/map' },
  { icon: Users, tone: 'bg-green-50 text-green-600', label: 'Join Community', href: '/community' },
]

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning,'
  if (hour < 18) return 'Good afternoon,'
  return 'Good evening,'
}

export function DashboardOverview({
  user,
  stats,
  savedStations,
  userReviews,
  activity,
  vehicles,
}: DashboardOverviewProps) {
  const defaultVehicle = vehicles.find((vehicle) => vehicle.isDefault) ?? vehicles[0]

  const statCards: StatCard[] = [
    {
      icon: Bookmark,
      tone: 'bg-blue-50 text-plug-blue-600',
      value: stats.totalSaved,
      label: 'Saved Stations',
      href: '/dashboard/saved',
    },
    {
      icon: Star,
      tone: 'bg-amber-50 text-amber-600',
      value: stats.totalReviews,
      label: 'Reviews Written',
      href: '/dashboard/reviews',
    },
    {
      icon: Route,
      tone: 'bg-purple-50 text-purple-600',
      value: stats.totalRoutes,
      label: 'Routes Planned',
      href: '/dashboard/routes',
    },
    {
      icon: Calendar,
      tone: 'bg-green-50 text-green-600',
      value: stats.memberDays,
      label: 'Days as Member',
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
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-600/20 blur-[90px]"
        />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0">
            <p className="text-base text-white/60">{greeting()}</p>
            <p className="mb-3 text-3xl font-black text-white">{user.name}</p>

            {defaultVehicle ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2">
                <Car size={16} className="shrink-0 text-plug-cyan-400" aria-hidden="true" />
                <span className="text-sm text-white/80">
                  {defaultVehicle.customName ??
                    `${defaultVehicle.evModel.make} ${defaultVehicle.evModel.model}`}
                </span>
              </span>
            ) : null}
          </div>

          <div className="hidden rounded-2xl border border-white/15 bg-white/10 p-5 text-center sm:block">
            <Zap size={32} className="mx-auto mb-2 text-plug-cyan-400" aria-hidden="true" />
            <p className="text-xs text-white/50">Member for</p>
            <p className="mt-1 text-2xl font-black text-white">{stats.memberDays} days</p>
          </div>
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          const content = (
            <>
              <div className="mb-4 flex items-start justify-between">
                <span className={cn('flex h-11 w-11 items-center justify-center rounded-xl', stat.tone)}>
                  <Icon size={20} aria-hidden="true" />
                </span>
                {stat.href ? (
                  <ArrowRight
                    size={16}
                    className="text-slate-300 transition-transform duration-150 group-hover/stat:translate-x-0.5 group-hover/stat:text-plug-blue-600"
                    aria-hidden="true"
                  />
                ) : null}
              </div>
              <p className="text-3xl font-black tracking-tight text-slate-900">{stat.value}</p>
              <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
            </>
          )

          const className =
            'group/stat rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:border-blue-200 hover:shadow-card'

          return stat.href ? (
            <Link key={stat.label} href={stat.href} className={className}>
              {content}
            </Link>
          ) : (
            <div key={stat.label} className={className}>
              {content}
            </div>
          )
        })}
      </div>

      {/* ── Content grid ─────────────────────────────────────── */}
      <div className="grid items-start gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex min-w-0 flex-col gap-8">
          <section>
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-900">Saved Stations</h2>
              <Link
                href="/dashboard/saved"
                className="flex items-center gap-1 text-sm font-medium text-plug-blue-600 hover:underline"
              >
                View all
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>

            {savedStations.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white py-10 text-center">
                <Bookmark size={40} className="mx-auto text-slate-200" aria-hidden="true" />
                <p className="mt-3 text-sm text-slate-500">No saved stations yet</p>
                <Link
                  href="/map"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-plug-blue-600 hover:underline"
                >
                  Find stations
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {savedStations.slice(0, 2).map((station) => (
                  <StationCard key={station.id} station={station} variant="compact" isSaved />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-900">Recent Reviews</h2>
              <Link
                href="/dashboard/reviews"
                className="flex items-center gap-1 text-sm font-medium text-plug-blue-600 hover:underline"
              >
                View all
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>

            {userReviews.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white py-10 text-center">
                <Star size={40} className="mx-auto text-slate-200" aria-hidden="true" />
                <p className="mt-3 text-sm text-slate-500">No reviews yet</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {userReviews.slice(0, 2).map((review) => (
                  <div
                    key={review.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <RatingStars rating={review.rating} size="sm" showNumber />
                      <span className="text-xs text-slate-400">
                        {formatRelativeTime(review.date)}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-8">
          <section>
            <h2 className="mb-5 text-lg font-bold text-slate-900">Recent Activity</h2>
            <ActivityFeed activity={activity} maxItems={5} />
          </section>

          <section>
            <h2 className="mb-5 text-lg font-bold text-slate-900">My Vehicles</h2>

            {defaultVehicle ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-brand">
                    <Car size={22} className="text-white" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-slate-900">
                      {defaultVehicle.evModel.make} {defaultVehicle.evModel.model}
                    </span>
                    <span className="block text-xs text-slate-400">
                      {defaultVehicle.evModel.year} · {defaultVehicle.evModel.rangeKm}km range
                    </span>
                  </span>
                </div>
              </div>
            ) : null}

            {vehicles.length < 3 ? (
              <Link
                href="/dashboard/vehicles"
                className="mt-3 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-4 text-sm font-medium text-slate-500 transition-colors hover:border-blue-300 hover:bg-blue-50"
              >
                <Plus size={16} aria-hidden="true" />
                Add Vehicle
              </Link>
            ) : null}
          </section>
        </div>
      </div>

      {/* ── Quick actions ────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon

          return (
            <Link
              key={action.label}
              href={action.href}
              className="rounded-2xl border border-slate-200 bg-white p-4 text-center transition-all duration-150 hover:border-blue-200 hover:bg-blue-50"
            >
              <span
                className={cn(
                  'mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl',
                  action.tone,
                )}
              >
                <Icon size={22} aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold text-slate-700">{action.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
