// src/app/admin/(protected)/page.tsx
import { MessageSquare, Plug, Star, Wrench, Zap, type LucideIcon } from 'lucide-react'
import Link from 'next/link'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { getContentCounts, getPosts, getStations } from '@/lib/db/queries'
import { getPortAvailability } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface CountCard {
  label: string
  value: number
  href?: string
  icon: LucideIcon
  tone: string
}

export default async function AdminOverviewPage() {
  const [counts, stations, posts] = await Promise.all([
    getContentCounts(),
    getStations(),
    getPosts(),
  ])

  const cards: CountCard[] = [
    { label: 'Stations', value: counts.stations, href: '/admin/stations', icon: Zap, tone: 'bg-blue-50 text-plug-blue-600' },
    { label: 'Connectors', value: counts.connectors, icon: Plug, tone: 'bg-cyan-50 text-cyan-600' },
    { label: 'Services', value: counts.services, href: '/admin/services', icon: Wrench, tone: 'bg-violet-50 text-violet-600' },
    { label: 'Posts', value: counts.posts, href: '/admin/community', icon: MessageSquare, tone: 'bg-amber-50 text-amber-600' },
    { label: 'Reviews', value: counts.reviews, icon: Star, tone: 'bg-emerald-50 text-emerald-600' },
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
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {cards.map((card) => {
            const Icon = card.icon
            const body = (
              <>
                <span className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${card.tone}`}>
                  <Icon size={18} aria-hidden="true" />
                </span>
                <p className="font-mono text-3xl font-black text-slate-900">{card.value}</p>
                <p className="mt-1 text-ui-sm text-slate-500">{card.label}</p>
              </>
            )

            return card.href ? (
              <Link
                key={card.label}
                href={card.href}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-e2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 motion-reduce:transition-none"
              >
                {body}
              </Link>
            ) : (
              <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5">
                {body}
              </div>
            )
          })}
        </div>

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
