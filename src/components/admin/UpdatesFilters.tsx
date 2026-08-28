'use client'

import { RotateCcw } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * The filter bar on the updates dashboard.
 *
 * ── Why the filters live in the URL ───────────────────────────────────
 *
 * Every control writes a query parameter and the server re-queries. Not local
 * state, for three reasons that matter more on this page than on most:
 *
 *   a filtered view is shareable — "look at what evdb did on Tuesday" is a URL,
 *   not a sequence of clicks to describe;
 *
 *   the back button works, so narrowing a search is not a one-way trip;
 *
 *   and the filter reaches the *query*, not the rendered rows. Filtering after a
 *   row limit is applied means asking for one source can show none while it has
 *   plenty — a bug this project has already fixed once, on the review queue, and
 *   the reason listRuns takes its filter as an argument rather than the page
 *   slicing an array.
 *
 * The same pattern and the same reasoning as ReviewQueue's filters.
 */

export interface ActiveFilters {
  source?: string | undefined
  status?: string | undefined
  date?: string | undefined
  car?: string | undefined
  minConfidence?: string | undefined
  changeType?: string | undefined
}

interface UpdatesFiltersProps {
  active: ActiveFilters
  /** Source ids, so a filter cannot name a source that does not exist. */
  sources: { id: string; name: string }[]
  /** How many runs match right now, so an empty result is explained. */
  matching: number
}

/** Run statuses, matching the values CrawlRun actually stores. */
const STATUSES: { value: string; label: string }[] = [
  { value: 'completed', label: 'Completed' },
  { value: 'partial', label: 'Partial' },
  { value: 'failed', label: 'Failed' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'running', label: 'Running' },
]

/** Change types, matching CarFieldChange.changeType. */
const CHANGE_TYPES: { value: string; label: string }[] = [
  { value: 'new', label: 'Fills a gap' },
  { value: 'changed', label: 'Changed' },
  { value: 'conflicting', label: 'Conflicting' },
  { value: 'source-disagreement', label: 'Sources disagree' },
  { value: 'suspicious', label: 'Suspicious' },
  { value: 'unit-mismatch', label: 'Unit mismatch' },
]

const DATE_PRESETS: { value: string; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
]

export function UpdatesFilters({ active, sources, matching }: UpdatesFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const setFilter = React.useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === null || value === '') params.delete(key)
      else params.set(key, value)

      const query = params.toString()
      /*
        scroll: false, deliberately.

        Changing a filter halfway down a long dashboard and being thrown back to
        the top is the single most irritating thing this control could do, and the
        rows that changed are the ones the operator was already looking at.
      */
      router.push(query ? `/admin/cars/updates?${query}` : '/admin/cars/updates', {
        scroll: false,
      })
    },
    [router, searchParams],
  )

  const [carDraft, setCarDraft] = React.useState(active.car ?? '')

  /*
    The car box is the one control that is not applied on change.

    Every keystroke would be a server round trip and a re-query, and the useful
    input is a whole slug. So it is applied on submit or on blur — and kept in
    sync when the URL changes underneath it, which happens when the Clear button
    or the back button removes the parameter.
  */
  React.useEffect(() => {
    setCarDraft(active.car ?? '')
  }, [active.car])

  const activeCount = Object.values(active).filter(Boolean).length

  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
      <div className="flex flex-wrap items-end gap-x-5 gap-y-4">
        <Field label="Source">
          <Select
            value={active.source ?? ''}
            onChange={(value) => setFilter('source', value)}
            options={[
              { value: '', label: 'All sources' },
              ...sources.map((source) => ({ value: source.id, label: source.name })),
            ]}
          />
        </Field>

        <Field label="Run status">
          <Select
            value={active.status ?? ''}
            onChange={(value) => setFilter('status', value)}
            options={[{ value: '', label: 'Any status' }, ...STATUSES]}
          />
        </Field>

        <Field label="Date">
          <Select
            value={active.date ?? ''}
            onChange={(value) => setFilter('date', value)}
            options={[{ value: '', label: 'All time' }, ...DATE_PRESETS]}
          />
        </Field>

        <Field label="Change type">
          <Select
            value={active.changeType ?? ''}
            onChange={(value) => setFilter('changeType', value)}
            options={[{ value: '', label: 'Any type' }, ...CHANGE_TYPES]}
          />
        </Field>

        <Field label="Confidence">
          <Select
            value={active.minConfidence ?? ''}
            onChange={(value) => setFilter('minConfidence', value)}
            options={[
              { value: '', label: 'Any' },
              { value: '80', label: '80+ (high)' },
              { value: '55', label: '55+ (medium)' },
            ]}
          />
        </Field>

        <Field label="Car">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              setFilter('car', carDraft.trim() || null)
            }}
          >
            <input
              type="text"
              value={carDraft}
              onChange={(event) => setCarDraft(event.target.value)}
              onBlur={() => {
                if ((carDraft.trim() || null) !== (active.car ?? null)) {
                  setFilter('car', carDraft.trim() || null)
                }
              }}
              placeholder="slug, e.g. byd-seal"
              className="h-9 w-44 rounded-lg border border-slate-300 bg-white px-3 text-ui-sm text-slate-700 outline-none placeholder:text-slate-400 focus-visible:border-plug-blue-500"
            />
          </form>
        </Field>

        {activeCount > 0 ? (
          <button
            type="button"
            onClick={() => router.push('/admin/cars/updates', { scroll: false })}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-ui-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
          >
            <RotateCcw size={13} aria-hidden="true" />
            Clear {activeCount}
          </button>
        ) : null}
      </div>

      {/*
        The match count is stated whether or not it is zero.

        An empty table under an active filter looks identical to an empty table
        because nothing has run, and those are completely different problems. This
        line is the difference.
      */}
      <p
        className={cn(
          'mt-3 text-ui-xs leading-relaxed',
          matching === 0 && activeCount > 0 ? 'font-semibold text-amber-700' : 'text-slate-500',
        )}
      >
        {activeCount === 0
          ? `${matching} run(s) recorded in total.`
          : matching === 0
            ? 'No runs match these filters. The rows below are empty because of the filter, not because nothing ran.'
            : `${matching} run(s) match these filters.`}
      </p>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-ui-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
        {label}
      </span>
      {children}
    </label>
  )
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 text-ui-sm text-slate-700 outline-none focus-visible:border-plug-blue-500"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
