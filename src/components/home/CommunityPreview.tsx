// src/components/home/CommunityPreview.tsx
'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Heart, MapPin, MessageCircle, MessageSquare, Route, TrendingUp, Users, type LucideIcon } from 'lucide-react'

import { Badge, DiscButton, HoverLink, type BadgeVariant } from '@/components/ui'
import type { CommunityCounts } from '@/lib/db/queries'
import { MOCK_POSTS } from '@/lib/mock-data'
import type { PostCategory } from '@/lib/types'
import { cn, getPostCategoryConfig } from '@/lib/utils'

/**
 * The community band: four equal cards in a two-by-two grid.
 *
 * Each card is a picture of the feature above the words for it. The top is a
 * soft inset panel with a small, slightly turned piece of the product floating
 * in it — the posts, the chat, the clubs, the numbers — fading out at its
 * foot; under it an icon in a tinted circle, a large light title and one
 * sentence. The four read as one set because every card is built the same
 * way, and nothing is filled but the icon circles.
 *
 * The figures are the database's: the clubs and their member counts, and the
 * community counts on the last card. The two posts and the chat are the same
 * sample content the section already showed.
 *
 * The one action, Join, sits under the grid rather than inside a card, so
 * the four stay equal.
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

const POSTS = MOCK_POSTS.slice(0, 2)

interface ChatLine {
  name: string
  car?: string
  text: string
  mine?: boolean
}

const CHAT: ChatLine[] = [
  { name: 'Ayesha', car: 'MG ZS EV', text: 'Lahore to Islamabad on Friday. Where should I stop to charge?' },
  { name: 'Hamza', car: 'BYD Atto 3', text: 'Put it in the route planner. It places the stops around your real range.' },
  { name: 'You', text: 'Exactly what I needed. Joining!', mine: true },
]

export interface CommunityPreviewProps {
  clubs: Array<{ id: string; name: string; city: string; memberCount: number }>
  counts: CommunityCounts
}

/* ── The card shell ─────────────────────────────────────────────────── */

interface FeatureCardProps {
  href: string
  icon: LucideIcon
  title: string
  body: string
  children: React.ReactNode
}

function FeatureCard({ href, icon: Icon, title, body, children }: FeatureCardProps) {
  return (
    <HoverLink
      href={href}
      className={cn(
        'group flex h-full flex-col rounded-[1.75rem] border border-slate-200/80 bg-white p-4 sm:p-5',
        'shadow-[0_1px_2px_rgba(5,36,30,0.04),0_18px_40px_-28px_rgba(5,36,30,0.25)]',
        'transition-[box-shadow,border-color] duration-300 hover:border-slate-300/80 hover:shadow-[0_2px_4px_rgba(5,36,30,0.05),0_26px_50px_-28px_rgba(5,36,30,0.35)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-cyan-500 focus-visible:ring-offset-2',
      )}
    >
      {/* The picture: an inset panel, its contents fading out at the foot. */}
      <div aria-hidden="true" className="relative h-[15.5rem] overflow-hidden rounded-[1.25rem] bg-slate-50 sm:h-[16.5rem]">
        <div
          className={cn(
            'absolute inset-0 [mask-image:linear-gradient(to_bottom,#000_62%,transparent_100%)]',
            'transition-transform duration-500 ease-out group-hover:-translate-y-1.5 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0',
          )}
        >
          {children}
        </div>
      </div>

      {/* The words. */}
      <div className="px-2 pb-3 pt-7 sm:px-3">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E9FAF3] text-[#159E89] transition-colors duration-300 group-hover:bg-[#D6F5E8]"
        >
          <Icon size={19} strokeWidth={1.9} />
        </span>
        <h3 className="mt-5 text-[clamp(1.6rem,2.2vw,2rem)] font-medium leading-[1.12] tracking-[-0.035em] text-slate-900">
          {title}
        </h3>
        <p className="mt-3 max-w-[30rem] text-[15px] leading-[1.7] text-slate-500">{body}</p>
      </div>
    </HoverLink>
  )
}

/** A floating piece of UI: white, hairline edge, soft shadow. */
const PIECE = 'rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_28px_-16px_rgba(5,36,30,0.3)]'

/* ── The four pictures ──────────────────────────────────────────────── */

function PostsPicture() {
  return (
    <div className="flex flex-col gap-3 px-[9%] pt-5">
      {POSTS.map((post, i) => {
        const config = getPostCategoryConfig(post.category)
        return (
          <div key={post.id} className={cn(PIECE, 'p-4', i === 1 && 'ml-[6%]')}>
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-plug-navy-900 text-[12px] font-bold text-white">
                  {post.userName.charAt(0)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-slate-900">{post.userName}</span>
                  {post.userVehicle ? <span className="block truncate text-[11px] text-slate-400">{post.userVehicle}</span> : null}
                </span>
              </span>
              <Badge variant={CATEGORY_VARIANT[post.category]} size="sm">
                {config.label}
              </Badge>
            </div>
            <p className="mt-3 line-clamp-1 text-[14px] font-bold tracking-tight text-slate-900">{post.title}</p>
            <div className="mt-2.5 flex items-center gap-4 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Heart size={11} /> {post.likeCount}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare size={11} /> {post.commentCount}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ChatPicture() {
  return (
    <div className={cn(PIECE, 'absolute left-[9%] right-[7%] top-6 origin-top-left rotate-[-1.6deg] p-5')}>
      <div className="flex items-center gap-2.5">
        <span className="flex -space-x-2">
          {['A', 'H', 'S'].map((initial, i) => (
            <span
              key={initial}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ring-2 ring-white',
                ['bg-plug-cyan-400 text-plug-navy-950', 'bg-amber-300 text-plug-navy-950', 'bg-plug-navy-900 text-white'][i],
              )}
            >
              {initial}
            </span>
          ))}
        </span>
        <span className="min-w-0">
          <span className="flex items-center gap-1.5 text-[13px] font-bold text-slate-900">
            EV Drivers Pakistan <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          <span className="block text-[11px] text-slate-400">Drivers helping drivers</span>
        </span>
      </div>
      <ul className="mt-4 flex flex-col gap-2">
        {CHAT.map((line) => (
          <li key={line.text} className={cn('flex max-w-[86%]', line.mine && 'self-end')}>
            <span
              className={cn(
                'rounded-2xl px-3 py-2 text-[12px] leading-snug',
                line.mine ? 'rounded-br-md bg-[#0B332C] text-white' : 'rounded-bl-md bg-slate-100 text-slate-700',
              )}
            >
              {!line.mine && (
                <span className="mb-0.5 block text-[10.5px] font-semibold text-[#159E89]">
                  {line.name}
                  {line.car && <span className="font-normal text-slate-400"> · {line.car}</span>}
                </span>
              )}
              {line.text}
            </span>
          </li>
        ))}
        <li className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-md bg-slate-100 px-3 py-2.5">
          {['[animation-delay:0ms]', '[animation-delay:150ms]', '[animation-delay:300ms]'].map((d) => (
            <span key={d} className={cn('h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 motion-reduce:animate-none', d)} />
          ))}
        </li>
      </ul>
    </div>
  )
}

function ClubsPicture({ clubs }: { clubs: CommunityPreviewProps['clubs'] }) {
  const reduce = useReducedMotion()
  const max = Math.max(1, ...clubs.map((c) => c.memberCount))
  if (clubs.length === 0)
    return (
      <div className={cn(PIECE, 'mx-[9%] mt-6 p-5 text-[13px] text-slate-500')}>Clubs are forming in your city.</div>
    )
  return (
    <div className="flex flex-col gap-3 px-[9%] pt-5">
      {clubs.slice(0, 3).map((club, i) => (
        <div key={club.id} className={cn(PIECE, 'px-4 py-3.5')}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-[13.5px] font-bold text-slate-900">{club.name}</span>
            <span className="shrink-0 text-[11px] tabular-nums text-slate-400">
              {club.memberCount} {club.memberCount === 1 ? 'member' : 'members'}
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            {/*
              The bar fills from empty to its share of members when the card
              comes into view, the three one after another; then a soft light
              keeps sweeping along it. Under reduced motion it is simply full.
            */}
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <motion.span
                className="relative block h-full origin-left overflow-hidden rounded-full bg-gradient-to-r from-[#159E89] to-[#46E3B5]"
                style={{ width: `${Math.max(8, (club.memberCount / max) * 100)}%` }}
                initial={reduce ? false : { scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 1.1, delay: 0.2 + i * 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                <span
                  className="club-bar-sheen absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/70 to-transparent"
                  style={{ animationDelay: `${1.3 + i * 0.35}s` }}
                />
              </motion.span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-[10.5px] text-slate-400">
              <MapPin size={10} /> {club.city}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function StatsPicture({ counts }: { counts: CommunityCounts }) {
  const rows: { icon: LucideIcon; label: string; value: number }[] = [
    { icon: Users, label: counts.clubMembers === 1 ? 'Club member' : 'Club members', value: counts.clubMembers },
    { icon: MessageSquare, label: counts.discussions === 1 ? 'Discussion' : 'Discussions', value: counts.discussions },
    { icon: Route, label: counts.replies === 1 ? 'Reply' : 'Replies', value: counts.replies },
    { icon: MapPin, label: counts.cities === 1 ? 'City active' : 'Cities active', value: counts.cities },
  ]
  return (
    <div className={cn(PIECE, 'absolute left-[9%] right-[8%] top-5 origin-top-right rotate-[1.4deg] px-5 pb-3 pt-4')}>
      <p className="text-[13px] font-bold text-slate-900">This month on plug.pk</p>
      <ul className="mt-2">
        {rows.map(({ icon: Icon, label, value }) => (
          <li key={label} className="flex items-center justify-between border-t border-slate-100 py-2.5 first:border-t-0">
            <span className="flex items-center gap-2.5 text-[13px] text-slate-500">
              <Icon size={14} className="text-[#159E89]" strokeWidth={2} />
              {label}
            </span>
            <span className="text-[15px] font-bold tabular-nums text-slate-900">{value.toLocaleString('en-PK')}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ── The section ────────────────────────────────────────────────────── */

export function CommunityPreview({ clubs, counts }: CommunityPreviewProps) {
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

        {/* ── Four equal cards ─────────────────────────────────── */}
        <div className="mx-auto mt-16 grid max-w-[76rem] gap-5 md:grid-cols-2 lg:gap-6">
          <FeatureCard
            href="/community"
            icon={MessageSquare}
            title="Real questions, real answers"
            body="Ask about charging, range and routes, and hear from drivers who have already done the trip."
          >
            <PostsPicture />
          </FeatureCard>

          <FeatureCard
            href="/community"
            icon={MessageCircle}
            title="Drivers helping drivers"
            body="Plan a trip in the open. Someone has already charged where you are going and will tell you how it went."
          >
            <ChatPicture />
          </FeatureCard>

          <FeatureCard
            href="/community"
            icon={MapPin}
            title="EV clubs near you"
            body="Meet owners in your own city, swap tips on the cars you drive, and join drives and meetups."
          >
            <ClubsPicture clubs={clubs} />
          </FeatureCard>

          <FeatureCard
            href="/community"
            icon={TrendingUp}
            title="A community that keeps growing"
            body="More drivers, more discussions and more cities every month, all of it open to read before you join."
          >
            <StatsPicture counts={counts} />
          </FeatureCard>
        </div>

        {/* ── The one action ───────────────────────────────────── */}
        <div className="mt-12 flex justify-center lg:mt-14">
          <DiscButton href="/signup" tone="light" width="17.5rem" icon={<Users size={20} />}>
            Join the community
          </DiscButton>
        </div>
      </div>
    </section>
  )
}
