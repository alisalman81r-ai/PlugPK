// src/components/home/CommunityPreview.tsx
import { Heart, MapPin, MessageSquare, Route, TrendingUp, Users, type IconType } from '@/components/ui/icons'
import Link from 'next/link'

import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { DiscButton } from '@/components/ui/DiscButton'
import type { CommunityPost, PostCategory } from '@/lib/types'
import { cn, getPostCategoryConfig } from '@/lib/utils'

import { HoverCountUp } from './HoverCountUp'

/**
 * The community band: three equal cards.
 *
 * Each card is a picture of the feature above the words for it — a soft inset
 * panel with a small piece of the product floating in it, fading out at its
 * foot; under it an icon in a tinted circle, a title and one sentence.
 *
 * ── Everything in the pictures is real ────────────────────────────────
 *
 * The posts are the two newest on the board, passed in from the server page.
 * The clubs are the directory's. The figures are counted.
 *
 * There used to be a fourth card: a group chat called "EV Drivers Pakistan"
 * with a green online dot, Ayesha in an MG ZS EV asking Hamza in a BYD Atto 3
 * where to charge. No such group, chat or people exist — the site has no
 * messaging at all — and it sat under the heading "Real questions, real
 * answers" beside two posts that were also fixtures. Both are gone.
 *
 * Each picture comes alive on hover, and says something true when it does:
 * the posts card scrolls through the newest posts, the clubs card drops its
 * city pins in one by one, and the figures card counts up to its real totals.
 * The first two are CSS keyframes (tailwind.config.ts: feed-scroll, pin-pop);
 * the count is a tiny client island. All three stand still for anyone who
 * prefers reduced motion, and the resting state is the real content.
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

export interface CommunityPreviewCounts {
  discussions: number
  replies: number
  clubs: number
  cities: number
  /** Active club members, counted from memberships. */
  clubMembers: number
}

export interface CommunityPreviewProps {
  /** The newest posts on the board, newest first. */
  posts: CommunityPost[]
  clubs: Array<{ id: string; name: string; city: string; memberCount: number }>
  counts: CommunityPreviewCounts
}

/* ── The card shell ─────────────────────────────────────────────────── */

interface FeatureCardProps {
  href: string
  icon: IconType
  title: string
  body: string
  children: React.ReactNode
}

function FeatureCard({ href, icon: Icon, title, body, children }: FeatureCardProps) {
  return (
    <Link
      href={href}
      data-hover-card
      className={cn(
        'group flex h-full flex-col rounded-[1.75rem] border border-slate-200/80 bg-white p-4 sm:p-5',
        'shadow-[0_1px_2px_rgba(5,36,30,0.04),0_18px_40px_-28px_rgba(5,36,30,0.25)]',
        'transition-[box-shadow,border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-slate-300/80 hover:shadow-[0_2px_4px_rgba(5,36,30,0.05),0_26px_50px_-28px_rgba(5,36,30,0.35)]',
        'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
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
        {/* The icon on its own: the tinted circle that sat behind it is gone. */}
        <Icon
          aria-hidden="true"
          size={26}
          strokeWidth={1.9}
          className="text-[#159E89] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:transform-none"
        />
        <h3 className="mt-4 text-[clamp(1.5rem,2vw,1.85rem)] font-medium leading-[1.12] tracking-[-0.035em] text-slate-900">
          {title}
        </h3>
        <p className="mt-3 max-w-[30rem] text-[15px] leading-[1.7] text-slate-500">{body}</p>
      </div>
    </Link>
  )
}

/** A floating piece of UI: white, hairline edge, soft shadow. */
const PIECE = 'rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_28px_-16px_rgba(5,36,30,0.3)]'

/* ── The pictures ───────────────────────────────────────────────────── */

function PostsPicture({ posts }: { posts: CommunityPost[] }) {
  if (posts.length === 0) {
    return (
      <div className={cn(PIECE, 'mx-[9%] mt-6 p-5 text-[13px] text-slate-500')}>
        Nothing has been posted yet. The first question asked here is the first one on this card.
      </div>
    )
  }
  /*
    The track holds the posts twice. At rest the first ones sit in view; on
    hover it scrolls up through all of them and loops — translating exactly
    -50% lands the second copy where the first began, so the seam never shows.
    A single post has nothing to scroll to, so it just sits there.
  */
  const loops = posts.length > 1
  const track = loops ? [...posts, ...posts] : posts
  return (
    <div
      className={cn(
        'flex flex-col gap-3 px-[9%] pt-5',
        loops && 'group-hover:animate-feed-scroll motion-reduce:group-hover:animate-none',
      )}
      style={loops ? { animationDuration: `${posts.length * 2.6}s` } : undefined}
    >
      {track.map((post, i) => {
        const config = getPostCategoryConfig(post.category)
        return (
          <div key={`${post.id}-${i}`} className={cn(PIECE, 'p-4', i % 2 === 1 && 'ml-[6%]')}>
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

function ClubsPicture({ clubs }: { clubs: CommunityPreviewProps['clubs'] }) {
  if (clubs.length === 0) {
    return (
      <div className={cn(PIECE, 'mx-[9%] mt-6 p-5 text-[13px] text-slate-500')}>No clubs are listed yet.</div>
    )
  }
  return (
    <div className="flex flex-col gap-3 px-[9%] pt-5">
      {clubs.slice(0, 3).map((club, i) => (
        <div key={club.id} className={cn(PIECE, 'flex items-center justify-between gap-3 px-4 py-3.5')}>
          <span className="min-w-0 truncate text-[13.5px] font-bold text-slate-900">{club.name}</span>
          <span className="flex shrink-0 items-center gap-1 text-[12px] text-slate-400 transition-colors duration-300 group-hover:text-slate-600">
            {/* Each city pin drops in on hover, one after another down the list. */}
            <MapPin
              size={14}
              className="text-[#159E89] group-hover:animate-pin-pop motion-reduce:group-hover:animate-none"
              style={{ animationDelay: `${i * 180}ms` }}
            />{' '}
            {club.city}
          </span>
        </div>
      ))}
    </div>
  )
}

function StatsPicture({ counts }: { counts: CommunityPreviewCounts }) {
  const rows: { icon: IconType; label: string; value: number }[] = [
    { icon: MessageSquare, label: counts.discussions === 1 ? 'Discussion' : 'Discussions', value: counts.discussions },
    { icon: Route, label: counts.replies === 1 ? 'Reply' : 'Replies', value: counts.replies },
    { icon: Users, label: counts.clubs === 1 ? 'Club' : 'Clubs', value: counts.clubs },
    { icon: MapPin, label: counts.cities === 1 ? 'City with a club' : 'Cities with a club', value: counts.cities },
  ]
  return (
    <div className={cn(PIECE, 'absolute left-[9%] right-[8%] top-5 origin-top-right rotate-[1.4deg] px-5 pb-3 pt-4')}>
      {/* Totals to date. This said "This month on plug.pk" over all-time figures. */}
      <p className="text-[13px] font-bold text-slate-900">On plug.pk so far</p>
      <ul className="mt-2">
        {rows.map(({ icon: Icon, label, value }) => (
          <li key={label} className="flex items-center justify-between border-t border-slate-100 py-2.5 first:border-t-0">
            <span className="flex items-center gap-2.5 text-[13px] text-slate-500">
              <Icon size={14} className="text-[#159E89]" strokeWidth={2} />
              {label}
            </span>
            <span className="text-[15px] font-bold tabular-nums text-slate-900">
              <HoverCountUp value={value} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ── The section ────────────────────────────────────────────────────── */

export function CommunityPreview({ posts, clubs, counts }: CommunityPreviewProps) {
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

          {/* It said "Connect with thousands of EV owners" over a board of a
              dozen discussions. It now says what the board is for. */}
          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-slate-500">
            Ask about charging, range and routes, share how a trip went, and read what other EV
            drivers in Pakistan have found — no account needed to read.
          </p>
        </div>

        {/* ── Three equal cards ────────────────────────────────── */}
        <div className="mx-auto mt-16 grid max-w-[76rem] gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          <FeatureCard
            href="/community"
            icon={MessageSquare}
            title="Questions from drivers"
            body="The newest posts on the board: charging, range and routes, asked and answered by people who drive one."
          >
            <PostsPicture posts={posts} />
          </FeatureCard>

          <FeatureCard
            href="/community/clubs"
            icon={MapPin}
            title="EV clubs by city"
            body="Owner groups listed by city, for meetups, drives and swapping notes on the cars you drive."
          >
            <ClubsPicture clubs={clubs} />
          </FeatureCard>

          <FeatureCard
            href="/community"
            icon={TrendingUp}
            title="Open to read"
            body="Every discussion is public. Read what drivers have found before you decide to join."
          >
            <StatsPicture counts={counts} />
          </FeatureCard>
        </div>

        {/* ── The one action ───────────────────────────────────── */}
        <div className="mt-12 flex justify-center lg:mt-14">
          <DiscButton href="/community" tone="light" icon={<Users size={20} />}>
            Visit the community
          </DiscButton>
        </div>
      </div>
    </section>
  )
}
