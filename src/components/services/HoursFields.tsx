// src/components/services/HoursFields.tsx
'use client'

import * as React from 'react'

import { WEEK_DAYS, WEEK_DAY_LABEL, hoursMode, type HoursMode } from '@/lib/service-hours'
import type { OperatingHours } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * Opening hours inside a form: not stated, open 24 hours, or a time per day.
 * Read back on the server by parseHoursForm (lib/service-hours), which owns
 * the field names. Used by the public application and the admin editor.
 */
export function HoursFields({
  initial,
  invalid = false,
  inputClassName,
}: {
  initial?: Partial<OperatingHours>
  invalid?: boolean
  /** The surrounding form's input style, so the times match its other fields. */
  inputClassName?: string
}) {
  const [mode, setMode] = React.useState<HoursMode>(hoursMode(initial))
  const [closed, setClosed] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(WEEK_DAYS.map((day) => [day, initial?.[day]?.isClosed ?? day === 'sunday'])),
  )

  /** Copies Monday's times to every open day: the common case is one set of hours. */
  function copyMonday(event: React.MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form
    if (!form) return
    const open = (form.elements.namedItem('mondayOpen') as HTMLInputElement | null)?.value ?? ''
    const close = (form.elements.namedItem('mondayClose') as HTMLInputElement | null)?.value ?? ''
    for (const day of WEEK_DAYS.slice(1)) {
      const o = form.elements.namedItem(`${day}Open`) as HTMLInputElement | null
      const c = form.elements.namedItem(`${day}Close`) as HTMLInputElement | null
      if (o && !o.disabled) o.value = open
      if (c && !c.disabled) c.value = close
    }
  }

  const options: { value: HoursMode; label: string }[] = [
    { value: 'set', label: 'Set hours' },
    { value: '24h', label: 'Open 24 hours' },
    { value: 'unknown', label: 'Not sure yet' },
  ]
  const timeClass = cn(
    'h-10 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-2 font-mono text-ui-sm text-slate-900 outline-none focus-visible:border-plug-blue-500 disabled:bg-slate-100 disabled:text-slate-400',
    inputClassName,
  )

  return (
    <div className={cn(invalid && 'rounded-xl ring-2 ring-red-300 ring-offset-4')}>
      <input type="hidden" name="hoursMode" value={mode} />
      <div role="radiogroup" aria-label="Opening hours" className="inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={mode === option.value}
            onClick={() => setMode(option.value)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-ui-sm font-semibold transition-colors',
              mode === option.value ? 'bg-white text-plug-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {mode === 'set' ? (
        <div className="mt-4">
          <ul className="flex flex-col gap-2">
            {WEEK_DAYS.map((day) => {
              const isClosed = closed[day] ?? false
              return (
                <li key={day} className="grid grid-cols-[6.5rem_1fr_1fr_auto] items-center gap-2 sm:grid-cols-[8rem_1fr_1fr_auto] sm:gap-3">
                  <span className="text-ui-sm font-medium text-slate-700">{WEEK_DAY_LABEL[day]}</span>
                  <input
                    type="time"
                    name={`${day}Open`}
                    aria-label={`${WEEK_DAY_LABEL[day]} opens`}
                    defaultValue={initial?.[day]?.open || '09:00'}
                    disabled={isClosed}
                    className={timeClass}
                  />
                  <input
                    type="time"
                    name={`${day}Close`}
                    aria-label={`${WEEK_DAY_LABEL[day]} closes`}
                    defaultValue={initial?.[day]?.close || '18:00'}
                    disabled={isClosed}
                    className={timeClass}
                  />
                  <label className="flex cursor-pointer items-center gap-1.5 text-ui-sm text-slate-600">
                    <input
                      type="checkbox"
                      name={`${day}Closed`}
                      checked={isClosed}
                      onChange={(event) => setClosed((prev) => ({ ...prev, [day]: event.target.checked }))}
                      className="h-4 w-4 cursor-pointer rounded border-slate-300 text-plug-blue-600"
                    />
                    Closed
                  </label>
                </li>
              )
            })}
          </ul>
          <button
            type="button"
            onClick={copyMonday}
            className="mt-3 text-ui-sm font-semibold text-plug-blue-600 hover:underline"
          >
            Copy Monday&apos;s times to every open day
          </button>
        </div>
      ) : (
        <p className="mt-3 text-ui-sm text-slate-500">
          {mode === '24h' ? 'Shown as “Open 24 hours” on your listing.' : 'Your listing will say the hours are not listed yet.'}
        </p>
      )}
    </div>
  )
}
