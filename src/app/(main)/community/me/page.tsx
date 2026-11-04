// src/app/(main)/community/me/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { ArrowRight, Heart, MapPin, MessageCircle, MessageSquare, PenSquare, Users } from '@/components/ui/icons'
import { Btn, CARD, HeroStats, PageHero, Tag, WRAP } from '@/components/v2/ui'
import { POST_CATEGORY_META } from '@/lib/constants'
import { getMyClubs, getMyCommunityActivity } from '@/lib/db/community-queries'
import { getCurrentProfile } from '@/lib/db/session-actions'
import { cn, formatRelativeTime } from '@/lib/utils'

/**
 * A member's own corner of the community: every discussion they started,
 * every reply they wrote (with the discussion it belongs to), and the clubs
 * they joined. Signed-in only; per member, so never cached.
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'My community profile',
  robots: { index: false, follow: false },
}

export default async function MyCommunityProfilePage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login?redirect=/community/me')

  const [activity, clubs] = await Promise.all([getMyCommunityActivity(profile.id), getMyClubs(profile.id)])
  const { posts, replies, likesReceived } = activity
  const initial = profile.name.trim().charAt(0).toUpperCase() || '?'

  return (
    <>
      <PageHero
        eyebrow="My profile"
        title={
          <>
            Hi, <em className="pg-bold not-italic text-volt">{profile.name.split(' ')[0]}</em>
          </>
        }
        sub="Everything you have posted on the plugpk community — your discussions, your replies and your clubs — in one place."
        actions={
          <>
            <Btn href="/community" variant="volt">
              <PenSquare aria-hidden="true" />
              Back to the community
            </Btn>
          </>
        }
        lift={false}
      >
        <HeroStats
          items={[
            { value: posts.length, label: posts.length === 1 ? 'Post' : 'Posts' },
            { value: replies.length, label: replies.length === 1 ? 'Reply' : 'Replies' },
            { value: likesReceived, label: likesReceived === 1 ? 'Like' : 'Likes' },
            { value: clubs.length, label: clubs.length === 1 ? 'Club' : 'Clubs' },
          ]}
        />
      </PageHero>

      <section data-theme="light" className="bg-chalk py-[clamp(48px,6vw,88px)]">
        <div className={cn(WRAP, 'grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]')}>
          <div className="grid min-w-0 gap-6">
            {/* ── My discussions ─────────────────────────────────── */}
            <div data-reveal="" className={cn(CARD, 'p-5 sm:p-7')}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="font-display text-[26px] leading-tight text-ink">My discussions</h2>
                <span className="font-mono text-sm font-semibold text-muted">{posts.length}</span>
              </div>
              {posts.length === 0 ? (
                <Empty text="You haven't started a discussion yet." cta="Start one" />
              ) : (
                <ul className="grid gap-2.5">
                  {posts.map((post) => {
                    const cat = POST_CATEGORY_META[post.category]
                    return (
                      <li key={post.id}>
                        <Link
                          href={`/community/post/${post.slug}`}
                          className="group/p flex flex-col gap-2 rounded-[18px] border border-ink/10 bg-paper px-4 py-3.5 transition-[translate,box-shadow,border-color] duration-[450ms] ease-out hover:border-ink/20 hover:shadow-e1 hover:[translate:0_-2px] sm:px-5"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            {cat ? <Tag tone="volt">{cat.label}</Tag> : null}
                            <span className="font-mono text-xs text-muted">{formatRelativeTime(post.createdAt)}</span>
                          </div>
                          <p className="text-[16.5px] font-semibold leading-snug text-ink">{post.title}</p>
                          <p className="line-clamp-2 text-sm text-muted">{post.content}</p>
                          <div className="flex items-center gap-4 text-[13px] text-muted">
                            <span className="inline-flex items-center gap-1.5">
                              <Heart size={14} aria-hidden="true" /> {post.likeCount}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <MessageSquare size={14} aria-hidden="true" /> {post.commentCount}{' '}
                              {post.commentCount === 1 ? 'reply' : 'replies'}
                            </span>
                            <ArrowRight
                              size={16}
                              aria-hidden="true"
                              className="ml-auto transition-transform duration-[350ms] ease-spring group-hover/p:translate-x-1"
                            />
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* ── My replies ──────────────────────────────────────── */}
            <div data-reveal="" className={cn(CARD, 'p-5 sm:p-7')}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="font-display text-[26px] leading-tight text-ink">My replies</h2>
                <span className="font-mono text-sm font-semibold text-muted">{replies.length}</span>
              </div>
              {replies.length === 0 ? (
                <Empty text="You haven't replied to a discussion yet." cta="Browse discussions" />
              ) : (
                <ul className="grid gap-2.5">
                  {replies.map((reply) => (
                    <li key={reply.id}>
                      <Link
                        href={`/community/post/${reply.post.slug}`}
                        className="group/r block rounded-[18px] border border-ink/10 bg-paper px-4 py-3.5 transition-[box-shadow,border-color] duration-300 hover:border-ink/20 hover:shadow-e1 sm:px-5"
                      >
                        <p className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
                          <MessageCircle size={14} aria-hidden="true" className="text-volt-ink" />
                          On <span className="font-semibold text-ink group-hover/r:underline">{reply.post.title}</span>
                          <span className="font-mono text-xs">· {formatRelativeTime(reply.createdAt)}</span>
                        </p>
                        <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-ink">{reply.content}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* ── Side: who, and clubs ─────────────────────────────── */}
          <aside className="grid gap-6 lg:sticky lg:top-[calc(var(--nav-h)+16px)]">
            <div data-reveal="" className="rounded-[28px] bg-ink p-6 text-white">
              <div className="flex items-center gap-3.5">
                {profile.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element -- an uploaded avatar of unknown host
                  <img src={profile.avatar} alt="" className="h-14 w-14 rounded-full object-cover" />
                ) : (
                  <span className="pg-bold grid h-14 w-14 place-items-center rounded-full bg-volt font-display text-xl text-ink">
                    {initial}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold">{profile.name}</p>
                  {profile.vehicle ? <p className="truncate text-sm text-white/60">{profile.vehicle}</p> : null}
                  {profile.city ? <p className="truncate text-sm text-white/60">{profile.city}</p> : null}
                </div>
              </div>
              <Link
                href="/dashboard/settings"
                className="mt-5 inline-flex h-10 items-center rounded-full border border-white/20 px-4 text-sm font-semibold transition-colors hover:border-volt hover:text-volt"
              >
                Edit profile
              </Link>
            </div>

            <div data-reveal="" className={cn(CARD, 'p-5 sm:p-6')}>
              <h2 className="mb-3 flex items-center gap-2 font-display text-[22px] leading-tight text-ink">
                <Users size={18} aria-hidden="true" className="text-volt-ink" />
                My clubs
              </h2>
              {clubs.length === 0 ? (
                <p className="text-sm text-muted">
                  You haven&rsquo;t joined a club yet.{' '}
                  <Link href="/community/clubs" className="font-semibold text-ink underline">
                    Find one near you
                  </Link>
                  .
                </p>
              ) : (
                <ul className="grid gap-2">
                  {clubs.map((club) => (
                    <li key={club.id}>
                      <Link
                        href={`/community/clubs/${club.id}`}
                        className="flex items-center justify-between gap-3 rounded-2xl bg-chalk px-4 py-3 transition-colors hover:bg-stone"
                      >
                        <span className="truncate text-sm font-semibold text-ink">{club.name}</span>
                        <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted">
                          <MapPin size={13} aria-hidden="true" />
                          {club.city}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}

function Empty({ text, cta }: { text: string; cta: string }) {
  return (
    <div className="grid justify-items-center gap-3 rounded-[18px] border border-dashed border-ink/15 bg-paper px-5 py-10 text-center">
      <p className="text-[15px] text-muted">{text}</p>
      <Link href="/community" className="inline-flex h-10 items-center rounded-full bg-ink px-4 text-sm font-semibold text-white hover:bg-volt hover:text-ink">
        {cta}
      </Link>
    </div>
  )
}
