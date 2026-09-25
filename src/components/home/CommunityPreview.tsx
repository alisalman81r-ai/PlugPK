// src/components/home/CommunityPreview.tsx
'use client'

import { ArrowRight, Clock, Heart, MapPin, MessageSquare, Route, Users } from 'lucide-react'

import { CAP_RULE, FACE, FRAME } from '@/components/shared/frame'
import {
  AnimatedIcon,
  Badge,
  HoverLink,
  DiscButton,
  HoverMotion,
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

          <h2 className="mt-4 text-balance text-[clamp(2.5rem,5.5vw,4rem)] font-black leading-[1.08] tracking-[-0.035em] text-slate-900">
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
            <div className={cn(FRAME, 'group/join')}>
              <div className={cn(FACE, 'relative overflow-hidden p-7 lg:p-8')}>
                {/* The chat, over the stats while Join is hovered. See JoinChat. */}
                <JoinChat />

                <div className="transition-[opacity,filter,transform] duration-500 ease-out group-has-[.disc-cta:hover]/join:scale-[0.98] group-has-[.disc-cta:hover]/join:opacity-0 group-has-[.disc-cta:hover]/join:blur-sm group-has-[.disc-cta:focus-visible]/join:opacity-0 motion-reduce:transition-none">
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
                          className="flex h-11 w-11 shrink-0 items-center justify-center"
                        >
                          <AnimatedIcon motion={stat.motion}>
                            <Icon size={20} className="text-plug-blue-600 transition-colors duration-300 group-hover/stat:text-plug-blue-700" />
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

                </div>

                <div className="relative z-10 mt-7 flex justify-center">
                  <DiscButton href="/signup" tone="light" width="17.5rem" icon={<Users size={20} />}>
                    Join the community
                  </DiscButton>
                </div>
              </div>
            </div>

            {/* The one painted block on the page, and kept that way on
                request: the clubs list is where the section's colour lives.
                Its radius and shadow match the framed cards beside it so it
                still reads as part of the same set. */}
            <HoverMotion className="group/clubs rounded-3xl bg-gradient-brand p-7 shadow-[0_14px_34px_-14px_rgba(11,51,44,0.55)] transition-shadow duration-300 hover:shadow-[0_20px_44px_-14px_rgba(11,51,44,0.65)]">
              <span
                aria-hidden="true"
                className="flex h-11 w-11 shrink-0 items-center justify-center"
              >
                <AnimatedIcon motion="scan">
                  <MapPin size={20} className="text-white" />
                </AnimatedIcon>
              </span>

              {/* This card's own white cap rule went with the shared one in
                  frame.ts — see CAP_RULE for why. The heading takes the space
                  the rule held, so the card's rhythm does not change. */}
              <h3 className="mt-7 text-lg font-bold tracking-tight text-white">
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

/* ── The chat behind Join ─────────────────────────────────────────── */

interface ChatLine {
  name: string
  car?: string
  text: string
  mine?: boolean
}

/**
 * An illustration of what joining gets you, not a transcript: first names
 * only, and advice rather than claims — no station, price or meetup that
 * somebody could go looking for and not find.
 */
const CHAT: ChatLine[] = [
  { name: 'Ayesha', car: 'MG ZS EV', text: 'Lahore to Islamabad on Friday. Where should I stop to charge?' },
  { name: 'Hamza', car: 'BYD Atto 3', text: 'Put it in the route planner. It places the stops around your real range.' },
  { name: 'Sana', car: 'Honri VE', text: 'And pre-cool the cabin while it’s still plugged in. Saves a lot in summer.' },
  { name: 'You', text: 'This is exactly what I needed. Joining!', mine: true },
]

/**
 * Enter delays, written out whole so Tailwind can see them. Only the hovered
 * state carries a delay, so the lines arrive one after another and all leave
 * together the moment the pointer does.
 */
const ENTER_DELAY = [
  'group-has-[.disc-cta:hover]/join:delay-[120ms]',
  'group-has-[.disc-cta:hover]/join:delay-[320ms]',
  'group-has-[.disc-cta:hover]/join:delay-[520ms]',
  'group-has-[.disc-cta:hover]/join:delay-[720ms]',
  'group-has-[.disc-cta:hover]/join:delay-[920ms]',
]

const LINE = cn(
  'translate-y-3 scale-95 opacity-0 transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none',
  'group-has-[.disc-cta:hover]/join:translate-y-0 group-has-[.disc-cta:hover]/join:scale-100 group-has-[.disc-cta:hover]/join:opacity-100',
  'group-has-[.disc-cta:focus-visible]/join:translate-y-0 group-has-[.disc-cta:focus-visible]/join:scale-100 group-has-[.disc-cta:focus-visible]/join:opacity-100',
)

function JoinChat() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex flex-col bg-plug-navy-950 px-5 pb-28 pt-5 opacity-0 transition-opacity duration-500 ease-out group-has-[.disc-cta:focus-visible]/join:opacity-100 group-has-[.disc-cta:hover]/join:opacity-100 motion-reduce:transition-none"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-plug-cyan-500/20 blur-[80px]" />

      {/* Header */}
      <div className="relative flex items-center gap-3 border-b border-white/10 pb-4">
        <span className="flex -space-x-2">
          {['A', 'H', 'S'].map((initial, i) => (
            <span
              key={initial}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold ring-2 ring-plug-navy-950',
                ['bg-plug-cyan-400 text-plug-navy-950', 'bg-amber-300 text-plug-navy-950', 'bg-white text-plug-navy-950'][i],
              )}
            >
              {initial}
            </span>
          ))}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-ui-sm font-bold text-white">EV Drivers Pakistan</span>
          <span className="flex items-center gap-1.5 text-ui-xs text-white/50">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Drivers helping drivers
          </span>
        </span>
      </div>

      {/* Messages */}
      <ul className="relative mt-4 flex min-h-0 flex-1 flex-col justify-end gap-2.5 overflow-hidden">
        {CHAT.map((line, i) => (
          <li
            key={line.text}
            className={cn(
              LINE,
              ENTER_DELAY[i],
              'flex max-w-[88%] items-end gap-2',
              line.mine ? 'origin-bottom-right self-end' : 'origin-bottom-left',
            )}
          >
            {!line.mine && (
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-plug-cyan-300">
                {line.name.charAt(0)}
              </span>
            )}
            <span
              className={cn(
                'rounded-2xl px-3.5 py-2 text-[13px] leading-snug',
                line.mine
                  ? 'rounded-br-md bg-plug-cyan-500 text-plug-navy-950'
                  : 'rounded-bl-md bg-white/[0.08] text-white/90 ring-1 ring-white/10',
              )}
            >
              {!line.mine && (
                <span className="mb-0.5 block text-[11px] font-semibold text-plug-cyan-300">
                  {line.name}
                  {line.car && <span className="font-normal text-white/40"> · {line.car}</span>}
                </span>
              )}
              {line.text}
            </span>
          </li>
        ))}

        {/* Somebody is already typing a welcome. */}
        <li className={cn(LINE, ENTER_DELAY[4], 'ml-8 flex w-fit origin-bottom-left items-center gap-1 rounded-2xl rounded-bl-md bg-white/[0.08] px-3.5 py-3 ring-1 ring-white/10')}>
          {['[animation-delay:0ms]', '[animation-delay:150ms]', '[animation-delay:300ms]'].map((d) => (
            <span key={d} className={cn('h-1.5 w-1.5 animate-bounce rounded-full bg-white/60 motion-reduce:animate-none', d)} />
          ))}
        </li>
      </ul>
    </div>
  )
}
