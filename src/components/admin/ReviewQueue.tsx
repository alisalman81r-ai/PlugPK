// src/components/admin/ReviewQueue.tsx
'use client'

import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Info,
  ShieldAlert,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import {
  approveFieldChange,
  approveFieldChanges,
  rejectFieldChange,
  rejectFieldChanges,
} from '@/lib/db/car-review-actions'
import { cn } from '@/lib/utils'

/**
 * The review queue.
 *
 * ── There is no "approve everything" ──────────────────────────────────
 *
 * Bulk approval acts only on rows the operator has explicitly ticked, and the
 * server refuses any it considers ineligible even if they are somehow selected.
 * "Select all" ticks the rows on the page currently in front of the operator —
 * never the whole queue, and never rows on another page — so a selection is
 * always something a person could have read.
 *
 * Which rows are eligible is not decided here. The server sends `bulkEligible`
 * per row, from the same function its actions enforce; this component only
 * renders that answer. The rule used to be written out twice, once here and once
 * on the server, and only the server's copy actually guarded a write.
 *
 * ── One page at a time ────────────────────────────────────────────────
 *
 * The queue is paged by the database. The browser holds the rows it is showing
 * and no more: a queue of two thousand proposals is a queue an operator works
 * through in passes, not one page that takes a second to render and cannot be
 * resumed.
 *
 * ── Both values are shown, always ─────────────────────────────────────
 *
 * Current and proposed side by side, with the source and the timestamp. A queue
 * that shows only the new value asks the reviewer to approve a change they
 * cannot see the shape of, which is how a wrong figure gets waved through.
 */

export interface ProposalRow {
  id: string
  carSlug: string
  carName: string
  field: string
  currentValue: string | null
  proposedValue: string | null
  rawValue: string | null
  unit: string | null
  changeType: string
  riskLevel: string
  confidence: number
  confidenceReasons: string | null
  sourceId: string
  sourceUrl: string
  fetchedAt: string
  opinions: {
    source: string
    role: string
    value: string | null
    url: string
    /** Which trim this competing claim describes. Null when the source said none. */
    variant?: string | null
  }[]
  validationFlags: { field: string; severity: string; message: string }[]

  /**
   * --- Variant evidence, Phase 4.1 --------------------------------
   *
   * The information whose absence caused the incident this queue exists to
   * prevent. On 2026-08-27 five proposals were approved from rows that showed the
   * numbers and the phrase "sources disagree", and nothing about which vehicle
   * each number described. One source had published five Seal variants; the
   * catalogue row held the 61.44 kWh car; the 87 kWh figure won.
   */
  variantVerdict: string | null
  identityTier: string | null
  /** The trim the winning value's own record described. */
  sourceVariant: string | null
  sourceModelYear: number | null
  /** The trim the catalogue row declares, if any. */
  carVariant: string | null
  variantSensitive: boolean
  currentRangeStandard: string | null
  proposedRangeStandard: string | null
  /** Decided on the server. The client never re-derives it. */
  bulkEligible: boolean
  /** Why not, when it is not. Shown to explain a disabled checkbox. */
  bulkReason: string
}

/**
 * The variant evidence for one proposal, stated on the row.
 *
 * Deliberately loud when the variant is not proven, and quiet when it is. A
 * reviewer scanning forty rows needs the unsafe ones to interrupt them; the safe
 * ones should not compete for the same attention.
 */
function VariantEvidence({ row }: { row: ProposalRow }) {
  const proven = row.variantVerdict === 'proven'

  const tone = proven
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : row.variantVerdict === 'mismatch'
      ? 'border-red-200 bg-red-50 text-red-800'
      : 'border-amber-200 bg-amber-50 text-amber-900'

  const headline = proven
    ? 'Variant confirmed'
    : row.variantVerdict === 'mismatch'
      ? 'Different vehicle'
      : row.variantVerdict === 'ambiguous'
        ? 'Several variants claim this car'
        : 'Variant not established'

  /*
    A range change also carries its test cycles. 425 km unspecified replacing
    650 km CLTC is not a smaller number, it is a different measurement — and
    that was the second wrong figure applied to the Seal.
  */
  const cycles =
    row.currentRangeStandard || row.proposedRangeStandard
      ? `${(row.currentRangeStandard ?? 'unspecified').toUpperCase()} → ${(row.proposedRangeStandard ?? 'unspecified').toUpperCase()}`
      : null

  return (
    <div className={cn('mt-2 rounded-lg border px-3 py-2 text-ui-xs leading-relaxed', tone)}>
      <p className="flex items-center gap-1.5 font-bold">
        {proven ? <Check size={13} aria-hidden="true" /> : <ShieldAlert size={13} aria-hidden="true" />}
        {headline}
      </p>
      <dl className="mt-1.5 grid gap-x-3 gap-y-0.5 sm:grid-cols-[7.5rem_1fr]">
        <dt className="font-semibold opacity-70">This car</dt>
        <dd className="font-mono">{row.carVariant ?? 'declares no variant'}</dd>

        <dt className="font-semibold opacity-70">Source says</dt>
        <dd className="font-mono">
          {row.sourceVariant ?? 'no variant'}
          {row.sourceModelYear === null ? '' : ` · ${row.sourceModelYear}`}
        </dd>

        {cycles ? (
          <>
            <dt className="font-semibold opacity-70">Test cycle</dt>
            <dd className="font-mono">{cycles}</dd>
          </>
        ) : null}
      </dl>
      {!proven ? (
        <p className="mt-1.5 opacity-90">
          {row.field} depends on the trim, so this cannot be applied until the variant is
          settled. Set this car&rsquo;s variant in the editor if you know which trim it is —
          approving is refused until then.
        </p>
      ) : null}
    </div>
  )
}

export interface PaginationState {
  /** 1-based, already clamped by the server. */
  page: number
  pageSize: number
  pageCount: number
  /** Matching the active filter, not the whole table. */
  total: number
  /** Page sizes the server will accept. */
  sizes: number[]
}

export interface ReviewQueueProps {
  rows: ProposalRow[]
  counts: { pending: number; safe: number; review: number; highRisk: number; conflicting: number }
  /** The filter currently applied, echoed back from the URL. */
  active: { risk?: string; type?: string; source?: string; car?: string; minConfidence?: string }
  sources: string[]
  pagination: PaginationState
}

const RISK_TONE: Record<string, string> = {
  safe: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  review: 'border-amber-200 bg-amber-50 text-amber-700',
  'high-risk': 'border-red-200 bg-red-50 text-red-700',
}

const TYPE_TONE: Record<string, string> = {
  new: 'text-blue-700',
  changed: 'text-amber-700',
  conflicting: 'text-red-700',
  'source-disagreement': 'text-violet-700',
  suspicious: 'text-red-700',
  'unit-mismatch': 'text-red-700',
}

export function ReviewQueue({ rows, counts, active, sources, pagination }: ReviewQueueProps) {
  const router = useRouter()
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [busy, setBusy] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)
  const [expanded, setExpanded] = React.useState<string | null>(null)

  /*
    Rows the server would accept in bulk, on this page. The server decided; this
    is only which of its answers are currently on screen.
  */
  const bulkable = rows.filter((row) => row.bulkEligible)

  const toggle = (id: string) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const run = async (action: () => Promise<{ ok: boolean; message: string }>) => {
    setBusy(true)
    setMessage(null)
    const result = await action()
    setMessage(result.message)
    setSelected(new Set())
    setBusy(false)
    router.refresh()
  }

  /**
   * Navigates, keeping every other filter.
   *
   * Changing a filter drops the page number: page 7 of the unfiltered queue is
   * almost never page 7 of the filtered one, and landing on an empty page reads
   * as "nothing matches" when plenty does. Changing the page keeps the filters,
   * which is the whole point of paging a filtered queue.
   */
  const navigate = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams()
    for (const [name, current] of Object.entries(active)) {
      if (current && !(name in changes)) params.set(name, current)
    }
    if (!('page' in changes) && pagination.page > 1) params.set('page', String(pagination.page))
    if (!('pageSize' in changes) && pagination.pageSize !== pagination.sizes[0]) {
      params.set('pageSize', String(pagination.pageSize))
    }
    for (const [name, value] of Object.entries(changes)) {
      if (value) params.set(name, value)
    }

    setSelected(new Set())
    router.push(`/admin/cars/review${params.size > 0 ? `?${params}` : ''}`)
  }

  const setFilter = (key: string, value: string | null) => navigate({ [key]: value, page: null })

  const goToPage = (page: number) => navigate({ page: page <= 1 ? null : String(page) })

  return (
    <div>
      {/* ── Filters ──────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: 'risk', value: null, label: 'All pending', count: counts.pending },
            { key: 'risk', value: 'safe', label: 'Safe', count: counts.safe },
            { key: 'risk', value: 'review', label: 'Review', count: counts.review },
            { key: 'risk', value: 'high-risk', label: 'High risk', count: counts.highRisk },
            { key: 'type', value: 'conflicting', label: 'Conflicts', count: counts.conflicting },
          ].map((chip) => {
            const isActive =
              chip.value === null
                ? !active.risk && !active.type
                : (chip.key === 'risk' ? active.risk : active.type) === chip.value

            return (
              <button
                key={`${chip.key}-${chip.value ?? 'all'}`}
                type="button"
                onClick={() => setFilter(chip.key, chip.value)}
                className={cn(
                  'inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-ui-sm font-semibold transition-colors',
                  isActive
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                )}
              >
                {chip.label}
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 font-mono text-[11px] font-bold',
                    isActive ? 'bg-white/20' : 'bg-slate-100 text-slate-500',
                  )}
                >
                  {chip.count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-ui-sm text-slate-500">
            Source
            <select
              value={active.source ?? ''}
              onChange={(event) => setFilter('source', event.target.value || null)}
              className="h-9 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 text-ui-sm text-slate-700 outline-none focus-visible:border-plug-blue-500"
            >
              <option value="">All</option>
              {sources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-ui-sm text-slate-500">
            Min confidence
            <select
              value={active.minConfidence ?? ''}
              onChange={(event) => setFilter('minConfidence', event.target.value || null)}
              className="h-9 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 text-ui-sm text-slate-700 outline-none focus-visible:border-plug-blue-500"
            >
              <option value="">Any</option>
              <option value="80">80+ (high)</option>
              <option value="55">55+ (medium)</option>
            </select>
          </label>

          {active.car ? (
            <button
              type="button"
              onClick={() => setFilter('car', null)}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-300 px-3 text-ui-sm text-slate-600 hover:bg-slate-50"
            >
              car: {active.car}
              <X size={13} />
            </button>
          ) : null}
        </div>
      </div>

      {/* ── Bulk bar ─────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
        <label className="flex items-center gap-2 text-ui-sm text-slate-700">
          <input
            type="checkbox"
            checked={selected.size > 0 && selected.size === bulkable.length}
            onChange={(event) =>
              setSelected(event.target.checked ? new Set(bulkable.map((row) => row.id)) : new Set())
            }
            className="h-4 w-4 rounded border-slate-300 accent-plug-blue-600"
          />
          Select the {bulkable.length} bulk-eligible row(s) on this page
        </label>

        <span className="text-ui-sm text-slate-500">{selected.size} selected</span>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            disabled={busy || selected.size === 0}
            onClick={() => run(() => approveFieldChanges([...selected]))}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 text-ui-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Check size={15} />
            Approve selected
          </button>
          <button
            type="button"
            disabled={busy || selected.size === 0}
            onClick={() => run(() => rejectFieldChanges([...selected]))}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 px-3.5 text-ui-sm font-semibold text-slate-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X size={15} />
            Reject selected
          </button>
        </div>

        {/* Said plainly, because its absence is a deliberate design decision
            rather than a missing feature. */}
        <p className="w-full text-ui-xs text-slate-500">
          High-risk rows, conflicts and price changes are never bulk-eligible — they have to be
          read. A selection covers only the page in front of you, and there is no
          approve-everything action.
        </p>
      </div>

      {message ? (
        <p
          role="status"
          className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-ui-sm text-slate-700"
        >
          {message}
        </p>
      ) : null}

      {/* ── Rows ─────────────────────────────────────────────────── */}
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
          <p className="font-semibold text-slate-900">
            {counts.pending > 0 ? 'Nothing matches this filter' : 'Nothing to review'}
          </p>
          <p className="mt-1 text-ui-sm text-slate-500">
            {counts.pending > 0 ? (
              <>
                {counts.pending} proposal(s) are still pending under a different filter.
              </>
            ) : (
              <>
                Run <code className="font-mono">npm run crawl:propose</code> after a crawl to fill
                this queue.
              </>
            )}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row) => {
            const eligible = row.bulkEligible
            const isOpen = expanded === row.id

            return (
              <div
                key={row.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <div className="flex flex-wrap items-start gap-4 p-4">
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    disabled={!eligible}
                    onChange={() => toggle(row.id)}
                    aria-label={`Select ${row.field} on ${row.carName}`}
                    title={eligible ? undefined : `Not eligible for bulk approval: ${row.bulkReason}`}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 accent-plug-blue-600 disabled:opacity-30"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/cars/${row.carSlug}`}
                        className="font-semibold text-slate-900 hover:text-plug-blue-600"
                      >
                        {row.carName}
                      </Link>
                      <span className="font-mono text-ui-sm text-slate-500">{row.field}</span>
                      <span
                        className={cn(
                          'rounded-full border px-2 py-0.5 text-ui-xs font-bold',
                          RISK_TONE[row.riskLevel] ?? 'border-slate-200 bg-slate-50 text-slate-600',
                        )}
                      >
                        {row.riskLevel}
                      </span>
                      <span
                        className={cn(
                          'text-ui-xs font-semibold',
                          TYPE_TONE[row.changeType] ?? 'text-slate-500',
                        )}
                      >
                        {row.changeType}
                      </span>
                    </div>

                    {/* Current and proposed, together. */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-3 text-ui-sm">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-slate-700">
                        {row.currentValue ?? '—'}
                      </span>
                      <ArrowRight size={15} className="text-slate-400" aria-hidden="true" />
                      <span className="rounded-lg bg-blue-50 px-2.5 py-1 font-mono font-semibold text-plug-blue-700">
                        {row.proposedValue ?? '—'}
                      </span>
                      {row.unit ? <span className="text-slate-400">{row.unit}</span> : null}
                      {row.rawValue && row.rawValue !== row.proposedValue ? (
                        <span className="text-ui-xs text-slate-400">
                          source wrote &ldquo;{row.rawValue}&rdquo;
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-2 text-ui-xs leading-relaxed text-slate-500">
                      {row.sourceId} ·{' '}
                      {new Date(row.fetchedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      · confidence <span className="font-semibold text-slate-700">{row.confidence}</span>
                    </p>

                    {row.validationFlags.length > 0 ? (
                      <p className="mt-2 flex items-start gap-1.5 text-ui-xs text-red-700">
                        <ShieldAlert size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                        {row.validationFlags.map((flag) => flag.message).join('; ')}
                      </p>
                    ) : null}

                    {/*
                      ── Which vehicle this figure describes ──────────────

                      On the row, always, never behind the "Why" button. This is
                      the information whose absence caused the incident: on
                      2026-08-27 five proposals were approved from rows showing the
                      numbers and the phrase "sources disagree", with nothing about
                      which trim each number belonged to. One source had published
                      five BYD Seal variants; the catalogue row was the 61.44 kWh
                      car; the 87 kWh figure won.

                      A reviewer who has to click to discover that is a reviewer
                      who will not click.
                    */}
                    {row.variantSensitive ? (
                      <VariantEvidence row={row} />
                    ) : null}
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <a
                      href={row.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="View the source page"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <ExternalLink size={15} />
                    </a>
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : row.id)}
                      className="inline-flex h-9 items-center rounded-lg border border-slate-300 px-3 text-ui-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      {isOpen ? 'Hide' : 'Why'}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(() => approveFieldChange(row.id))}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-ui-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
                    >
                      <Check size={15} />
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(() => rejectFieldChange(row.id))}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-ui-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <X size={15} />
                      Reject
                    </button>
                  </div>
                </div>

                {/* The reasoning, and every source's claim. */}
                {isOpen ? (
                  <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3">
                    <p className="flex items-start gap-2 text-ui-sm text-slate-700">
                      <Info size={14} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
                      {row.confidenceReasons ?? 'No reasoning recorded.'}
                    </p>

                    {row.opinions.length > 1 ? (
                      <div className="mt-3">
                        <p className="mb-1.5 text-ui-xs font-bold uppercase tracking-wider text-slate-400">
                          What each source said
                        </p>
                        <ul className="flex flex-col gap-1">
                          {row.opinions.map((opinion, index) => (
                            <li
                              key={`${opinion.source}-${opinion.value}-${index}`}
                              className="flex flex-wrap items-center gap-2 text-ui-sm"
                            >
                              <span className="font-mono text-slate-500">{opinion.source}</span>
                              <span className="text-ui-xs text-slate-400">({opinion.role})</span>
                              <span className="font-mono font-semibold text-slate-900">
                                {opinion.value ?? '—'}
                              </span>
                              {/*
                                The trim each competing claim describes.

                                Without it this list read as five values from
                                "openev" with no way to tell what any of them was
                                about — which is exactly what was on screen when
                                87 kWh was approved over 61.44.
                              */}
                              <span
                                className={cn(
                                  'rounded px-1.5 py-0.5 font-mono text-[11px]',
                                  opinion.variant
                                    ? 'bg-slate-200 text-slate-700'
                                    : 'bg-amber-100 text-amber-800',
                                )}
                              >
                                {opinion.variant ?? 'no variant stated'}
                              </span>
                              <a
                                href={opinion.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-ui-xs text-plug-blue-600 hover:underline"
                              >
                                source
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {!eligible ? (
                      <p className="mt-3 flex items-start gap-1.5 text-ui-xs text-amber-700">
                        <AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                        Excluded from bulk approval ({row.bulkReason}) — approve or reject it
                        individually.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Paging ───────────────────────────────────────────────── */}
      {pagination.total > 0 ? (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
          <p className="text-ui-sm text-slate-600">
            Showing{' '}
            <span className="font-semibold text-slate-900">
              {(pagination.page - 1) * pagination.pageSize + 1}
              {rows.length > 1 ? `–${(pagination.page - 1) * pagination.pageSize + rows.length}` : ''}
            </span>{' '}
            of <span className="font-semibold text-slate-900">{pagination.total}</span> matching
            this filter
          </p>

          <label className="flex items-center gap-2 text-ui-sm text-slate-500">
            Per page
            <select
              value={pagination.pageSize}
              onChange={(event) =>
                navigate({
                  pageSize: event.target.value === String(pagination.sizes[0]) ? null : event.target.value,
                  // A different page size means different page boundaries.
                  page: null,
                })
              }
              className="h-9 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 text-ui-sm text-slate-700 outline-none focus-visible:border-plug-blue-500"
            >
              {pagination.sizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-ui-sm text-slate-500">
              Page {pagination.page} of {pagination.pageCount}
            </span>
            <button
              type="button"
              disabled={busy || pagination.page <= 1}
              onClick={() => goToPage(pagination.page - 1)}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-ui-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={15} />
              Previous
            </button>
            <button
              type="button"
              disabled={busy || pagination.page >= pagination.pageCount}
              onClick={() => goToPage(pagination.page + 1)}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-ui-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Said plainly: a selection does not survive leaving the page. */}
          <p className="w-full text-ui-xs text-slate-500">
            Moving between pages clears the selection — a bulk action can only ever apply to rows
            you are looking at.
          </p>
        </div>
      ) : null}
    </div>
  )
}
