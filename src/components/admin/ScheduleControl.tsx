// src/components/admin/ScheduleControl.tsx
'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'

import { updateSourceSchedule } from '@/lib/db/car-candidate-actions'

/**
 * The cadence selector for one source.
 *
 * Changing it changes how often somebody else's server is asked for pages, so
 * the control says what it will do and the options stop at daily. There is no
 * "hourly" here and no free-text minutes field: a dropdown whose most aggressive
 * option is once a day cannot be used to accidentally hammer a small site, and
 * the one number a tired operator should not be able to type at midnight is a
 * crawl interval.
 */

const OPTIONS: { value: string; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'every-3-days', label: 'Every 3 days' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'manual', label: 'Manual only' },
]

export function ScheduleControl({
  sourceId,
  schedule,
}: {
  sourceId: string
  schedule: string
}) {
  const router = useRouter()
  const [value, setValue] = React.useState(schedule)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function change(next: string) {
    const previous = value
    setValue(next)
    setBusy(true)
    const result = await updateSourceSchedule(sourceId, next)
    setBusy(false)

    if (!result.ok) {
      // Put the control back rather than leaving it showing a cadence that was
      // never saved — a stale dropdown is how an operator believes a source is
      // weekly when the scheduler still thinks it is daily.
      setValue(previous)
      setError(result.message)
      return
    }

    setError(null)
    router.refresh()
  }

  return (
    <>
      <label className="sr-only" htmlFor={`schedule-${sourceId}`}>
        How often to crawl {sourceId}
      </label>
      <select
        id={`schedule-${sourceId}`}
        value={value}
        disabled={busy}
        onChange={(event) => void change(event.target.value)}
        className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-ui-sm text-slate-800 focus:border-plug-blue-500 focus:outline-none disabled:opacity-50"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1 text-ui-xs text-red-700">{error}</p> : null}
    </>
  )
}
