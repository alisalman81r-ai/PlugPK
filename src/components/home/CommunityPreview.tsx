// src/components/home/CommunityPreview.tsx
'use client'

import { ArrowRight, Clock, Heart, MapPin, MessageSquare, Route, Users } from 'lucide-react'

import { CAP_RULE, FACE, FRAME, ICON_FRAME, ICON_GLYPH } from '@/components/shared/frame'
import {
  AnimatedIcon,
  Badge,
  HoverLink,
  HoverMotion,
  PillButton,
  type BadgeVariant,
  type IconMotion,
} from '@/components/ui'
import { MOCK_POSTS } from '@/lib/mock-data'
import type { PostCategory } from '@/lib/types'
import { cn, formatRelativeTime, getPostCategoryConfig } from '@/lib/utils'

/**
 * The community band, brought onto the page's pattern.
 *
 * It was the last section still doing its own thing. Four differences, all of
 * them now gone:
 *
 *   - The heading was left-aligned in the first column with a cyan pill above
 *     it, so it read as a column header rather than as the section's title.
 *     It is now the centred eyebrow / black heading with one blue word / lead
 *     paragraph that the ecosystem band, the four steps and the free band all
 *     open with.
 *   - Two blocks were filled: the clubs list was solid `bg-gradient-brand`
 *     with white text, and the stat icons sat in blue chips. Everywhere else
 *     on this page prominence comes from the edge, the depth and the space —
 *     never from painting the surface — so both are unpainted now, on the
 *     shared frame with outlined icon holders.
 *   - "Join Free" was a filled blue button. It is the pill-and-badge shape
 *     used by the other three sections.
 *   - The cards were a plain border with a hover shadow, rather than the
 *     graded hairline edge that warms to brand on hover.
 *
 * The avatar keeps a fill, and deliberately: it is an identity marker rather
 * than a surface, and initials reversed out of ink stay legible at 40px where
 * an outlined circle would not. Ink, though — not brand.
 */

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
  /** Matched to the glyph — see AnimatedIcon for the set. */
  motion: IconMotion
  value: string
  label: string
}

const COMMUNITY_STATS: CommunityStat[] = [
  { icon: Users, motion: 'pulse', value: '5,000+', label: 'Active EV Owners' },
  { icon: MessageSquare, motion: 'pop', value: '1,200+', label: 'Discussions' },
  { icon: Route, motion: 'slide', value: '450+', label: 'Trip Reports' },
  { icon: MapPin, motion: 'scan', value: '18', label: 'Cities Active' },
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
    <section className="bg-slate-50 py-24 lg:py-32">
      <div className="container-plug">
        {/* ── The heading ──────────────────────────────────────── */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-ui-sm font-bold uppercase tracking-[0.18em] text-plug-blue-600">
            Drivers talking to drivers
          </span>

          <h2 className="mt-4 text-balance text-[clamp(2.5rem,5.5vw,4rem)] font-black leading-[1.02] tracking-[-0.035em] text-slate-900">
            Pakistan&apos;s EV <span className="text-plug-blue-600">community</span>.
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-slate-500">
            Connect with thousands of EV owners. Share experiences, get advice, and plan trips
            together.
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:gap-8">
          {/* ── Recent posts ───────────────────────────────────── */}
          <div className="flex flex-col gap-6">
            {POSTS.map((post) => {
              const config = getPostCategoryConfig(post.category)

              return (
                <HoverLink key={post.id} href="/community" className={FRAME}>
                  <div className={cn(FACE, 'p-6')}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white"
                        >
                          {post.userName.charAt(0)}
                        </span>
                        <span>
                          <span className="block text-ui-sm font-semibold text-slate-900">
                            {post.userName}
                          </span>
                          {post.userVehicle ? (
                            <span className="block text-ui-xs text-slate-400">
                              {post.userVehicle}
                            </span>
                          ) : null}
                        </span>
                      </div>

                      <Badge variant={CATEGORY_VARIANT[post.category]} size="sm">
                        {config.label}
                      </Badge>
                    </div>

                    <span aria-hidden="true" className={cn('mt-5', CAP_RULE)} />

                    <h3 className="mt-4 line-clamp-2 text-lg font-bold leading-snug tracking-tight text-slate-900">
                      {post.title}
                    </h3>
                    <p className="mt-2.5 line-clamp-2 text-ui-sm leading-relaxed text-slate-500">
                      {post.content}
                    </p>

                    {/* Meta stays still: these name a thing rather than being
                        the thing, and moving them is noise. */}
                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="flex items-center gap-1.5 text-ui-xs text-slate-400">
                        <Clock size={12} aria-hidden="true" />
                        {formatRelativeTime(post.createdAt)}
                      </span>
                      <span className="flex items-center gap-4 text-ui-xs text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Heart size={12} aria-hidden="true" />
                          {post.likeCount}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MessageSquare size={12} aria-hidden="true" />
                          {post.commentCount}
                        </span>
                      </span>
                    </div>
                  </div>
                </HoverLink>
              )
            })}

            <HoverLink
              href="/community"
              className="group/cta mt-1 inline-flex items-center gap-2 self-start text-ui-sm font-semibold text-slate-600 transition-colors duration-200 hover:text-plug-blue-700"
            >
              View all discussions
              <AnimatedIcon motion="travel">
                <ArrowRight size={14} aria-hidden="true" />
              </AnimatedIcon>
            </HoverLink>
          </div>

          {/* ── Stats and clubs ────────────────────────────────── */}
          <div className="flex flex-col gap-6">
            <div className={FRAME}>
              <div className={cn(FACE, 'p-7 lg:p-8')}>
                <p className="text-ui-sm font-bold uppercase tracking-[0.18em] text-plug-blue-600">
                  Join the community
                </p>

                <div className="mt-7 flex flex-col">
                  {COMMUNITY_STATS.map((stat, index) => {
                    const Icon = stat.icon

                    return (
                      /* Per row rather than per card, so only the figure being
                         read moves — four icons animating at once is jitter. */
                      <HoverMotion
                        key={stat.label}
                        className={cn(
                          'group/stat flex items-center gap-4 py-4',
                          index > 0 && 'border-t border-slate-100',
                        )}
                      >
                        <span aria-hidden="true" className={cn(ICON_FRAME, 'h-11 w-11 rounded-xl')}>
                          <AnimatedIcon motion={stat.motion}>
                            <Icon size={18} className={ICON_GLYPH} />
                          </AnimatedIcon>
                        </span>
                        <span>
                          <span className="block text-2xl font-black tracking-tight text-slate-900">
                            {stat.value}
                          </span>
                          <span className="block text-ui-sm text-slate-500">{stat.label}</span>
                        </span>
                      </HoverMotion>
                    )
                  })}
                </div>

                <div className="mt-7 flex justify-center">
                  <PillButton href="/signup">Join free</PillButton>
                </div>
              </div>
            </div>

            {/* Unpainted. This was a solid brand gradient with white text —
                the one block on the page that shouted instead of sitting. */}
            <HoverMotion className={FRAME}>
              <div className={cn(FACE, 'p-7')}>
                <span aria-hidden="true" className={cn(ICON_FRAME, 'h-11 w-11 rounded-xl')}>
                  <AnimatedIcon motion="scan">
                    <MapPin size={18} className={ICON_GLYPH} />
                  </AnimatedIcon>
                </span>

                <span aria-hidden="true" className={cn('mt-6', CAP_RULE)} />

                <h3 className="mt-5 text-lg font-bold tracking-tight text-slate-900">
                  EV clubs near you
                </h3>

                <ul className="mt-4 flex flex-col">
                  {CLUBS.map((club, index) => (
                    <li
                      key={club.name}
                      className={cn(
                        'flex items-center justify-between gap-3 py-3',
                        index > 0 && 'border-t border-slate-100',
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-ui-sm font-semibold text-slate-900">
                          {club.name}
                        </span>
                        <span className="block text-ui-xs text-slate-400">{club.city}</span>
                      </span>
                      <span className="shrink-0 font-mono text-ui-xs tabular-nums text-slate-500">
                        {club.members} members
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </HoverMotion>
          </div>
        </div>
      </div>
    </section>
  )
}
