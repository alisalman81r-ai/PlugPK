// src/components/home/CommunityPreview.tsx
'use client'

import { ArrowRight, Clock, Heart, MapPin, MessageSquare, Route, Users } from 'lucide-react'

import { CAP_RULE, FACE, FRAME } from '@/components/shared/frame'
import {
  AnimatedIcon,
  Badge,
  HoverLink,
  HoverMotion,
  PillButton,
  type BadgeVariant,
  type IconMotion,
} from '@/components/ui'
import type { CommunityCounts } from '@/lib/db/queries'
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
 *   - The cards were a plain border with a hover shadow, rather than the
 *     graded hairline edge that warms to brand on hover.
 *   - "Join Free" was a plain filled button. It is the pill-and-badge shape
 *     the other sections use, in its brand tone.
 *
 * The colour is deliberate here and stays. Elsewhere on the page prominence
 * comes from the edge and the space rather than from painting the surface, but
 * this section is the one asked to keep its blue: the avatars, the stat chips
 * and the clubs list are all filled as they were. The clubs card carries the
 * radius and shadow of the framed cards beside it, and its cap rule is white
 * rather than ink, so it still reads as part of the same set rather than a
 * panel from another page.
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
  value: number
  label: string
}

/**
 * The four figures, counted rather than claimed.
 *
 * These were '5,000+ Active EV Owners', '1,200+ Discussions', '450+ Trip
 * Reports' and '18 Cities Active' written into this file, against a database
 * holding no registered users, twelve posts and eight cities — overstating by
 * roughly a hundred times, on the home page, above a link to the very page that
 * would have shown the real numbers.
 *
 * Members are the figure the clubs themselves report, which is what /community
 * shows and is the only membership number this product actually holds.
 */
function communityStats(counts: CommunityCounts): CommunityStat[] {
  return [
    { icon: Users, motion: 'pulse', value: counts.clubMembers, label: counts.clubMembers === 1 ? 'Club member' : 'Club members' },
    { icon: MessageSquare, motion: 'pop', value: counts.discussions, label: counts.discussions === 1 ? 'Discussion' : 'Discussions' },
    { icon: Route, motion: 'slide', value: counts.replies, label: counts.replies === 1 ? 'Reply' : 'Replies' },
    { icon: MapPin, motion: 'scan', value: counts.cities, label: counts.cities === 1 ? 'City active' : 'Cities active' },
  ]
}

const POSTS = MOCK_POSTS.slice(0, 2)

export interface CommunityPreviewProps {
  /**
   * The three biggest clubs, read from the database by the page above.
   *
   * These were three hardcoded rows here — the same names and the same member
   * counts for every visitor, drifting further from the clubs table every time
   * somebody joined one.
   */
  clubs: Array<{ id: string; name: string; city: string; memberCount: number }>
  /** Counted figures from the page above, not written here. */
  counts: CommunityCounts
}

export function CommunityPreview({ clubs, counts }: CommunityPreviewProps) {
  const stats = communityStats(counts)

  return (
    <section className="bg-white py-24 lg:py-32">
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
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-sm font-bold text-white"
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
                  {stats.map((stat, index) => {
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
                        {/* Filled, and staying that way: this section was
                            explicitly asked to keep its blue. See the note at
                            the top of the file. */}
                        <span
                          aria-hidden="true"
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 transition-colors duration-300 group-hover/stat:bg-blue-100"
                        >
                          <AnimatedIcon motion={stat.motion}>
                            <Icon size={20} className="text-plug-blue-600" />
                          </AnimatedIcon>
                        </span>
                        <span>
                          <span className="block text-2xl font-black tracking-tight text-slate-900">
                            {stat.value.toLocaleString('en-PK')}
                          </span>
                          <span className="block text-ui-sm text-slate-500">{stat.label}</span>
                        </span>
                      </HoverMotion>
                    )
                  })}
                </div>

                <div className="mt-7 flex justify-center">
                  <PillButton href="/signup">
                    Join free
                  </PillButton>
                </div>
              </div>
            </div>

            {/* The one painted block on the page, and kept that way on
                request: the clubs list is where the section's colour lives.
                Its radius and shadow match the framed cards beside it so it
                still reads as part of the same set. */}
            <HoverMotion className="group/clubs rounded-3xl bg-gradient-brand p-7 shadow-[0_14px_34px_-14px_rgba(37,99,235,0.55)] transition-shadow duration-300 hover:shadow-[0_20px_44px_-14px_rgba(37,99,235,0.65)]">
              <span
                aria-hidden="true"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-inset ring-white/25"
              >
                <AnimatedIcon motion="scan">
                  <MapPin size={20} className="text-white" />
                </AnimatedIcon>
              </span>

              {/* The ink cap rule would vanish here, so it takes the white. */}
              <span
                aria-hidden="true"
                className="mt-6 block h-0.5 w-10 origin-left rounded-full bg-white/40 transition-all duration-300 group-hover/clubs:w-16 group-hover/clubs:bg-white"
              />

              <h3 className="mt-5 text-lg font-bold tracking-tight text-white">
                EV clubs near you
              </h3>

              <ul className="mt-4 flex flex-col">
                {clubs.map((club, index) => (
                  <li
                    key={club.id}
                    className={cn(
                      'flex items-center justify-between gap-3 py-3',
                      index > 0 && 'border-t border-white/20',
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-ui-sm font-semibold text-white">
                        {club.name}
                      </span>
                      <span className="block text-ui-xs text-white/60">{club.city}</span>
                    </span>
                    <span className="shrink-0 font-mono text-ui-xs tabular-nums text-white/80">
                      {club.memberCount} members
                    </span>
                  </li>
                ))}
              </ul>
            </HoverMotion>
          </div>
        </div>
      </div>
    </section>
  )
}
