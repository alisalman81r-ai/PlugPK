// src/app/admin/(protected)/page.tsx
import Link from 'next/link'
import type * as React from 'react'

import { AdmIcon } from '@/components/admin/admin-icons'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { AlertList } from '@/components/admin/AlertList'
import { DashboardPanel, PanelEmpty } from '@/components/admin/DashboardPanel'
import { LiveNetwork, type CityPin } from '@/components/admin/LiveNetwork'
import { MetricCard } from '@/components/admin/MetricCard'
import { QuickActions } from '@/components/admin/QuickActions'
import { PK_CITIES, pkProject } from '@/components/home/v2/pk-geo'
import { getAdminActor } from '@/lib/db/admin-access'
import { listAllQueues } from '@/lib/db/admin-badges'
import { getLatestPosts } from '@/lib/db/admin-queries'
import { prisma } from '@/lib/db/client'
import { getNetworkHealth, listNetworkAlerts } from '@/lib/db/network-health'
import { getContentCounts, getMemberCount } from '@/lib/db/queries'

/**
 * The network's operations screen — the landing-v2 admin dashboard
 * (admin/index.html): greeting and live status, six KPI tiles, the ink Live
 * network hero with its map, the attention queues, community, alerts and the
 * catalogue.
 *
 * Every figure is counted from a row. Where the product has no source —
 * sessions, revenue, uptime — nothing is shown rather than a believable
 * number: a dashboard is read as a set of measurements.
 */
export const dynamic = 'force-dynamic'

/** Split by the hour in Pakistan, not the server's (UTC) clock. */
function greeting(): string {
  const hour =
    Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', hour: '2-digit', hour12: false }).format(new Date())) % 24
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

/** Published stations per city, placed on the design's map. */
async function stationCities(): Promise<CityPin[]> {
  const rows = await prisma.station.groupBy({ by: ['city'], _count: { _all: true }, _avg: { lat: true, lng: true } })
  return rows
    .map((row) => {
      const known = PK_CITIES[row.city]
      const at = known
        ? { x: known[0], y: known[1] }
        : row._avg.lat !== null && row._avg.lng !== null
          ? pkProject(row._avg.lng, row._avg.lat)
          : null
      return at ? { city: row.city, count: row._count._all, ...at } : null
    })
    .filter((pin): pin is CityPin => pin !== null)
    .sort((a, b) => b.count - a.count)
}

/** Ports on connectors that are not reporting, drawn hatched on the port bar. */
async function unknownPorts(): Promise<number> {
  const sum = await prisma.connector.aggregate({ where: { status: 'unknown' }, _sum: { ports: true, availablePorts: true } })
  return Math.max(0, (sum._sum.ports ?? 0) - (sum._sum.availablePorts ?? 0))
}

export default async function AdminOverviewPage() {
  const [counts, posts, memberCount, queues, health, alertState, actor, cities, unknown] = await Promise.all([
    getContentCounts(),
    getLatestPosts(5),
    getMemberCount(),
    listAllQueues(),
    getNetworkHealth(),
    listNetworkAlerts(),
    getAdminActor(),
    // The map and the hatching are decoration on real figures: if either read
    // fails, the dashboard still loads without them.
    stationCities().catch(() => [] as CityPin[]),
    unknownPorts().catch(() => 0),
  ])
  const { alerts, total: alertTotal } = alertState
  const failedQueues = queues.filter((queue) => queue.failed)
  const { stations, ports } = health
  const waiting = queues.filter((queue) => queue.count > 0)
  const waitingTotal = waiting.reduce((sum, queue) => sum + queue.count, 0)
  // Every station accounted for, not just the absence of offline ones.
  const allOnline = stations.total > 0 && stations.online === stations.total
  const pct = ports.availablePct

  // It reports, it does not reassure.
  const summary =
    stations.total === 0
      ? 'No stations published yet.'
      : alertTotal === 0
        ? 'Your EV network is operating normally.'
        : `${alertTotal} ${alertTotal === 1 ? 'issue needs' : 'issues need'} attention.`

  const catalogue = [
    { label: 'Services', value: counts.services, href: '/admin/services', icon: 'wrench' as const },
    { label: 'Posts', value: counts.posts, href: '/admin/community', icon: 'chat' as const },
    { label: 'Reviews', value: counts.reviews, href: '/admin/reviews', icon: 'star' as const },
    { label: 'Members', value: memberCount, href: '/admin/members', icon: 'users' as const },
  ]
  const catMax = Math.max(1, ...catalogue.map((row) => row.value))

  return (
    <>
      <AdminHeader
        title={`${greeting()}, ${actor?.name.split(' ')[0] || 'Admin'}.`}
        action={
          <>
            <QuickActions />
            <Link className="btn btn--ink" href="/admin/stations/new">
              <AdmIcon name="bolt" />
              Add station
            </Link>
          </>
        }
      >
        <span className="live">
          <i className="pulse" style={alertTotal === 0 ? undefined : ({ '--green': 'var(--amber)' } as React.CSSProperties)} />
          {summary}
        </span>
      </AdminHeader>

      <section className="kpis" aria-label="Key figures">
        <MetricCard
          index={0}
          lit
          ring={stations.total ? stations.online / stations.total : 0}
          label="Active stations"
          value={`${stations.online} / ${stations.total}`}
          detail={
            allOnline || stations.total === 0
              ? stations.total === 0
                ? 'No stations yet'
                : 'All systems operational'
              : [
                  stations.offline > 0 ? `${stations.offline} offline` : null,
                  stations.limited > 0 ? `${stations.limited} limited` : null,
                  stations.unknown > 0 ? `${stations.unknown} unconfirmed` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')
          }
          tone={allOnline ? 'good' : stations.offline > 0 ? 'critical' : stations.total ? 'warn' : 'neutral'}
          help={
            <>
              <b>How many of your charging stations are usable right now.</b> The second number is every station
              you have published; the first is how many are <b>available</b>. Counted live from the Stations table.
            </>
          }
          icon="bolt"
          href="/admin/stations"
        />
        <MetricCard
          index={1}
          ring={ports.total ? ports.available / ports.total : 0}
          label="Available ports"
          value={`${ports.available} / ${ports.total}`}
          detail={pct === null ? 'No ports recorded' : `${pct.toFixed(1)}% currently available`}
          tone={pct === null ? 'neutral' : pct < 25 ? 'warn' : 'good'}
          help={
            <>
              <b>Charging points free for a driver to plug into</b>, added up across every connector — the same figure
              the public site shows drivers.
            </>
          }
          icon="plug"
          href="/admin/connectors"
        />
        <MetricCard
          index={2}
          label="Waiting on you"
          value={failedQueues.length > 0 && waitingTotal === 0 ? '?' : String(waitingTotal)}
          detail={
            failedQueues.length > 0
              ? `${failedQueues.length} ${failedQueues.length === 1 ? 'queue' : 'queues'} could not be counted`
              : waitingTotal === 0
                ? 'Every queue is clear'
                : `In ${waiting.length} ${waiting.length === 1 ? 'queue' : 'queues'}`
          }
          tone={failedQueues.length > 0 ? 'critical' : waitingTotal === 0 ? 'good' : 'warn'}
          help={
            <>
              <b>Work other people are waiting on you for</b>: business and service applications, meeting requests and
              new community posts, added up.
            </>
          }
          icon="inbox"
          href={waiting[0]?.href}
        />
        <MetricCard
          index={3}
          label="Members"
          value={memberCount.toLocaleString('en-PK')}
          detail="Accounts on the site"
          help={<><b>People with a plugpk account.</b> Counted from the members table.</>}
          icon="users"
          href="/admin/members"
        />
        <MetricCard
          index={4}
          label="Driver reviews"
          value={counts.reviews.toLocaleString('en-PK')}
          detail="Ratings left on listings"
          help={<><b>Reviews drivers have left on stations and businesses.</b> Click to moderate them.</>}
          icon="star"
          href="/admin/reviews"
        />
        <MetricCard
          index={5}
          label="Active alerts"
          value={String(alertTotal)}
          detail={
            alertTotal === 0
              ? 'Nothing needs attention'
              : alertTotal > alerts.length
                ? `Requires attention · ${alerts.length} listed`
                : 'Requires attention'
          }
          tone={alertTotal === 0 ? 'good' : 'critical'}
          help={
            <>
              <b>Things wrong with the network right now</b>: an offline station or connector. A connector in use is not
              an alert. Present conditions, not a log.
            </>
          }
          icon="alert"
        />
      </section>

      <div className="bento">
        <LiveNetwork
          className="span-8"
          index={2}
          health={health}
          cities={cities}
          unknownPorts={unknown}
          help={
            <>
              <b>The health of the whole network.</b> Stations by state and how many ports are free — the same query as
              the tiles above, so they never disagree.
            </>
          }
        />

        <DashboardPanel
          className="span-4"
          index={3}
          title="Needs your attention"
          description={
            failedQueues.length > 0
              ? 'Some queues could not be counted — open them to check.'
              : 'Every review queue in one place.'
          }
        >
          {failedQueues.length === 0 ? (
            waitingTotal === 0 ? (
              <div className="allclear">
                <AdmIcon name="okc" />
                <div>
                  <b>All clear.</b>
                  <span>Nothing is waiting on you.</span>
                </div>
              </div>
            ) : (
              <div className="allclear allclear--warn">
                <AdmIcon name="inbox" />
                <div>
                  <b>
                    {waitingTotal} waiting.
                  </b>
                  <span>Open a queue to deal with it.</span>
                </div>
              </div>
            )
          ) : null}
          <ul className="queue">
            {queues.map((queue) => (
              <li key={queue.href}>
                <Link href={queue.href}>
                  {queue.failed ? (
                    <AdmIcon name="alert" className="chk chk--warn" />
                  ) : queue.count > 0 ? (
                    <span className="qn">{queue.count}</span>
                  ) : (
                    <AdmIcon name="okc" className="chk" />
                  )}
                  <div>
                    <b>{queue.title}</b>
                    <span>{queue.failed ? 'Could not be counted' : queue.count > 0 ? queue.label : 'Nothing waiting'}</span>
                  </div>
                  <AdmIcon name="arrow" className="go" />
                </Link>
              </li>
            ))}
          </ul>
        </DashboardPanel>

        <DashboardPanel
          className="span-8"
          index={4}
          divided
          title="Latest community activity"
          description="Newest posts first."
          help={<>The newest discussions on the public community pages. Spot a question nobody has answered, or a post that should not be up.</>}
          action={
            <Link className="link" href="/admin/community">
              Moderate
              <AdmIcon name="arrow" />
            </Link>
          }
        >
          {posts.length > 0 ? (
            <ul className="rows">
              {posts.map((post) => (
                <li key={post.id}>
                  <Link className="post" href={`/admin/community?q=${encodeURIComponent(post.title.slice(0, 60))}`}>
                    <span className="post__ico">
                      <AdmIcon name="chat" />
                    </span>
                    <div>
                      <b>{post.title}</b>
                      <span>{post.userName}</span>
                    </div>
                    <span className="post__c" aria-label={`${post.commentCount} comments`}>
                      <AdmIcon name="chat" />
                      {post.commentCount}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <PanelEmpty icon="chat" title="No posts yet." reason="Community posts written by members will appear here for moderation." />
          )}
        </DashboardPanel>

        <div className="span-4 stack">
          <DashboardPanel
            index={5}
            title="Active alerts"
            description={
              alertTotal > alerts.length
                ? `Present conditions, not a log. Showing ${alerts.length} of ${alertTotal}.`
                : 'Present conditions, not a log.'
            }
            help={<>Each row is a station or connector that is offline now; it opens the record that can fix it. Fix the row and the alert goes by itself.</>}
          >
            {alerts.length > 0 ? (
              <AlertList alerts={alerts} />
            ) : (
              <PanelEmpty
                icon="okc"
                title="Nothing needs attention."
                reason="No station is offline and every connector is reporting available."
              />
            )}
          </DashboardPanel>

          <DashboardPanel index={6} divided title="Catalogue" description="What the platform holds.">
            <ul className="rows">
              {catalogue.map((row) => (
                <li key={row.label}>
                  <Link className="cat" href={row.href}>
                    <AdmIcon name={row.icon} />
                    <span>{row.label}</span>
                    <b className="mono">{row.value.toLocaleString('en-PK')}</b>
                  </Link>
                  <div className="cat__bar" aria-hidden="true">
                    <i style={{ width: `${(row.value / catMax) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </DashboardPanel>
        </div>
      </div>
    </>
  )
}
