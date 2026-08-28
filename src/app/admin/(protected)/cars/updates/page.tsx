// src/app/admin/(protected)/cars/updates/page.tsx
import {
  AlertTriangle,
  Clock,
  Database,
  PauseCircle,
  RefreshCw,
  Sunrise,
  Terminal,
} from 'lucide-react'
import Link from 'next/link'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { CandidateList, type CandidateRow } from '@/components/admin/CandidateList'
import { ScheduleControl } from '@/components/admin/ScheduleControl'
import { UpdatesFilters, type ActiveFilters } from '@/components/admin/UpdatesFilters'
import { grade } from '@crawler/health'
import { CADENCES, isDue, toCadence } from '@crawler/schedule'
import {
  countRuns,
  filterCandidates,
  filterLog,
  filterRuns,
  getTodayStats,
  getUpdateStats,
  listSourcesForSchedule,
  unfinishedRuns,
} from '@/lib/db/car-source-queries'
import { cn } from '@/lib/utils'

/**
 * The automated-updates dashboard.
 *
 * One page that answers the questions an operator actually has each morning: did
 * anything run, did anything break, is anything quietly out of date, and is there
 * anything waiting on me.
 *
 * ── Why staleness gets its own column ─────────────────────────────────
 *
 * The failure this catches is silence. A source that stopped working three weeks
 * ago produces no errors at all — it produces nothing, and nothing looks exactly
 * like a quiet day. So every source shows when it last *succeeded*, not when it
 * was last attempted, and anything past its own staleness window is named.
 *
 * ── Why the filters are in the URL ────────────────────────────────────
 *
 * Every filter is a query parameter read here and pushed into the database query,
 * never applied to rows after they arrive. Filtering a limited result set means
 * asking for one source's runs can return none while it has plenty — the bug this
 * project already fixed once on the review queue. It also makes a narrowed view a
 * link somebody can send.
 */

export const metadata = { title: { absolute: 'Updates · Plug.pk admin' } }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: {
    source?: string
    status?: string
    date?: string
    car?: string
    minConfidence?: string
    changeType?: string
  }
}

const GRADE_TONE: Record<string, string> = {
  healthy: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  degraded: 'border-amber-200 bg-amber-50 text-amber-700',
  failing: 'border-red-200 bg-red-50 text-red-700',
  stale: 'border-orange-200 bg-orange-50 text-orange-700',
  blocked: 'border-slate-200 bg-slate-100 text-slate-600',
  'never-run': 'border-slate-200 bg-slate-50 text-slate-500',
}

const RUN_TONE: Record<string, string> = {
  completed: 'text-emerald-700',
  partial: 'text-amber-700',
  failed: 'text-red-700',
  blocked: 'text-slate-500',
  running: 'text-blue-700',
}

/** Only the values the store accepts, so a hand-typed URL cannot widen a query. */
const STATUSES = new Set(['completed', 'partial', 'failed', 'blocked', 'running'])
const CHANGE_TYPES = new Set([
  'new',
  'changed',
  'conflicting',
  'source-disagreement',
  'suspicious',
  'unit-mismatch',
  'missing',
])

const dateTime = (value: Date) =>
  value.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

/**
 * Turns a date preset into a range.
 *
 * Presets rather than a date picker, because the questions actually asked of this
 * page are "today", "this week" and "this month" — and a picker would be three
 * more controls and a timezone decision for a case nobody has yet needed.
 */
function dateRange(preset: string | undefined, now: Date): { from?: Date; to?: Date } {
  if (!preset) return {}

  const midnight = new Date(now)
  midnight.setHours(0, 0, 0, 0)

  if (preset === 'today') return { from: midnight }
  if (preset === '7d') return { from: new Date(midnight.getTime() - 6 * 86_400_000) }
  if (preset === '30d') return { from: new Date(midnight.getTime() - 29 * 86_400_000) }
  return {}
}

/** A candidate's figures, condensed enough to tell two trims apart. */
function specSummary(normalised: string): string {
  try {
    const vehicle = JSON.parse(normalised) as Record<string, unknown>
    const parts: string[] = []
    const add = (value: unknown, unit: string) => {
      if (typeof value === 'number' && Number.isFinite(value)) parts.push(`${value} ${unit}`)
    }
    add(vehicle.batteryCapacityKwh, 'kWh')
    add(vehicle.rangeKm, 'km')
    add(vehicle.totalPowerKw, 'kW')
    add(vehicle.dcChargingKw, 'kW DC')
    return parts.length > 0 ? parts.join(' · ') : 'no specification published'
  } catch {
    return 'unreadable payload'
  }
}

export default async function AdminCarUpdatesPage({ searchParams }: PageProps) {
  const now = new Date()

  const status = searchParams.status && STATUSES.has(searchParams.status) ? searchParams.status : undefined
  const changeType =
    searchParams.changeType && CHANGE_TYPES.has(searchParams.changeType)
      ? searchParams.changeType
      : undefined
  const minConfidence = Number(searchParams.minConfidence)
  const range = dateRange(searchParams.date, now)

  const runFilter = {
    ...(searchParams.source ? { sourceId: searchParams.source } : {}),
    ...(status ? { status } : {}),
    ...(range.from ? { from: range.from } : {}),
    ...(range.to ? { to: range.to } : {}),
  }

  const [sources, stats, today, runs, runTotal, candidates, logLines, stuck] = await Promise.all([
    listSourcesForSchedule(),
    getUpdateStats(),
    getTodayStats(now),
    filterRuns({ ...runFilter, limit: 20 }),
    countRuns(runFilter),
    filterCandidates({
      status: 'pending',
      ...(searchParams.source ? { sourceId: searchParams.source } : {}),
      ...(Number.isFinite(minConfidence) ? { minConfidence } : {}),
      limit: 30,
    }),
    filterLog({
      ...(searchParams.source ? { sourceId: searchParams.source } : {}),
      status: 'failed',
      sinceHours: 72,
      limit: 20,
    }),
    unfinishedRuns(120),
  ])

  const graded = sources.map((source) => ({
    source,
    health: grade({ ...source, now }),
    due: isDue({ ...source, now }),
  }))

  const attention = graded.filter((entry) => entry.health.grade !== 'healthy')

  const active: ActiveFilters = {
    ...(searchParams.source ? { source: searchParams.source } : {}),
    ...(status ? { status } : {}),
    ...(searchParams.date ? { date: searchParams.date } : {}),
    ...(searchParams.car ? { car: searchParams.car } : {}),
    ...(searchParams.minConfidence ? { minConfidence: searchParams.minConfidence } : {}),
    ...(changeType ? { changeType } : {}),
  }

  const candidateRows: CandidateRow[] = candidates.map((candidate) => ({
    id: candidate.id,
    sourceId: candidate.sourceId,
    brand: candidate.brand,
    model: candidate.model,
    variant: candidate.variant,
    modelYear: candidate.modelYear,
    category: candidate.category,
    confidence: candidate.confidence,
    possibleDuplicateOf: candidate.possibleDuplicateOf,
    duplicateReason: candidate.duplicateReason,
    matchScore: candidate.matchScore,
    sourceUrl: candidate.sourceUrl,
    fetchedAt: candidate.fetchedAt.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    specSummary: specSummary(candidate.normalised),
  }))

  /*
    The review-queue link carries the filters that mean something there.

    An operator who has narrowed this page to one source and high confidence
    should not have to re-apply that on the next screen — and the review queue
    already accepts exactly these parameters.
  */
  const reviewQuery = new URLSearchParams()
  if (searchParams.source) reviewQuery.set('source', searchParams.source)
  if (searchParams.car) reviewQuery.set('car', searchParams.car)
  if (changeType) reviewQuery.set('type', changeType)
  if (Number.isFinite(minConfidence)) reviewQuery.set('minConfidence', String(minConfidence))
  const reviewHref = `/admin/cars/review${reviewQuery.size > 0 ? `?${reviewQuery.toString()}` : ''}`

  return (
    <>
      <AdminHeader
        title="Updates"
        description={`${stats.runsToday} run(s) today · ${stats.pendingProposals} proposal(s) and ${stats.pendingCandidates} candidate(s) waiting`}
        action={
          <Link
            href={reviewHref}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-plug-blue-600 px-4 text-ui font-semibold text-white transition-colors hover:bg-plug-blue-700"
          >
            Review queue
          </Link>
        }
      />

      <div className="flex flex-col gap-8 px-8 py-8">
        {/* ── Not yet running ──────────────────────────────────────── */}
        <section className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <PauseCircle size={18} className="mt-0.5 shrink-0 text-amber-700" aria-hidden="true" />
          <div className="text-ui-sm leading-relaxed text-amber-900">
            <p className="font-semibold">Automated crawling is built but not switched on.</p>
            <p className="mt-1">
              Nothing runs on a timer yet. Every figure below came from a command somebody typed,
              and the cadences in the table are what <em>would</em> happen once a schedule is
              created. The scheduler itself is written and tested — a Task Scheduler entry under{' '}
              <code className="font-mono">deploy/windows/</code>, a systemd timer under{' '}
              <code className="font-mono">deploy/linux/</code>, and an authenticated trigger at{' '}
              <code className="font-mono">/api/crawler/daily</code> for hosts with no shell. Each
              one takes a deliberate command to activate.
            </p>
            <p className="mt-1">
              Read <code className="font-mono">docs/CRAWLER.md</code> for the choice between them,
              and <code className="font-mono">docs/PHASE4-PRODUCTION-CHECK.md</code> for what to
              verify first.
            </p>
          </div>
        </section>

        {/* ── Today's crawl ────────────────────────────────────────── */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-ui-sm font-bold uppercase tracking-[0.1em] text-slate-500">
            <Sunrise size={14} aria-hidden="true" />
            Today&rsquo;s crawl
          </h2>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            <Stat label="Sources checked" value={today.sourcesChecked} />
            <Stat label="Successful" value={today.sourcesSuccessful} tone={today.sourcesSuccessful > 0 ? 'good' : 'plain'} />
            <Stat label="Failed" value={today.sourcesFailed} tone={today.sourcesFailed > 0 ? 'bad' : 'plain'} />
            <Stat label="Cars scanned" value={today.carsScanned} />
            <Stat label="New cars found" value={today.newCarsDiscovered} tone={today.newCarsDiscovered > 0 ? 'warn' : 'plain'} />
            <Stat label="Changed" value={today.changedFields} />
            <Stat label="Unchanged" value={today.unchangedRecords} />
            <Stat label="Conflicts" value={today.conflicts} tone={today.conflicts > 0 ? 'warn' : 'plain'} />
            <Stat label="High confidence" value={today.highConfidenceProposals} />
            <Stat label="Review required" value={today.reviewRequired} tone={today.reviewRequired > 0 ? 'warn' : 'plain'} />
            <Stat label="Stale sources" value={today.staleSources} tone={today.staleSources > 0 ? 'bad' : 'plain'} />
            <Stat label="Cars in catalogue" value={stats.cars} />
          </div>

          <p className="mt-3 text-ui-xs leading-relaxed text-slate-500">
            <strong>Sources checked</strong> counts distinct sources, not runs — a source re-run by
            hand three times was still checked once. <strong>Review required</strong> and{' '}
            <strong>high confidence</strong> are the whole pending queue rather than today&rsquo;s
            share of it, because what is waiting on a person does not expire overnight. A high
            confidence score orders the queue and grants nothing: there is no threshold in this
            system above which a change is applied without somebody approving it.
          </p>
        </section>

        {/* ── Filters ──────────────────────────────────────────────── */}
        <UpdatesFilters
          active={active}
          sources={sources.map((source) => ({ id: source.id, name: source.name }))}
          matching={runTotal}
        />

        {/* ── Needs attention ──────────────────────────────────────── */}
        {attention.length > 0 ? (
          <section className="rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4">
            <h2 className="flex items-center gap-2 text-ui-sm font-bold uppercase tracking-[0.1em] text-orange-800">
              <AlertTriangle size={14} aria-hidden="true" />
              Needs attention
            </h2>
            <ul className="mt-3 flex flex-col gap-2">
              {attention.map(({ source, health }) => (
                <li key={source.id} className="text-ui-sm text-orange-900">
                  <span className="font-semibold">{source.name}</span> — {health.grade}:{' '}
                  {health.summary}
                  {health.detail ? <span className="text-orange-800"> ({health.detail})</span> : null}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-ui-xs leading-relaxed text-orange-900">
              A stale source keeps every figure it has already contributed. Nothing is removed
              because a crawl stopped working — an outage must never empty the catalogue.
            </p>
          </section>
        ) : null}

        {stuck.length > 0 ? (
          <section className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-ui-sm text-red-900">
            <p className="font-semibold">
              {stuck.length} run(s) have been marked running for over two hours.
            </p>
            <p className="mt-1">
              That means a process stopped without closing its run — the crawl was killed, or the
              machine slept. Nothing is at risk: an open run holds no lock and writes nothing to the
              catalogue. The rows stay so the interruption is visible rather than tidied away.
            </p>
          </section>
        ) : null}

        {/* ── Schedule ─────────────────────────────────────────────── */}
        <section>
          <h2 className="mb-3 text-ui-sm font-bold uppercase tracking-[0.1em] text-slate-500">
            Schedule and health
          </h2>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[980px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-ui-xs uppercase tracking-wider text-slate-400">
                  <th scope="col" className="px-5 py-3 font-semibold">Source</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Cadence</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Health</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Last success</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Last change</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Response</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Conditional</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Next</th>
                </tr>
              </thead>
              <tbody>
                {graded.map(({ source, health, due }) => (
                  <tr key={source.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{source.name}</p>
                      <p className="mt-0.5 font-mono text-ui-xs text-slate-400">{source.id}</p>
                      {!source.isEnabled ? (
                        <p className="mt-1 text-ui-xs font-semibold text-slate-500">switched off</p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4">
                      <ScheduleControl sourceId={source.id} schedule={toCadence(source.schedule)} />
                      {health.backoff > 1 ? (
                        <p className="mt-1 text-ui-xs text-amber-700">
                          stretched {health.backoff}× by failures
                        </p>
                      ) : null}
                      {source.recordBudget > 0 ? (
                        <p className="mt-1 text-ui-xs text-slate-500">
                          {source.recordBudget} records/run
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-2.5 py-0.5 text-ui-xs font-bold',
                          GRADE_TONE[health.grade] ?? GRADE_TONE['never-run'],
                        )}
                      >
                        {health.grade}
                      </span>
                      <p className="mt-1 max-w-[220px] text-ui-xs leading-relaxed text-slate-500">
                        {health.summary}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-ui-sm text-slate-600">
                      {source.lastSuccessAt ? dateTime(source.lastSuccessAt) : '—'}
                    </td>
                    <td className="px-5 py-4 text-ui-sm text-slate-600">
                      {source.lastChangedAt ? dateTime(source.lastChangedAt) : '—'}
                    </td>
                    <td className="px-5 py-4 font-mono text-ui-sm text-slate-600">
                      {source.avgResponseMs === null ? '—' : `${source.avgResponseMs}ms`}
                    </td>
                    {/*
                      Whether the next request can be conditional. A source holding a
                      validator will be asked "has this changed?" instead of being sent
                      the whole dataset — which on a quiet day is one 304 and no work.
                    */}
                    <td className="px-5 py-4 text-ui-xs text-slate-500">
                      {source.lastEtag || source.lastModifiedHttp ? (
                        <span className="font-semibold text-emerald-700">yes</span>
                      ) : (
                        'full fetch'
                      )}
                    </td>
                    <td className="px-5 py-4 text-ui-sm">
                      <span className={due.due ? 'font-semibold text-emerald-700' : 'text-slate-500'}>
                        {due.due ? 'due now' : due.nextDueAt ? dateTime(due.nextDueAt) : '—'}
                      </span>
                      <p className="mt-0.5 max-w-[200px] text-ui-xs leading-relaxed text-slate-400">
                        {due.reason}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-ui-xs leading-relaxed text-slate-500">
            Cadence tops out at daily, and a source is only ever visited while it is enabled{' '}
            <em>and</em> its robots.txt reads allowed. After a failure the interval doubles, capped
            at eight times — a source that is down does not become available faster for being asked
            more often. One success resets it. Windows are per source: a{' '}
            {CADENCES.weekly.label.toLowerCase()} source is not stale after two days. A validator is
            dropped after any failure or any run that left work undone, so the next run fetches in
            full rather than being told nothing changed.
          </p>
        </section>

        {/* ── Runs ─────────────────────────────────────────────────── */}
        <section>
          <h2 className="mb-3 text-ui-sm font-bold uppercase tracking-[0.1em] text-slate-500">
            Runs {runTotal > runs.length ? `(showing ${runs.length} of ${runTotal})` : ''}
          </h2>

          {runs.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center text-ui-sm text-slate-500">
              No runs match.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-ui-xs uppercase tracking-wider text-slate-400">
                    <th scope="col" className="px-5 py-3 font-semibold">Started</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Source</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Trigger</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Found</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Changed</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Unchanged</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Failed</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Proposals</th>
                    <th scope="col" className="px-5 py-3 font-semibold">New cars</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Took</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-5 py-3 text-ui-sm text-slate-600">{dateTime(run.startedAt)}</td>
                      <td className="px-5 py-3 font-mono text-ui-sm text-slate-700">{run.sourceId}</td>
                      <td className="px-5 py-3 text-ui-sm text-slate-500">{run.trigger}</td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            'text-ui-sm font-semibold',
                            RUN_TONE[run.status] ?? 'text-slate-500',
                          )}
                        >
                          {run.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-ui-sm text-slate-600">{run.recordsFound}</td>
                      <td className="px-5 py-3 font-mono text-ui-sm text-slate-600">{run.recordsChanged}</td>
                      <td className="px-5 py-3 font-mono text-ui-sm text-slate-600">{run.recordsUnchanged}</td>
                      <td
                        className={cn(
                          'px-5 py-3 font-mono text-ui-sm',
                          run.recordsFailed > 0 ? 'font-bold text-red-700' : 'text-slate-600',
                        )}
                      >
                        {run.recordsFailed}
                      </td>
                      <td className="px-5 py-3 font-mono text-ui-sm text-slate-600">{run.recordsPendingReview}</td>
                      <td className="px-5 py-3 font-mono text-ui-sm text-slate-600">{run.candidatesFound}</td>
                      <td className="px-5 py-3 font-mono text-ui-sm text-slate-500">
                        {run.durationMs === null ? '—' : `${(run.durationMs / 1000).toFixed(1)}s`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-3 flex items-start gap-1.5 text-ui-xs leading-relaxed text-slate-500">
            <Clock size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              <strong>unchanged</strong> is the number of records byte-identical to the last crawl.
              On a daily schedule that is most of them, and each one is skipped without being
              re-compared, re-proposed, or having its image fetched again. A run that found 0 and
              completed was answered <strong>304 Not Modified</strong> — the source itself said
              nothing had changed, which is cheaper still. <strong>blocked</strong> means we
              declined to fetch, and <strong>partial</strong> means some records failed while the
              source was plainly up — neither counts as a failure against the source&rsquo;s health.
            </span>
          </p>
        </section>

        {/* ── Candidates ───────────────────────────────────────────── */}
        <section>
          <h2 className="mb-3 text-ui-sm font-bold uppercase tracking-[0.1em] text-slate-500">
            Possible new cars
          </h2>
          <CandidateList rows={candidateRows} />
        </section>

        {/* ── Failures ─────────────────────────────────────────────── */}
        <section>
          <h2 className="mb-3 text-ui-sm font-bold uppercase tracking-[0.1em] text-slate-500">
            Failures in the last three days
          </h2>

          {logLines.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center text-ui-sm text-slate-500">
              None recorded.
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <ul className="divide-y divide-slate-50">
                {logLines.map((entry) => (
                  <li key={entry.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-5 py-3">
                    <span className="font-mono text-ui-xs text-slate-400">
                      {dateTime(entry.createdAt)}
                    </span>
                    <span className="font-mono text-ui-sm text-slate-700">{entry.sourceId}</span>
                    <span className="text-ui-xs font-semibold uppercase tracking-wider text-slate-400">
                      {entry.operation}/{entry.status}
                    </span>
                    <span className="min-w-0 flex-1 text-ui-sm text-slate-600">{entry.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-3 text-ui-xs leading-relaxed text-slate-500">
            Log lines are redacted before they are written: anything shaped like a key, token,
            password or credential in a URL is replaced at the single point where logging happens,
            rather than left to each caller to remember.
          </p>
        </section>

        {/* ── Running it ───────────────────────────────────────────── */}
        <section className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
          <h2 className="flex items-center gap-2 text-ui-sm font-bold uppercase tracking-[0.1em] text-slate-500">
            <Terminal size={14} aria-hidden="true" />
            Running it by hand
          </h2>
          <dl className="mt-3 grid gap-2 text-ui-sm sm:grid-cols-[auto_1fr] sm:gap-x-5">
            <dt className="font-mono text-slate-800">npm run crawl:status</dt>
            <dd className="text-slate-600">
              Reports what would run and what is stale. Contacts nothing.
            </dd>
            <dt className="font-mono text-slate-800">npm run crawl:dry</dt>
            <dd className="text-slate-600">A full pass that writes nothing.</dd>
            <dt className="font-mono text-slate-800">npm run crawl:daily</dt>
            <dd className="text-slate-600">
              Every source that is due. Proposals only — the catalogue is untouched.
            </dd>
            <dt className="font-mono text-slate-800">npm run crawl:all</dt>
            <dd className="text-slate-600">Every enabled source, ignoring cadence.</dd>
            <dt className="font-mono text-slate-800">npm run crawl:car -- byd-seal</dt>
            <dd className="text-slate-600">One car, by slug or name.</dd>
            <dt className="font-mono text-slate-800">npm run crawl:daily -- --source openev</dt>
            <dd className="text-slate-600">
              One source now, ignoring its cadence but never its access check.
            </dd>
            <dt className="font-mono text-slate-800">npm run crawl:daily -- --budget 200</dt>
            <dd className="text-slate-600">
              Stop after 200 records per source. The rest are deferred to the next run, taken
              highest-priority first — never silently dropped.
            </dd>
            <dt className="font-mono text-slate-800">npm run crawl:verify-all</dt>
            <dd className="text-slate-600">All five verification suites.</dd>
          </dl>
          <p className="mt-3 flex items-start gap-1.5 text-ui-xs leading-relaxed text-slate-500">
            <RefreshCw size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              Every one of these is safe to run twice. A record whose payload has not changed is
              skipped, and a run that fails leaves the catalogue exactly as it was.
            </span>
          </p>
        </section>
      </div>
    </>
  )
}

function Stat({
  label,
  value,
  tone = 'plain',
}: {
  label: string
  value: number
  tone?: 'plain' | 'good' | 'warn' | 'bad'
}) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-white p-4',
        tone === 'bad'
          ? 'border-red-200'
          : tone === 'warn'
            ? 'border-amber-200'
            : tone === 'good'
              ? 'border-emerald-200'
              : 'border-slate-200',
      )}
    >
      {/*
        The label reserves two lines whether or not it needs them.

        Without it, a tile whose label wraps is taller in its label block than its
        neighbours, so its figure starts lower and the row of numbers stops lining
        up. "Cars in catalogue" fitted on one line in Inter and wraps in Poppins —
        the kind of thing a wider face changes quietly. Reserving the space fixes
        it for any label length rather than for this one string.
      */}
      <div className="flex min-h-[2rem] items-start gap-2">
        <Database size={13} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
        <p className="text-ui-xs font-semibold uppercase tracking-[0.1em] text-slate-400">{label}</p>
      </div>
      <p
        className={cn(
          'mt-1 font-mono text-2xl font-bold tabular-nums',
          tone === 'bad'
            ? 'text-red-700'
            : tone === 'warn'
              ? 'text-amber-700'
              : tone === 'good'
                ? 'text-emerald-700'
                : 'text-slate-900',
        )}
      >
        {value}
      </p>
    </div>
  )
}
