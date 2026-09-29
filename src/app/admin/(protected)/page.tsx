// src/app/admin/(protected)/page.tsx
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Inbox,
  MessageSquare,
  Plug,
  Star,
  Users,
  Wrench,
  Zap,
} from '@/components/ui/icons'
import Link from 'next/link'

import { AlertList } from '@/components/admin/AlertList'
import { DashboardPanel, PanelEmpty } from '@/components/admin/DashboardPanel'
import { LiveNetwork } from '@/components/admin/LiveNetwork'
import { MetricCard } from '@/components/admin/MetricCard'
import { QuickActions } from '@/components/admin/QuickActions'
import { listAllQueues } from '@/lib/db/admin-badges'
import { getNetworkHealth, listNetworkAlerts } from '@/lib/db/network-health'
import { getContentCounts, getMemberCount, getPosts } from '@/lib/db/queries'

/**
 * The network's operations screen.
 *
 * ── What this page is allowed to claim ────────────────────────────────
 *
 * Every figure below is counted from a row. Where the product has no source —
 * charging sessions, revenue, uptime — the card and the panel are built and
 * left explicitly empty, with the reason on the face of them.
 *
 * That is a deliberate choice over the alternative, which was to seed
 * believable numbers so the layout looked finished. A dashboard is read as a
 * set of measurements; nobody checks the query behind a figure that looks
 * reasonable. Six filled cards where three are fiction is a worse artefact
 * than six cards where three say what is missing, because the first one is
 * wrong in a way the reader cannot see.
 *
 * The schema has 25 models and none of them records a session, a payment or a
 * heartbeat. Connector carries no pricing on purpose — the schema's own note
 * says a stale rate shown as fact is worse than no rate, because a driver who
 * arrives expecting one price and is charged another stops trusting the map.
 * So there is no arithmetic available that would make a revenue figure true.
 *
 * ── Order ─────────────────────────────────────────────────────────────
 *
 * Network state first, then what is broken, then analytics, then community.
 * Community moved below the fold: moderation matters, but a station being
 * offline is the reason somebody opens this page at 2am.
 */
export const dynamic = 'force-dynamic'

/** Split by the local hour, so the greeting is right for whoever is reading. */
function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default async function AdminOverviewPage() {
  const [counts, posts, memberCount, queues, health, alerts] = await Promise.all([
    getContentCounts(),
    getPosts(),
    getMemberCount(),
    listAllQueues(),
    getNetworkHealth(),
    listNetworkAlerts(),
  ])

  const { stations, ports } = health
  const waiting = queues.filter((queue) => queue.count > 0)
  const waitingTotal = waiting.reduce((sum, queue) => sum + queue.count, 0)
  // Every station accounted for, not just the absence of offline ones. This
  // read `offline === 0 && unknown === 0` and so printed 'All systems
  // operational' over a 5 / 6 figure, because the sixth was `limited` and fell
  // through both checks.
  const allOnline = stations.online === stations.total
  const pct = ports.availablePct

  // The one line under the greeting. It reports, it does not reassure: saying
  // "operating normally" while three stations are dark would be the page's
  // first and worst lie.
  const summary =
    stations.total === 0
      ? 'No stations published yet.'
      : alerts.length === 0
        ? 'Your EV network is operating normally.'
        : `${alerts.length} ${alerts.length === 1 ? 'issue needs' : 'issues need'} attention.`

  return (
    <>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 bg-white px-5 py-5 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-[-0.01em] text-slate-900">
              {greeting()}, Admin
            </h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-ui-sm text-slate-500">
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  alerts.length === 0 ? 'bg-green-500' : 'bg-amber-500'
                }`}
              />
              {summary}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <QuickActions />
            <Link
              href="/admin/stations/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-plug-blue-600 px-3.5 py-2 text-ui-sm font-semibold text-white transition-colors duration-150 hover:bg-plug-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
            >
              <Zap size={15} aria-hidden="true" />
              Add station
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-5 py-6 sm:px-8">
        {/* ── KPI row ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <MetricCard
            label="Active stations"
            value={`${stations.online} / ${stations.total}`}
            detail={
              allOnline
                ? 'All systems operational'
                : [
                    stations.offline > 0 ? `${stations.offline} offline` : null,
                    stations.limited > 0 ? `${stations.limited} limited` : null,
                    stations.unknown > 0 ? `${stations.unknown} unconfirmed` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')
            }
            tone={allOnline ? 'good' : stations.offline > 0 ? 'critical' : 'warn'}
            help={
              <>
                <b>How many of your charging stations are usable right now.</b> The
                second number is every station you have published; the first is how
                many are in the <b>available</b> state. Counted live from the Stations
                table, not stored. Click the card to open Stations and fix whatever is
                offline.
              </>
            }
            icon={Zap}
            href="/admin/stations"
          />
          <MetricCard
            label="Available ports"
            value={`${ports.available} / ${ports.total}`}
            detail={pct === null ? 'No ports recorded' : `${pct.toFixed(1)}% currently available`}
            tone={pct !== null && pct < 25 ? 'warn' : 'good'}
            help={
              <>
                <b>Charging points free for a driver to plug into.</b> Added up across
                every connector on every station — a station with 4 ports where 1 car
                is charging contributes 3 free of 4. This is the same figure the public
                site shows drivers, so it can never disagree with it. Click to open
                Connectors.
              </>
            }
            icon={Plug}
            href="/admin/connectors"
          />
          <MetricCard
            label="Waiting on you"
            value={String(waitingTotal)}
            detail={
              waitingTotal === 0
                ? 'Every queue is clear'
                : `In ${waiting.length} ${waiting.length === 1 ? 'queue' : 'queues'}`
            }
            tone={waitingTotal === 0 ? 'good' : 'warn'}
            help={
              <>
                <b>Work other people are waiting on you for.</b> Business applications,
                service applications, meeting requests and new community posts, added
                up. The panel below breaks it down and links to each one.
              </>
            }
            icon={Inbox}
            href={waiting[0]?.href}
          />
          <MetricCard
            label="Members"
            value={memberCount.toLocaleString('en-PK')}
            detail="Accounts on the site"
            tone="neutral"
            help={
              <>
                <b>People with a Plug.pk account.</b> Counted from the members table, so
                it rises the moment someone signs up. Click to see and manage them.
              </>
            }
            icon={Users}
            href="/admin/members"
          />
          <MetricCard
            label="Driver reviews"
            value={counts.reviews.toLocaleString('en-PK')}
            detail="Ratings left on stations"
            tone="neutral"
            help={
              <>
                <b>Reviews drivers have left on charging stations.</b> Every one is shown
                on the public station page it belongs to.
              </>
            }
            icon={Star}
          />
          <MetricCard
            label="Active alerts"
            value={String(alerts.length)}
            detail={alerts.length === 0 ? 'Nothing needs attention' : 'Requires attention'}
            help={
              <>
                <b>Things wrong with the network right now.</b> An offline station
                counts as one, and so does an offline connector. A connector that is
                in use does <b>not</b> — a car charging is the product working. This is
                the present state read live, not a log of past problems.
              </>
            }
            tone={alerts.length === 0 ? 'good' : 'critical'}
            icon={AlertTriangle}
          />
        </div>

        {/*
          ── Needs your attention ─────────────────────────────────────
          Always shown, with every queue listed. It used to appear only when a
          queue had something in it, so an admin could not tell "all clear"
          from "not checked". Now each queue is a row that says either how many
          are waiting or that there is nothing to do, and opens the page that
          clears it.
        */}
        <DashboardPanel
          title="Needs your attention"
          description={
            waitingTotal === 0
              ? 'All clear — nothing is waiting on you.'
              : `${waitingTotal} ${waitingTotal === 1 ? 'item is' : 'items are'} waiting. Open a row to deal with it.`
          }
        >
          <ul className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-4">
            {queues.map((queue) => {
              const busy = queue.count > 0
              return (
                <li key={queue.href} className="sm:border-slate-100 sm:[&:not(:last-child)]:border-r">
                  <Link
                    href={queue.href}
                    className="group/queue flex h-full items-start gap-3 px-5 py-4 transition-colors duration-150 hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-plug-blue-500"
                  >
                    {busy ? (
                      <span className="mt-0.5 text-2xl font-bold leading-none tabular-nums text-amber-600">
                        {queue.count}
                      </span>
                    ) : (
                      <CheckCircle2 size={22} aria-hidden="true" className="mt-0.5 shrink-0 text-green-600" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-ui-sm font-semibold text-slate-900">{queue.title}</span>
                      <span className="mt-0.5 block text-ui-xs text-slate-500">
                        {busy ? queue.label : 'Nothing waiting'}
                      </span>
                    </span>
                    <ArrowRight
                      size={15}
                      aria-hidden="true"
                      className="mt-1 shrink-0 text-slate-300 transition-all duration-200 group-hover/queue:translate-x-0.5 group-hover/queue:text-plug-blue-600"
                    />
                  </Link>
                </li>
              )
            })}
          </ul>
        </DashboardPanel>

        {/* ── Live network + alerts ─────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-5">
          <DashboardPanel
            title="Live network"
            description="Counted from published stations, right now."
            help={
              <>
                <b>The health of your whole network on one bar.</b> It breaks your
                stations into online, limited, offline and unconfirmed, and shows how
                many charging ports are free. Same query as the Active stations card
                above, so the two can never disagree.
              </>
            }
            className="lg:col-span-3"
            action={
              <Link
                href="/admin/stations"
                className="inline-flex items-center gap-1 text-ui-xs font-semibold text-plug-blue-600 hover:text-plug-blue-700"
              >
                All stations
                <ArrowRight size={13} aria-hidden="true" />
              </Link>
            }
          >
            <LiveNetwork health={health} />
          </DashboardPanel>

          <DashboardPanel
            title="Active alerts"
            description="Present conditions, not a log."
            help={
              <>
                <b>Your to-do list, worst first.</b> Each row is a station or connector
                that is currently offline, and clicking it opens the exact record that
                can fix it. There is no &ldquo;dismiss&rdquo; because these are not
                stored events — fix the row and the alert disappears by itself.
              </>
            }
            className="lg:col-span-2"
          >
            {alerts.length > 0 ? (
              <AlertList alerts={alerts} />
            ) : (
              <PanelEmpty
                icon={CheckCircle2}
                title="Nothing needs attention"
                reason="No station is offline and every connector is reporting available."
              />
            )}
          </DashboardPanel>
        </div>

        {/* ── Community, deliberately last ──────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-3">
          <DashboardPanel
            title="Latest community activity"
            description="Newest posts first."
            help={
              <>
                <b>The newest discussions your users have posted</b> on the public
                community pages. Real posts from real accounts. Use it to spot a
                question nobody has answered or a post that should not be up.
              </>
            }
            className="lg:col-span-2"
            action={
              <Link
                href="/admin/community"
                className="inline-flex items-center gap-1 text-ui-xs font-semibold text-plug-blue-600 hover:text-plug-blue-700"
              >
                Moderate
                <ArrowRight size={13} aria-hidden="true" />
              </Link>
            }
          >
            {posts.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {posts.slice(0, 5).map((post) => (
                  <li key={post.id}>
                    <Link
                      href="/admin/community"
                      className="block px-5 py-3 transition-colors duration-150 hover:bg-slate-50/80"
                    >
                      <span className="line-clamp-1 text-ui-sm font-medium text-slate-900">
                        {post.title}
                      </span>
                      <span className="mt-0.5 block text-ui-xs text-slate-400">
                        {post.userName} · {post.commentCount}{' '}
                        {post.commentCount === 1 ? 'comment' : 'comments'}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <PanelEmpty
                icon={MessageSquare}
                title="No posts yet"
                reason="Community posts written by members will appear here for moderation."
              />
            )}
          </DashboardPanel>

          {/* The old count cards, kept as a catalogue summary rather than as
              the headline. They are the size of the estate, not its state. */}
          <DashboardPanel title="Catalogue" description="What the platform holds.">
            <ul className="divide-y divide-slate-100">
              {[
                { label: 'Services', value: counts.services, href: '/admin/services', icon: Wrench },
                { label: 'Posts', value: counts.posts, href: '/admin/community', icon: MessageSquare },
                { label: 'Reviews', value: counts.reviews, icon: Star },
                { label: 'Members', value: memberCount, href: '/admin/members', icon: Users },
              ].map((row) => {
                const Icon = row.icon
                const inner = (
                  <>
                    <Icon size={15} aria-hidden="true" className="shrink-0 text-slate-400" />
                    <span className="min-w-0 flex-1 text-ui-sm text-slate-600">{row.label}</span>
                    <span className="shrink-0 text-ui-sm font-bold tabular-nums text-slate-900">
                      {row.value}
                    </span>
                  </>
                )
                return (
                  <li key={row.label}>
                    {row.href ? (
                      <Link
                        href={row.href}
                        className="flex items-center gap-3 px-5 py-3 transition-colors duration-150 hover:bg-slate-50/80"
                      >
                        {inner}
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3 px-5 py-3">{inner}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          </DashboardPanel>
        </div>
      </div>
    </>
  )
}
