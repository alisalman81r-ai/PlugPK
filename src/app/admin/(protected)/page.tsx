// src/app/admin/(protected)/page.tsx
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BatteryCharging,
  CheckCircle2,
  MessageSquare,
  Plug,
  Receipt,
  ShieldCheck,
  Star,
  Users,
  Wrench,
  Zap,
} from 'lucide-react'
import Link from 'next/link'

import { AlertList } from '@/components/admin/AlertList'
import { DashboardPanel, PanelEmpty } from '@/components/admin/DashboardPanel'
import { LiveNetwork } from '@/components/admin/LiveNetwork'
import { MetricCard } from '@/components/admin/MetricCard'
import { PerformanceChart } from '@/components/admin/PerformanceChart'
import { QuickActions } from '@/components/admin/QuickActions'
import { listPendingQueues } from '@/lib/db/admin-badges'
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
  const [counts, posts, memberCount, pending, health, alerts] = await Promise.all([
    getContentCounts(),
    getPosts(),
    getMemberCount(),
    listPendingQueues(),
    getNetworkHealth(),
    listNetworkAlerts(),
  ])

  const { stations, ports } = health
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
            icon={Zap}
            href="/admin/stations"
          />
          <MetricCard
            label="Available ports"
            value={`${ports.available} / ${ports.total}`}
            detail={pct === null ? 'No ports recorded' : `${pct.toFixed(1)}% currently available`}
            tone={pct !== null && pct < 25 ? 'warn' : 'good'}
            icon={Plug}
            href="/admin/connectors"
          />
          <MetricCard
            label="Charging sessions"
            value={null}
            unavailableReason="No session is recorded anywhere yet — needs a charger integration."
            icon={BatteryCharging}
          />
          <MetricCard
            label="Revenue today"
            value={null}
            unavailableReason="Connectors carry no pricing, so there is nothing to total."
            icon={Receipt}
          />
          <MetricCard
            label="Network uptime"
            value={null}
            unavailableReason="Station state is stored, but not its history — no uptime to compute."
            icon={ShieldCheck}
          />
          <MetricCard
            label="Active alerts"
            value={String(alerts.length)}
            detail={alerts.length === 0 ? 'Nothing needs attention' : 'Requires attention'}
            tone={alerts.length === 0 ? 'good' : 'critical'}
            icon={AlertTriangle}
          />
        </div>

        {/* ── Live network + alerts ─────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-5">
          <DashboardPanel
            title="Live network"
            description="Counted from published stations, right now."
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

        {/* ── Queues that already worked, kept ──────────────────────── */}
        {pending.length > 0 ? (
          <DashboardPanel
            title="Needs attention"
            description="Queues with something in them. Acting on an item clears it here."
          >
            <ul className="divide-y divide-slate-100">
              {pending.map((queue) => (
                <li key={queue.href}>
                  <Link
                    href={queue.href}
                    className="group/queue flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-plug-blue-500"
                  >
                    <span className="flex h-6 min-w-[1.5rem] shrink-0 items-center justify-center rounded-full bg-plug-blue-600 px-1.5 text-ui-xs font-bold tabular-nums text-white">
                      {queue.count}
                    </span>
                    <span className="min-w-0 flex-1 text-ui-sm font-medium text-slate-900">
                      {queue.label}
                    </span>
                    <ArrowRight
                      size={15}
                      aria-hidden="true"
                      className="shrink-0 text-slate-300 transition-all duration-200 group-hover/queue:translate-x-0.5 group-hover/queue:text-plug-blue-600"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </DashboardPanel>
        ) : null}

        {/* ── Performance ───────────────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-2">
          <DashboardPanel title="Charging sessions" description="Sessions completed over time.">
            <PerformanceChart
              data={[]}
              emptyReason="Nothing writes a session row yet. When a charger integration lands, this chart reads it with no change to the page."
            />
          </DashboardPanel>

          <DashboardPanel title="Revenue" description="Billed across the network.">
            <PerformanceChart
              data={[]}
              unitPrefix="Rs "
              emptyReason="Connectors hold no price, so revenue cannot be totalled. Adding pricing is the prerequisite, not a change here."
            />
          </DashboardPanel>
        </div>

        {/* ── Recent sessions ───────────────────────────────────────── */}
        <DashboardPanel
          title="Recent charging sessions"
          description="Who charged, where, and for how long."
        >
          <PanelEmpty
            icon={Activity}
            title="No sessions recorded"
            reason="This table is built and waiting on a source. The product stores stations, connectors and their live port counts, but never records an individual charge."
            action={{ label: 'Review connectors', href: '/admin/connectors' }}
          />
        </DashboardPanel>

        {/* ── Community, deliberately last ──────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-3">
          <DashboardPanel
            title="Latest community activity"
            description="Newest posts first."
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
