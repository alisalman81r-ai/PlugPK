// src/components/admin/CandidateList.tsx
'use client'

import { AlertTriangle, Check, ExternalLink, GitMerge, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import {
  approveCandidate,
  mergeCandidate,
  rejectCandidate,
} from '@/lib/db/car-candidate-actions'
import { cn } from '@/lib/utils'

/**
 * Cars a source described that the catalogue does not have.
 *
 * ── Three verdicts, and none of them adds a car ───────────────────────
 *
 * Approve marks a candidate as worth adding; the car is then written by hand,
 * with its slug, images, Pakistan pricing and copy. Reject says no, permanently,
 * so tomorrow's crawl does not ask again. Merge says "we already have this,
 * under another name" and records that without copying a single figure across.
 *
 * The last one matters most. Most unmatched records are not new cars — they are
 * cars we already list, spelled differently by a source that has never heard of
 * a Pakistani trim level. So the near-miss the matcher found is shown first, and
 * the reviewer is choosing between two named cars rather than guessing.
 */

export interface CandidateRow {
  id: string
  sourceId: string
  brand: string
  model: string
  variant: string | null
  modelYear: number | null
  category: string | null
  confidence: number
  possibleDuplicateOf: string | null
  duplicateReason: string | null
  matchScore: number | null
  sourceUrl: string
  fetchedAt: string
  /** A short line of specification, so the reviewer can tell two trims apart. */
  specSummary: string
}

export function CandidateList({ rows }: { rows: CandidateRow[] }) {
  const router = useRouter()
  const [busy, setBusy] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState<{ ok: boolean; text: string } | null>(null)
  const [mergeInto, setMergeInto] = React.useState<Record<string, string>>({})

  async function act(id: string, run: () => Promise<{ ok: boolean; message: string }>) {
    setBusy(id)
    const result = await run()
    setMessage({ ok: result.ok, text: result.message })
    setBusy(null)
    if (result.ok) router.refresh()
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center text-ui-sm text-slate-500">
        No candidates pending. A crawl raises one when a source describes a car nothing in the
        catalogue matches — and never adds the car itself.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {message ? (
        <p
          role="status"
          className={cn(
            'rounded-xl border px-4 py-3 text-ui-sm',
            message.ok
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800',
          )}
        >
          {message.text}
        </p>
      ) : null}

      {rows.map((row) => (
        <article key={row.id} className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="font-display text-lg font-bold text-slate-900">
                {row.brand} {row.model}
                {row.variant ? <span className="text-slate-500"> · {row.variant}</span> : null}
              </h3>
              <p className="mt-1 text-ui-sm text-slate-600">{row.specSummary}</p>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-ui-xs text-slate-400">
                <span className="font-mono">{row.sourceId}</span>
                {row.modelYear ? <span>{row.modelYear}</span> : null}
                {row.category ? <span>{row.category}</span> : null}
                <span>seen {row.fetchedAt}</span>
                <a
                  href={row.sourceUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 text-plug-blue-600 hover:underline"
                >
                  source
                  <ExternalLink size={11} aria-hidden="true" />
                </a>
              </p>
            </div>

            <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-ui-xs font-bold text-slate-600">
              {row.confidence}/100
            </span>
          </div>

          {row.possibleDuplicateOf ? (
            <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-ui-sm text-amber-900">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                Possibly <strong>{row.possibleDuplicateOf}</strong>
                {row.matchScore !== null ? ` (${row.matchScore}/100)` : ''}
                {row.duplicateReason ? ` — ${row.duplicateReason}` : ''}
              </span>
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy === row.id}
              onClick={() => void act(row.id, () => approveCandidate(row.id))}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 text-ui-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              <Check size={14} aria-hidden="true" />
              Worth adding
            </button>

            <button
              type="button"
              disabled={busy === row.id}
              onClick={() => void act(row.id, () => rejectCandidate(row.id))}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 px-3.5 text-ui-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              <X size={14} aria-hidden="true" />
              Not for us
            </button>

            <span className="mx-1 h-6 w-px bg-slate-200" aria-hidden="true" />

            <label className="sr-only" htmlFor={`merge-${row.id}`}>
              Slug of the car this is the same as
            </label>
            <input
              id={`merge-${row.id}`}
              value={mergeInto[row.id] ?? row.possibleDuplicateOf ?? ''}
              onChange={(event) =>
                setMergeInto((current) => ({ ...current, [row.id]: event.target.value }))
              }
              placeholder="car slug"
              className="h-9 w-44 rounded-lg border border-slate-300 px-3 font-mono text-ui-sm text-slate-800 placeholder:text-slate-400 focus:border-plug-blue-500 focus:outline-none"
            />
            <button
              type="button"
              disabled={busy === row.id}
              onClick={() =>
                void act(row.id, () =>
                  mergeCandidate(row.id, mergeInto[row.id] ?? row.possibleDuplicateOf ?? ''),
                )
              }
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 px-3.5 text-ui-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              <GitMerge size={14} aria-hidden="true" />
              Same car
            </button>
          </div>
        </article>
      ))}

      <p className="text-ui-xs leading-relaxed text-slate-500">
        <strong>Worth adding</strong> records a decision and nothing more — no car is created, no
        page changes. Write the car from Cars → Add car, where its slug, images and Pakistan pricing
        are yours to set. <strong>Same car</strong> copies no specifications either: the reason this
        row exists is that the identity was uncertain, and its figures come through the review queue
        one field at a time.
      </p>
    </div>
  )
}
