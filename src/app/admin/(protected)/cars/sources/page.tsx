// src/app/admin/(protected)/cars/sources/page.tsx
import { Ban, CheckCircle2, Clock, Database, ImageOff, ShieldQuestion } from 'lucide-react'
import Link from 'next/link'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { listImageCandidates } from '@/lib/db/car-review-queries'
import { getStagingStats, listSources } from '@/lib/db/car-source-queries'
import { prisma } from '@/lib/db/client'
import { cn } from '@/lib/utils'

/**
 * Sources, runs and image provenance.
 *
 * The operational view behind the review queue: which providers exist, whether
 * each is permitted to run, what the last crawl did, and which externally-found
 * images are waiting on a licence decision.
 *
 * Nothing on this page publishes anything. Approving an image here marks it
 * reviewed; the file still has to be placed by hand, because the directory the
 * public catalogue reads from holds licensed files whose attribution is recorded
 * separately.
 */

export const metadata = { title: { absolute: 'Sources · Plug.pk admin' } }
export const dynamic = 'force-dynamic'

const ROBOTS_TONE: Record<string, string> = {
  allowed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  disallowed: 'border-red-200 bg-red-50 text-red-700',
  unreachable: 'border-amber-200 bg-amber-50 text-amber-700',
  unchecked: 'border-slate-200 bg-slate-50 text-slate-600',
}

export default async function AdminCarSourcesPage() {
  const [sources, stats, runs, images, priceCount] = await Promise.all([
    listSources(),
    getStagingStats(),
    prisma.crawlRun.findMany({ orderBy: { startedAt: 'desc' }, take: 12 }),
    listImageCandidates('pending', 20),
    prisma.carPriceHistory.count(),
  ])

  return (
    <>
      <AdminHeader
        title="Sources"
        description={`${sources.length} registered · ${stats.total} staged record(s) · ${priceCount} price point(s)`}
        action={
          <Link
            href="/admin/cars/review"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-plug-blue-600 px-4 text-ui font-semibold text-white transition-colors hover:bg-plug-blue-700"
          >
            Review queue
          </Link>
        }
      />

      <div className="flex flex-col gap-8 px-8 py-8">
        {/* ── Sources ──────────────────────────────────────────────── */}
        <section>
          <h2 className="mb-3 text-ui-sm font-bold uppercase tracking-[0.1em] text-slate-500">
            Registered sources
          </h2>

          {sources.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center text-ui-sm text-slate-500">
              None yet. A source registers itself the first time{' '}
              <code className="font-mono">npm run crawl:source</code> runs against it — including
              when it refuses, so a blocked source is still recorded with its reason.
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-ui-xs uppercase tracking-wider text-slate-400">
                    <th scope="col" className="px-5 py-3 font-semibold">Source</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Enabled</th>
                    <th scope="col" className="px-5 py-3 font-semibold">robots.txt</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Trust</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Last crawl</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map((source) => (
                    <tr key={source.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{source.name}</p>
                        <p className="mt-0.5 font-mono text-ui-xs text-slate-400">{source.baseUrl}</p>
                        {source.robotsNote ? (
                          <p className="mt-1.5 max-w-xl text-ui-xs leading-relaxed text-slate-500">
                            {source.robotsNote}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-5 py-4">
                        {source.isEnabled ? (
                          <span className="inline-flex items-center gap-1.5 text-ui-sm font-semibold text-emerald-700">
                            <CheckCircle2 size={14} aria-hidden="true" />
                            on
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-ui-sm text-slate-500">
                            <Ban size={14} aria-hidden="true" />
                            off
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            'inline-flex rounded-full border px-2.5 py-0.5 text-ui-xs font-bold',
                            ROBOTS_TONE[source.robotsStatus] ?? ROBOTS_TONE.unchecked,
                          )}
                        >
                          {source.robotsStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-ui-sm text-slate-600">
                        {source.trustRank}
                      </td>
                      <td className="px-5 py-4 text-ui-sm text-slate-600">
                        {source.lastCrawledAt
                          ? source.lastCrawledAt.toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-3 text-ui-xs leading-relaxed text-slate-500">
            A source may only be crawled while it is enabled <em>and</em> its robots status reads
            &ldquo;allowed&rdquo;. Both are required, and &ldquo;unchecked&rdquo; is not
            sufficient — the check is a precondition, not a formality. Trust here is the source&rsquo;s
            default; per-field priorities live in <code className="font-mono">crawler/priority-config.ts</code>.
          </p>
        </section>

        {/* ── Runs ─────────────────────────────────────────────────── */}
        <section>
          <h2 className="mb-3 text-ui-sm font-bold uppercase tracking-[0.1em] text-slate-500">
            Recent runs
          </h2>

          {runs.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center text-ui-sm text-slate-500">
              No runs recorded.
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-ui-xs uppercase tracking-wider text-slate-400">
                    <th scope="col" className="px-5 py-3 font-semibold">Started</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Source</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Found</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Stored</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Failed</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-5 py-3 text-ui-sm text-slate-600">
                        {run.startedAt.toLocaleString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-5 py-3 font-mono text-ui-sm text-slate-700">{run.sourceId}</td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            'text-ui-sm font-semibold',
                            run.status === 'completed'
                              ? 'text-emerald-700'
                              : run.status === 'blocked'
                                ? 'text-slate-500'
                                : run.status === 'failed'
                                  ? 'text-red-700'
                                  : 'text-amber-700',
                          )}
                        >
                          {run.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-ui-sm text-slate-600">{run.recordsFound}</td>
                      <td className="px-5 py-3 font-mono text-ui-sm text-slate-600">{run.recordsStored}</td>
                      <td className="px-5 py-3 font-mono text-ui-sm text-slate-600">{run.recordsFailed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-3 flex items-start gap-1.5 text-ui-xs leading-relaxed text-slate-500">
            <Clock size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              <strong>blocked</strong> is a successful outcome, not a failure: it means the source
              refused to run because access was not permitted, which is the system working.
            </span>
          </p>
        </section>

        {/* ── Image candidates ─────────────────────────────────────── */}
        <section>
          <h2 className="mb-3 text-ui-sm font-bold uppercase tracking-[0.1em] text-slate-500">
            Image candidates
          </h2>

          {images.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center text-ui-sm text-slate-500">
              None pending. Externally-found images are recorded as URLs with their licence —
              nothing is downloaded on discovery.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {images.map((candidate) => (
                <div
                  key={candidate.id}
                  className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-11 w-16 shrink-0 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-slate-400"
                  >
                    <ImageOff size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{candidate.car.fullName}</p>
                    <p className="mt-0.5 break-all font-mono text-ui-xs text-slate-400">
                      {candidate.imageUrl}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-ui-xs font-semibold',
                      candidate.licence
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700',
                    )}
                  >
                    <ShieldQuestion size={12} aria-hidden="true" />
                    {candidate.licence ?? 'no licence recorded'}
                  </span>
                </div>
              ))}
            </div>
          )}

          <p className="mt-3 text-ui-xs leading-relaxed text-slate-500">
            An image with no recorded licence <strong>cannot be approved</strong> — the server
            refuses it. Approval marks it reviewed and does not publish it: the file still has to be
            placed deliberately, because <code className="font-mono">public/images/cars</code> holds
            licensed files whose attribution lives in{' '}
            <code className="font-mono">src/data/carImageCredits.ts</code>.
          </p>
        </section>

        {/* ── Staging summary ──────────────────────────────────────── */}
        <section className="flex flex-wrap gap-4">
          {[
            { label: 'Staged records', value: stats.total },
            { label: 'Matched to a car', value: stats.matched },
            { label: 'Unmatched', value: stats.unmatched },
            { label: 'Price points', value: priceCount },
          ].map((tile) => (
            <div key={tile.label} className="min-w-[160px] rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2">
                <Database size={14} className="text-slate-400" aria-hidden="true" />
                <p className="text-ui-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                  {tile.label}
                </p>
              </div>
              <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">
                {tile.value}
              </p>
            </div>
          ))}
        </section>
      </div>
    </>
  )
}
