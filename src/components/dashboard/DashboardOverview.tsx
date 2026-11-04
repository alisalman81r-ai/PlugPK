// src/components/dashboard/DashboardOverview.tsx
import Link from 'next/link'

import { RatingStars } from '@/components/ui'
import type { MyReviewRow } from '@/lib/db/queries'
import type { CommunityPost, EVClub, Station } from '@/lib/types'
import { cn, formatRelativeTime } from '@/lib/utils'

import { IBookmark, ICal, ICar, IPin, IStar, IUsers } from './acct-icons'
import { ALINK, DashEmpty, PANEL, ROW, ROW_LINK, SecHead } from './dash-ui'
import { DashAvatar, type DashboardStats } from './DashboardSidebar'
import { ProfileCompletion } from './ProfileCompletion'

/**
 * The signed-in person's own overview (account.html of the design): profile
 * progress, who you are, three figures, then clubs, discussions, saved
 * stations and reviews — each a panel with a link, a short list, or a dashed
 * empty state with one way forward.
 *
 * Everything reads the row behind the session; nothing here is invented. The
 * activity feed the old page had is gone: nothing records what an account has
 * done, so its entries were made up.
 */

export interface DashboardOverviewProps {
  user: {
    name: string
    email: string
    city?: string
    joinedAt: string
    vehicle?: string
    avatar?: string | null
  }
  stats: DashboardStats
  savedStations: Station[]
  reviews: MyReviewRow[]
  posts: CommunityPost[]
  /** Clubs the account has joined. */
  clubs?: EVClub[]
}

const PREVIEW = 3

const STAT3 =
  'relative flex flex-col gap-1.5 rounded-[22px] border p-[22px] no-underline'
const STAT3_LINK =
  'border-ink/10 bg-white text-ink transition-[translate,box-shadow] duration-[400ms] ease-out hover:[translate:0_-3px] hover:shadow-[0_24px_40px_-26px_rgba(11,12,14,.35)] focus-visible:outline-none focus-visible:shadow-focus'

export function DashboardOverview({ user, stats, savedStations, reviews, posts, clubs = [] }: DashboardOverviewProps) {
  return (
    <div className="flex flex-col gap-[18px]">
      <ProfileCompletion name={user.name} email={user.email} avatar={user.avatar} city={user.city} vehicle={user.vehicle} />

      {/* .amini — who you are */}
      <section className={cn(PANEL, 'flex items-center gap-[18px]')}>
        <DashAvatar name={user.name} src={user.avatar} size={52} />
        <div className="min-w-0">
          <b className="block truncate font-display text-2xl font-normal leading-[1.1] text-ink">{user.name}</b>
          <span className="mt-1 block truncate text-sm text-muted">{user.email}</span>
          {user.city ? (
            <span className="mt-1 flex items-center gap-2 text-sm text-muted">
              <IPin size={17} className="shrink-0" />
              {user.city}
            </span>
          ) : null}
          <span className="mt-1 inline-flex flex-wrap items-center gap-2 text-sm text-muted">
            <ICar size={17} className="shrink-0" />
            <span>{user.vehicle ? user.vehicle : 'No vehicle saved'}</span>
            <Link href="/dashboard/vehicles" className={ALINK}>
              {user.vehicle ? 'Change' : 'Add'}
            </Link>
          </span>
        </div>
      </section>

      {/* .astats3 — three figures */}
      <div className="grid grid-cols-3 gap-3.5 max-[640px]:grid-cols-2">
        <Link href="/dashboard/saved" className={cn(STAT3, STAT3_LINK)}>
          <IBookmark size={26} className="mb-3 text-ink" />
          <b className="font-mono text-[42px] font-semibold leading-none tracking-[-0.02em] tabular-nums">{stats.totalSaved}</b>
          <span className="text-sm text-muted">Saved stations</span>
        </Link>
        <Link href="#reviews" className={cn(STAT3, STAT3_LINK)}>
          <IStar size={26} className="mb-3 text-ink" />
          <b className="font-mono text-[42px] font-semibold leading-none tracking-[-0.02em] tabular-nums">{stats.totalReviews}</b>
          <span className="text-sm text-muted">Reviews written</span>
        </Link>
        <div className={cn(STAT3, 'border-ink bg-ink text-white max-[640px]:col-span-full')}>
          <ICal size={26} className="mb-3 text-volt" />
          <b className="font-mono text-[42px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-volt">{stats.memberDays}</b>
          <span className="text-sm text-fog">Days as a member</span>
        </div>
      </div>

      <section className={PANEL}>
        <SecHead
          title="Your clubs"
          aside={
            <Link href="/dashboard/clubs" className={ALINK}>
              {clubs.length > 0 ? 'Manage' : 'Browse clubs'}
            </Link>
          }
        />
        {clubs.length === 0 ? (
          <DashEmpty href="/dashboard/clubs" cta="Find a club">
            Join an EV owners&apos; club in your city to see who else drives electric near you.
          </DashEmpty>
        ) : (
          <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 max-[1100px]:grid-cols-1">
            {clubs.slice(0, 4).map((club) => (
              <li key={club.id}>
                <Link href={`/community/clubs/${club.id}`} className={cn(ROW_LINK, 'grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3.5')}>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-volt">
                    <IUsers size={20} />
                  </span>
                  <span className="min-w-0">
                    <b className="block truncate font-display text-[19px] font-normal leading-[1.2] text-ink">{club.name}</b>
                    <span className="mt-1 inline-flex items-center gap-[5px] text-[13px] text-muted">
                      <IPin size={14} /> {club.city}
                    </span>
                  </span>
                  <span className="font-mono text-[13px] font-semibold text-ink">
                    {club.memberCount} <span className="font-sans font-normal text-muted">{club.memberCount === 1 ? 'member' : 'members'}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={PANEL}>
        <SecHead
          title="Your discussions"
          aside={
            <Link href="/community" className={ALINK}>
              Community
            </Link>
          }
        />
        {posts.length === 0 ? (
          <DashEmpty href="/community" cta="Start a discussion">
            Your posts will appear here after you share them with the community.
          </DashEmpty>
        ) : (
          <ul className="m-0 grid list-none gap-3 p-0">
            {posts.slice(0, PREVIEW).map((post) => (
              <li key={post.id}>
                <Link href={`/community/post/${post.slug}`} className={ROW_LINK}>
                  <b className="block font-semibold text-ink">{post.title}</b>
                  <span className="mt-1 block font-mono text-xs text-muted" suppressHydrationWarning>
                    {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'} · {formatRelativeTime(post.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={PANEL}>
        <SecHead
          title="Saved stations"
          aside={
            <Link href="/dashboard/saved" className={ALINK}>
              {savedStations.length > PREVIEW ? `See all ${savedStations.length}` : 'See all'}
            </Link>
          }
        />
        {savedStations.length === 0 ? (
          <DashEmpty href="/map" cta="Find stations">
            Nothing saved yet. Use the bookmark on any station to keep it here.
          </DashEmpty>
        ) : (
          <ul className="m-0 grid list-none gap-3 p-0">
            {savedStations.slice(0, PREVIEW).map((station) => (
              <li key={station.id}>
                <Link href={`/station/${station.slug}`} className={cn(ROW_LINK, 'flex items-center justify-between gap-4')}>
                  <span className="min-w-0">
                    <b className="block truncate font-display text-[19px] font-normal leading-[1.2] text-ink">{station.name}</b>
                    <span className="mt-1 block truncate text-[13px] text-muted">
                      {station.address.city} · {station.connectors.length} charger{station.connectors.length === 1 ? '' : 's'}
                    </span>
                  </span>
                  <RatingStars rating={station.rating} size="sm" showNumber />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="reviews" className={cn(PANEL, 'scroll-mt-28')}>
        <SecHead
          title="Your reviews"
          aside={
            reviews.length > 0 ? (
              <Link href="/dashboard/reviews" className={ALINK}>
                {reviews.length > PREVIEW ? `See all ${reviews.length}` : 'Manage reviews'}
              </Link>
            ) : null
          }
        />
        {reviews.length === 0 ? (
          <DashEmpty href="/map" cta="Browse stations">
            You have not written a review yet.
          </DashEmpty>
        ) : (
          <ul className="m-0 grid list-none gap-3 p-0">
            {reviews.slice(0, PREVIEW).map((review) => (
              <li key={review.id} className={ROW}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <b className="font-display text-[19px] font-normal leading-[1.2] text-ink">{review.listingName}</b>
                  <span className="font-mono text-xs text-muted" suppressHydrationWarning>
                    {formatRelativeTime(review.date)}
                  </span>
                </div>
                <div className="mt-1.5">
                  <RatingStars rating={review.rating} size="sm" />
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted">{review.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
