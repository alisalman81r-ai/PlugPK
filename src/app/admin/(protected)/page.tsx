// src/app/admin/(protected)/page.tsx
import { ArrowRight, MessageSquare, Plug, Star, Users, Wrench, Zap, type LucideIcon } from 'lucide-react'
import Link from 'next/link'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { listPendingQueues } from '@/lib/db/admin-badges'
import { getContentCounts, getMemberCount, getPosts, getStations } from '@/lib/db/queries'
import { getPortAvailability } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface CountCard {
  label: string
  value: number
  href?: string
  icon: LucideIcon
}

export default async function AdminOverviewPage() {
  const [counts, stations, posts, memberCount, pending] = await Promise.all([
    getContentCounts(),
    getStations(),
    getPosts(),
    getMemberCount(),
    listPendingQueues(),
  ])

  const cards: CountCard[] = [
    { label: 'Stations', value: counts.stations, href: '/admin/stations', icon: Zap },
    { label: 'Connectors', value: counts.connectors, icon: Plug },
    { label: 'Services', value: counts.services, href: '/admin/services', icon: Wrench },
    { label: 'Posts', value: counts.posts, href: '/admin/community', icon: MessageSquare },
    { label: 'Reviews', value: counts.reviews, icon: Star },
    { label: 'Members', value: memberCount, href: '/admin/members', icon: Users },
  ]

  // Surfaced because it is the one number that goes stale fastest and the
  // most likely reason an operator opened this page at all.
  const offline = stations.filter((station) => station.status === 'offline')
  const totalPorts = stations.reduce((sum, station) => sum + getPortAvailability(station).total, 0)
  const freePorts = stations.reduce(
    (sum, station) => sum + getPortAvailability(station).available,
    0,
  )

  return (
    <>
      <AdminHeader
        title="Overview"
        description="Everything here writes straight to the live site."
      />

      <div className="px-8 py-8">
        {/*
          Six across at the widest, so the row completes.

          It was five columns holding six cards, which left Members alone on a
          second row beside four columns of nothing — the first thing on the
          first screen of the portal, and it read as a broken layout rather than
          as six figures.
        */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {cards.map((card) => {
            const Icon = card.icon
            const body = (
              <>
                {/*
                  Outlined rather than six different pastel fills.

                  The tones encoded nothing — they were one arbitrary colour per
                  metric, and the only rainbow in the product, sitting next to a
                  sidebar that is entirely slate. Removing them costs no signal
                  and lets the figures be the thing you read first. The holder
                  warms to brand on hover, matching the outlined holders on the
                  public site.
                */}
                <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border-[1.5px] border-slate-300 text-slate-500 transition-colors duration-200 group-hover/stat:border-plug-blue-400 group-hover/stat:text-plug-blue-600">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <p className="font-mono text-3xl font-black tabular-nums text-slate-900">
                  {card.value}
                </p>
                <p className="mt-1 text-ui-sm text-slate-500">{card.label}</p>
              </>
            )

            return card.href ? (
              <Link
                key={card.label}
                href={card.href}
                className="group/stat rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-e2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 motion-reduce:transition-none"
              >
                {body}
              </Link>
            ) : (
              <div key={card.label} className="group/stat rounded-2xl border border-slate-200 bg-white p-5">
                {body}
              </div>
            )
          })}
        </div>

        {/*
          What is actually waiting, in words.

          The six figures above are the size of the estate; this is the only
          part of the screen that is a to-do list, so it is the one thing an
          operator opening the portal needs to see first. It renders nothing at
          all when every queue is empty — an empty "Needs attention" panel
          teaches people to stop reading it.

          The same counts drive the sidebar badges, from one function, so the
          two can never disagree.
        */}
        {pending.length > 0 ? (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-bold text-slate-900">Needs attention</h2>
            <p className="mb-5 text-ui-sm text-slate-500">
              Queues with something in them. Acting on an item clears it here.
            </p>

            <ul className="flex flex-col gap-2">
              {pending.map((queue) => (
                <li key={queue.href}>
                  <Link
                    href={queue.href}
                    className="group/queue flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 transition-colors duration-200 hover:border-plug-blue-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
                  >
                    <span className="flex h-7 min-w-[1.75rem] shrink-0 items-center justify-center rounded-full bg-plug-blue-600 px-2 font-mono text-ui-xs font-bold tabular-nums text-white">
                      {queue.count}
                    </span>
                    {/* min-w-0 so the label can wrap rather than forcing the
                        row wider than the viewport — a flex child's default
                        min-width is its content, which is what pushed this
                        panel 16px past the screen edge on a 390px phone. */}
                    <span className="min-w-0 flex-1 text-ui font-medium text-slate-900">
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
          </section>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-1 font-bold text-slate-900">Live port availability</h2>
            <p className="mb-5 text-ui-sm text-slate-500">
              Across every station currently published.
            </p>
            <p className="font-mono text-4xl font-black text-slate-900">
              {freePorts}
              <span className="text-slate-300"> / {totalPorts}</span>
            </p>
            <p className="mt-1 text-ui-sm text-slate-500">ports free right now</p>

            {offline.length > 0 ? (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-ui-sm font-semibold text-amber-800">
                  {offline.length} station{offline.length === 1 ? '' : 's'} marked offline
                </p>
                <ul className="mt-1.5 flex flex-col gap-1">
                  {offline.map((station) => (
                    <li key={station.id}>
                      <Link
                        href={`/admin/stations/${station.id}`}
                        className="text-ui-sm text-amber-700 underline-offset-2 hover:underline"
                      >
                        {station.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-1 font-bold text-slate-900">Latest community posts</h2>
            <p className="mb-5 text-ui-sm text-slate-500">Newest first.</p>
            <ul className="flex flex-col divide-y divide-slate-100">
              {posts.slice(0, 5).map((post) => (
                <li key={post.id} className="py-3 first:pt-0 last:pb-0">
                  <Link
                    href={`/admin/community`}
                    className="line-clamp-1 text-ui font-medium text-slate-900 hover:text-plug-blue-600"
                  >
                    {post.title}
                  </Link>
                  <p className="mt-0.5 text-ui-xs text-slate-400">
                    {post.userName} · {post.commentCount} comment
                    {post.commentCount === 1 ? '' : 's'}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  )
}
