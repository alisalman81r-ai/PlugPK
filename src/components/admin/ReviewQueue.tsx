// src/components/admin/ReviewQueue.tsx
'use client'

import { AlertTriangle, ArrowRight, Check, ExternalLink, Info, ShieldAlert, X } from 'lucide-react'
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
 * server refuses any that are high-risk or conflicting even if they are somehow
 * selected. "Select all" ticks the rows currently visible under the active
 * filter — never the whole queue — so a selection is always something a person
 * could have read.
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
  opinions: { source: string; role: string; value: string | null; url: string }[]
  validationFlags: { field: string; severity: string; message: string }[]
}

export interface ReviewQueueProps {
  rows: ProposalRow[]
  counts: { pending: number; safe: number; review: number; highRisk: number; conflicting: number }
  /** The filter currently applied, echoed back from the URL. */
  active: { risk?: string; type?: string; source?: string; car?: string; minConfidence?: string }
  sources: string[]
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

export function ReviewQueue({ rows, counts, active, sources }: ReviewQueueProps) {
  const router = useRouter()
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [busy, setBusy] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)
  const [expanded, setExpanded] = React.useState<string | null>(null)

  /*
    Rows the server would actually accept in bulk. Anything high-risk or
    conflicting is excluded here as well as on the server — checking twice is
    cheap, and it stops the UI offering an action that will be refused.
  */
  const bulkable = rows.filter(
    (row) => row.riskLevel !== 'high-risk' && row.changeType !== 'conflicting',
  )

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

  const setFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams()
    for (const [name, current] of Object.entries(active)) {
      if (current && name !== key) params.set(name, current)
    }
    if (value) params.set(key, value)
    router.push(`/admin/cars/review${params.size > 0 ? `?${params}` : ''}`)
  }

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
          Select the {bulkable.length} bulk-eligible row(s) shown
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
          High-risk and conflicting rows are never bulk-eligible — they have to be read. There is
          no approve-everything action.
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
          <p className="font-semibold text-slate-900">Nothing to review</p>
          <p className="mt-1 text-ui-sm text-slate-500">
            Run <code className="font-mono">npm run crawl:propose</code> after a crawl to fill this
            queue.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row) => {
            const eligible = row.riskLevel !== 'high-risk' && row.changeType !== 'conflicting'
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
                    title={eligible ? undefined : 'Not eligible for bulk approval'}
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
                          {row.opinions.map((opinion) => (
                            <li
                              key={`${opinion.source}-${opinion.value}`}
                              className="flex flex-wrap items-center gap-2 text-ui-sm"
                            >
                              <span className="font-mono text-slate-500">{opinion.source}</span>
                              <span className="text-ui-xs text-slate-400">({opinion.role})</span>
                              <span className="font-mono font-semibold text-slate-900">
                                {opinion.value ?? '—'}
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
                        Excluded from bulk approval — approve or reject it individually.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
