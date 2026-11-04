// src/app/admin/(protected)/members/[id]/member-view.tsx
import Link from 'next/link'
import type * as React from 'react'

import { MemberDeleteCard } from '@/components/admin/MemberDeleteCard'
import { AdminBadge } from '@/components/admin/MemberList'
import { MemberPasswordCard } from '@/components/admin/MemberPasswordCard'
import { MemberRoleCard } from '@/components/admin/MemberRoleCard'
import { ReviewStatusBadge } from '@/components/admin/ReviewStatusBadge'
import { MemberEventFeed } from '@/components/admin/member-events'
import { Ico, Page, PageHead, Panel, initials, k, plural, rise, s, type IcoName } from '@/components/admin/people/kit'
import type { MemberAdminFacts } from '@/lib/db/admin-queries'
import type { getMemberActivity } from '@/lib/db/member-activity-queries'
import type { MemberDetail } from '@/lib/db/queries'
import { formatDate, formatRelativeTime } from '@/lib/utils'

export type MemberActivity = Awaited<ReturnType<typeof getMemberActivity>>

/**
 * One member, and everything held against their account.
 *
 * The point of the detail view is that deleting somebody is a decision made
 * with the consequences visible — which listings become ownerless, which
 * reviews disappear — rather than from a row in a list.
 *
 * `auditPanel` is the shared ActivityPanel (admin changes to this account),
 * passed in by the page because it reads the database itself.
 */
export function MemberView({
  member,
  facts,
  isSelf,
  activity,
  auditPanel,
}: {
  member: MemberDetail
  facts: MemberAdminFacts
  isSelf: boolean
  activity: MemberActivity
  auditPanel?: React.ReactNode
}) {
  const profile = rise(1)
  const partnerCount = activity.meetings.length + activity.services.length

  return (
    <Page>
      <PageHead
        title={member.name}
        backHref="/admin/members"
        description={member.email}
        badges={
          <>
            {facts.isAdmin ? <AdminBadge /> : null}
            {isSelf ? <span className={k('badge', 'badge--soft')}>You</span> : null}
            {facts.mustChangePassword ? <span className={k('badge', 'badge--warn')}>Must change password</span> : null}
          </>
        }
        actions={
          <>
            <a href={`mailto:${member.email}`} className={k('btn', 'btn--line')}>
              <Ico n="mail" />
              Email
            </a>
            <Link href="/admin/members" className={k('btn', 'btn--line')}>
              <Ico n="users" />
              All members
            </Link>
          </>
        }
      />

      {/* ── Who they are ─────────────────────────────────── */}
      <section className={k('card', profile.className)} style={{ ...profile.style, marginBottom: 18 }} aria-label="Account">
        <div className={s.prof}>
          <span aria-hidden="true" className={k('mav', 'mav--lg', facts.isAdmin && 'mav--ink')}>
            {initials(member.name)}
          </span>
          <div style={{ minWidth: 0 }}>
            <div className={s.mcard__name}>{member.name}</div>
            <div className={s.meta}>
              <span>
                <Ico n="building" />
                {plural(member.businessCount, 'listing')}
              </span>
              <span>
                <Ico n="star" />
                {plural(member.reviewCount, 'review')}
              </span>
              <span>
                <Ico n="bookmark" />
                {member.savedCount} saved
              </span>
              <span>
                <Ico n="chat" />
                {plural(member.postCount, 'post')}
              </span>
            </div>
          </div>
        </div>
        <dl className={s.facts} style={{ margin: 0 }}>
          <Fact icon="mail" label="Email">
            {member.email}
          </Fact>
          <Fact icon="pinl" label="City">
            {member.city ?? <span className={s.unset}>Not set</span>}
          </Fact>
          <Fact icon="car" label="Vehicle">
            {member.vehicle ?? <span className={s.unset}>Not set</span>}
          </Fact>
          <Fact icon="cal" label="Joined">
            <span title={formatDate(member.joinedAt)} suppressHydrationWarning>
              {formatRelativeTime(member.joinedAt)}
            </span>
          </Fact>
        </dl>
        <p className={s.idline} style={{ margin: 0 }}>
          {member.id}
        </p>
      </section>

      <div className={s.cols}>
        <div className={s.stack18}>
          {/* ── What they have done ──────────────────────────── */}
          {/* Website and app alike, newest first: the same rows as Activity →
              Members, filtered to this account. */}
          <Panel
            icon="pulse"
            title="Recent activity"
            count={activity.eventTotal}
            sub="On the website and in the app, newest first."
            aside={
              activity.eventTotal > activity.events.length ? (
                <Link href={`/admin/activity?q=${encodeURIComponent(member.email)}`} className={s.link}>
                  See all
                  <Ico n="arrow" />
                </Link>
              ) : null
            }
          >
            {activity.events.length === 0 ? (
              <p className={k('quiet', 'cbody')} style={{ paddingTop: 18 }}>
                Nothing recorded yet. Actions on the website and in the app appear here.
              </p>
            ) : (
              <div style={{ padding: '18px 0 6px' }}>
                <MemberEventFeed rows={activity.events} showPerson={false} flat />
              </div>
            )}
          </Panel>

          {/* ── Partner Up and service applications ──────────── */}
          {/* Linked by account, not by the typed email: these are what this
              member sent while signed in, whatever name they typed. */}
          <Panel icon="handshake" title="Partner Up & service applications" count={partnerCount}>
            {partnerCount === 0 ? (
              <None>None sent from this account.</None>
            ) : (
              <ul className={s.rows}>
                {activity.meetings.map((meeting) => (
                  <li key={meeting.id} className={s.row}>
                    <div className={s.row__main}>
                      <Link className={s.rt} href={`/admin/meetings?q=${encodeURIComponent(meeting.company)}`}>
                        Meeting request · {meeting.company}
                      </Link>
                    </div>
                    <div className={s.row__side}>
                      <ReviewStatusBadge status={meeting.status === 'new' ? 'new' : 'handled'} />
                      <span suppressHydrationWarning>{formatRelativeTime(meeting.createdAt)}</span>
                    </div>
                  </li>
                ))}
                {activity.services.map((service) => (
                  <li key={service.id} className={s.row}>
                    <div className={s.row__main}>
                      <Link className={s.rt} href={`/admin/services/${service.id}`}>
                        Service listing · {service.name}
                      </Link>
                      <span>{service.city}</span>
                    </div>
                    <div className={s.row__side}>
                      <ReviewStatusBadge status={service.status} />
                      <span suppressHydrationWarning>{formatRelativeTime(service.createdAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* ── Their listings ───────────────────────────────── */}
          <Panel icon="building" title="Business listings" count={member.businessCount}>
            {member.businesses.length === 0 ? (
              <None>None submitted from this account.</None>
            ) : (
              <ul className={s.rows}>
                {member.businesses.map((business) => (
                  <li key={business.id} className={s.row}>
                    <div className={s.row__main}>
                      <Link className={s.rt} href={`/admin/businesses/${business.id}`}>
                        {business.name}
                      </Link>
                      <span>{business.city}</span>
                    </div>
                    <ReviewStatusBadge status={business.status} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* ── What they drive ──────────────────────────────── */}
          {/* The cars on the account, from UserVehicle, and the free-text
              `vehicle` typed at sign-up. Both are shown, because they answer
              different questions and disagreeing is itself worth seeing. */}
          <Panel icon="car" title="Vehicles" count={member.vehicleCount}>
            {member.vehicles.length === 0 ? (
              <None>
                No car added to the account
                {member.vehicle ? ` — sign-up recorded “${member.vehicle}”.` : '.'}
              </None>
            ) : (
              <ul className={s.rows}>
                {member.vehicles.map((car) => (
                  <li key={car.id} className={s.row}>
                    <div className={s.row__main}>
                      <b>{car.customName ?? car.name}</b>
                      <span>
                        {car.customName ? `${car.name} · ` : ''}
                        {car.color ?? 'colour not set'}
                      </span>
                    </div>
                    <div className={s.row__side}>
                      {car.isDefault ? <span className={k('pill', 'pill--ok')}>Default</span> : null}
                      <span suppressHydrationWarning>{formatRelativeTime(car.addedAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* ── What they posted ─────────────────────────────── */}
          {/* Moderation stays on /admin/community, which owns the delete
              action — duplicating it here would mean two places to keep correct. */}
          <Panel icon="chat" title="Community posts" count={member.postCount}>
            {member.posts.length === 0 ? (
              <None>None written.</None>
            ) : (
              <ul className={s.rows}>
                {member.posts.map((post) => (
                  <li key={post.id} className={s.row}>
                    <div className={s.row__main}>
                      <Link className={s.rt} href={`/community/post/${post.slug}`} target="_blank" rel="noopener noreferrer">
                        {post.title}
                      </Link>
                      <span suppressHydrationWarning>
                        {plural(post.commentCount, 'comment')} · {formatRelativeTime(post.createdAt)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* ── What they wrote ──────────────────────────────── */}
          <Panel icon="star" title="Reviews" count={member.reviewCount}>
            {member.reviews.length === 0 ? (
              <None>None written.</None>
            ) : (
              <ul className={s.rows}>
                {member.reviews.map((review) => (
                  <li key={review.id} className={s.row}>
                    <div className={s.row__main}>
                      <b>{review.listingName}</b>
                    </div>
                    <div className={s.row__side}>
                      <span className={s.rscore} aria-label={`${review.rating} out of 5`}>
                        <Ico n="star" />
                        {review.rating}/5
                      </span>
                      <span suppressHydrationWarning>{formatRelativeTime(review.date)}</span>
                    </div>
                    <p className={s.body}>{review.comment}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* ── Replies ──────────────────────────────────────── */}
          <Panel icon="chat" title="Comments" count={activity.commentCount}>
            {activity.comments.length === 0 ? (
              <None>None written.</None>
            ) : (
              <ul className={s.rows}>
                {activity.comments.map((comment) => (
                  <li key={comment.id} className={s.row}>
                    <div className={s.row__main}>
                      <span>
                        On{' '}
                        <Link href={`/community/post/${comment.post.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', fontWeight: 600 }}>
                          {comment.post.title}
                        </Link>{' '}
                        · <span suppressHydrationWarning>{formatRelativeTime(comment.createdAt)}</span>
                      </span>
                    </div>
                    <p className={s.body}>{comment.content}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* ── Clubs, likes and routes ──────────────────────── */}
          <Panel
            icon="users"
            title="Clubs"
            count={activity.clubs.length}
            aside={
              <span className={s.cnt} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Ico n="heart" />
                {activity.likeCount} {activity.likeCount === 1 ? 'post liked' : 'posts liked'}
              </span>
            }
          >
            {activity.clubs.length === 0 ? (
              <None>Not in any club.</None>
            ) : (
              <div className={s.tagrow} style={{ paddingTop: 18 }}>
                {activity.clubs.map((club) => (
                  <span key={club.id}>
                    {club.name}
                    <small suppressHydrationWarning>{formatRelativeTime(club.joinedAt)}</small>
                  </span>
                ))}
              </div>
            )}
          </Panel>

          <Panel icon="route" title="Saved routes" count={activity.routeCount}>
            {activity.routes.length === 0 ? (
              <None>No routes saved.</None>
            ) : (
              <ul className={s.rows}>
                {activity.routes.map((route) => (
                  <li key={route.id} className={s.row}>
                    <div className={s.row__main}>
                      <b>
                        {route.origin} → {route.destination}
                      </b>
                    </div>
                    <div className={s.row__side}>
                      <span className={s.mono}>{route.distanceKm} km</span>
                      <span suppressHydrationWarning>{formatRelativeTime(route.createdAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <aside className={s.stack18}>
          <MemberRoleCard
            id={member.id}
            name={member.name}
            isAdmin={facts.isAdmin}
            isSelf={isSelf}
            adminCount={facts.adminCount}
            anonymised={facts.anonymised}
          />

          <MemberPasswordCard id={member.id} name={member.name} email={member.email} isAdmin={facts.isAdmin} isSelf={isSelf} />

          {auditPanel}
        </aside>
      </div>

      {/* The anchor the list's Remove link jumps to. */}
      <div id="remove" style={{ marginTop: 18, scrollMarginTop: 96 }}>
        <MemberDeleteCard
          id={member.id}
          name={member.name}
          reviewCount={member.reviewCount}
          savedCount={member.savedCount}
          businessCount={member.businessCount}
          postCount={member.postCount}
          commentCount={facts.commentCount}
          membershipCount={facts.membershipCount}
          isAdmin={facts.isAdmin}
          isSelf={isSelf}
          anonymised={facts.anonymised}
        />
      </div>
    </Page>
  )
}

function Fact({ icon, label, children }: { icon: IcoName; label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>
        <Ico n={icon} />
        {children}
      </dd>
    </div>
  )
}

function None({ children }: { children: React.ReactNode }) {
  return (
    <p className={s.quiet} style={{ padding: '18px 24px 22px' }}>
      {children}
    </p>
  )
}
