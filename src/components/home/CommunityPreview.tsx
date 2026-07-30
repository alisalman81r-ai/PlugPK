// src/components/home/CommunityPreview.tsx
'use client'

import { ArrowRight, Clock, Heart, MapPin, MessageSquare, Route, Users } from 'lucide-react'
import Link from 'next/link'

import { Badge, Button, EyebrowBadge, type BadgeVariant } from '@/components/ui'
import { MOCK_POSTS } from '@/lib/mock-data'
import type { PostCategory } from '@/lib/types'
import { formatRelativeTime, getPostCategoryConfig } from '@/lib/utils'

/** getPostCategoryConfig().color is a plain string; map it to a Badge variant. */
const CATEGORY_VARIANT: Record<PostCategory, BadgeVariant> = {
  general: 'blue',
  'charging-experience': 'green',
  'trip-report': 'purple',
  'vehicle-review': 'amber',
  'buying-advice': 'cyan',
  'ev-news': 'red',
}

interface CommunityStat {
  icon: typeof Users
  value: string
  label: string
}

const COMMUNITY_STATS: CommunityStat[] = [
  { icon: Users, value: '5,000+', label: 'Active EV Owners' },
  { icon: MessageSquare, value: '1,200+', label: 'Discussions' },
  { icon: Route, value: '450+', label: 'Trip Reports' },
  { icon: MapPin, value: '18', label: 'Cities Active' },
]

interface Club {
  name: string
  city: string
  members: number
}

const CLUBS: Club[] = [
  { name: 'Lahore EV Owners Club', city: 'Lahore', members: 234 },
  { name: 'Islamabad EV Community', city: 'Islamabad', members: 178 },
  { name: 'Karachi Electric Riders', city: 'Karachi', members: 156 },
]

const POSTS = MOCK_POSTS.slice(0, 2)

export function CommunityPreview() {
  return (
    <section className="section-padding bg-slate-50">
      <div className="container-plug">
        <div className="grid items-center gap-16 lg:grid-cols-[3fr_2fr]">
          {/* ── Left — posts ────────────────────────────────────── */}
          <div>
            <div className="mb-6">
              <EyebrowBadge color="cyan">Community</EyebrowBadge>
            </div>

            <h2 className="mb-4 text-4xl font-black tracking-tight text-slate-900 lg:text-display-md">
              Pakistan&apos;s EV
              <br />
              Community
            </h2>

            <p className="mb-10 text-lg text-slate-500">
              Connect with thousands of EV owners. Share experiences, get advice, and plan trips
              together.
            </p>

            {POSTS.map((post) => {
              const config = getPostCategoryConfig(post.category)

              return (
                <Link
                  key={post.id}
                  href="/community"
                  className="mb-4 block cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-sm font-bold text-white"
                      >
                        {post.userName.charAt(0)}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-slate-900">
                          {post.userName}
                        </span>
                        {post.userVehicle ? (
                          <span className="block text-xs text-slate-400">{post.userVehicle}</span>
                        ) : null}
                      </span>
                    </div>

                    <Badge variant={CATEGORY_VARIANT[post.category]} size="sm">
                      {config.label}
                    </Badge>
                  </div>

                  <h3 className="mb-2 mt-3 line-clamp-2 text-[15px] font-semibold text-slate-900">
                    {post.title}
                  </h3>
                  <p className="line-clamp-2 text-sm leading-relaxed text-slate-500">
                    {post.content}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock size={12} aria-hidden="true" />
                      {formatRelativeTime(post.createdAt)}
                    </span>
                    <span className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Heart size={12} aria-hidden="true" />
                        {post.likeCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare size={12} aria-hidden="true" />
                        {post.commentCount}
                      </span>
                    </span>
                  </div>
                </Link>
              )
            })}

            <Link
              href="/community"
              className="mt-6 flex items-center gap-1 text-sm font-medium text-plug-blue-600 hover:underline"
            >
              View all discussions
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>

          {/* ── Right — stats + clubs ───────────────────────────── */}
          <div>
            <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-card">
              <h3 className="mb-6 text-2xl font-bold text-slate-900">Join the Community</h3>

              {COMMUNITY_STATS.map((stat, index) => {
                const Icon = stat.icon
                const isLast = index === COMMUNITY_STATS.length - 1

                return (
                  <div
                    key={stat.label}
                    className={
                      isLast
                        ? 'flex items-center gap-4'
                        : 'mb-4 flex items-center gap-4 border-b border-slate-100 pb-4'
                    }
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                      <Icon size={20} className="text-plug-blue-600" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-2xl font-black text-slate-900">{stat.value}</span>
                      <span className="block text-sm text-slate-500">{stat.label}</span>
                    </span>
                  </div>
                )
              })}

              <Button
                href="/signup"
                fullWidth
                rightIcon={<ArrowRight size={16} />}
                className="mt-8 h-12"
              >
                Join Free
              </Button>
            </div>

            <div className="rounded-2xl bg-gradient-brand p-6 text-white">
              <h3 className="mb-4 text-lg font-bold text-white">EV Clubs Near You</h3>

              {CLUBS.map((club, index) => (
                <div
                  key={club.name}
                  className={
                    index === CLUBS.length - 1
                      ? 'flex items-center justify-between py-3'
                      : 'flex items-center justify-between border-b border-white/20 py-3'
                  }
                >
                  <span>
                    <span className="block text-sm font-medium text-white">{club.name}</span>
                    <span className="block text-xs text-white/60">{club.city}</span>
                  </span>
                  <span className="font-mono text-xs text-white/80">{club.members} members</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
