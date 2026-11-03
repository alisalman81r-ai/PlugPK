// src/components/business/host/ChargerStatusBoard.tsx
'use client'

import { CheckCircle2, Loader2, Wrench, XCircle, type IconType } from '@/components/ui/icons'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { CHARGER_CONDITIONS, CONDITION_SHORT, type ChargerCondition } from '@/lib/charger-host'
import { setChargerCondition } from '@/lib/db/host-actions'
import { cn, formatRelativeTime } from '@/lib/utils'

export interface StatusBoardCharger {
  id: string
  label: string
  condition: ChargerCondition | null
  conditionAt: string | null
}

const STYLE: Record<ChargerCondition, { icon: IconType; on: string; dot: string }> = {
  working: { icon: CheckCircle2, on: 'border-emerald-500 bg-emerald-50 text-emerald-800', dot: 'bg-emerald-500' },
  maintenance: { icon: Wrench, on: 'border-amber-500 bg-amber-50 text-amber-800', dot: 'bg-amber-500' },
  'not-working': { icon: XCircle, on: 'border-red-500 bg-red-50 text-red-800', dot: 'bg-red-500' },
}

/**
 * One row per charger, three buttons. The tap is the whole interaction: the
 * new status shows at once and is saved behind it, and if the save fails the
 * row goes back to what it was and says so.
 */
export function ChargerStatusBoard({ businessId, chargers }: { businessId: string; chargers: StatusBoardCharger[] }) {
  const router = useRouter()
  const [local, setLocal] = React.useState(() => Object.fromEntries(chargers.map((c) => [c.id, c.condition])))
  const [saving, setSaving] = React.useState<string | null>(null)
  const [error, setError] = React.useState<{ id: string; text: string } | null>(null)

  React.useEffect(() => {
    setLocal(Object.fromEntries(chargers.map((c) => [c.id, c.condition])))
  }, [chargers])

  const choose = async (chargerId: string, condition: ChargerCondition) => {
    const before = local[chargerId] ?? null
    if (before === condition) return
    setLocal((current) => ({ ...current, [chargerId]: condition }))
    setSaving(chargerId)
    setError(null)
    try {
      const result = await setChargerCondition(businessId, chargerId, condition)
      if (!result.ok) {
        setLocal((current) => ({ ...current, [chargerId]: before }))
        setError({ id: chargerId, text: result.message ?? 'Could not update the status.' })
        return
      }
      router.refresh()
    } catch {
      setLocal((current) => ({ ...current, [chargerId]: before }))
      setError({ id: chargerId, text: 'Could not reach plugpk. Check your connection.' })
    } finally {
      setSaving(null)
    }
  }

  if (chargers.length === 0) return <p className="text-ui-sm text-slate-500">Add a charger first.</p>

  return (
    <ul className="flex flex-col gap-3">
      {chargers.map((charger) => {
        const current = local[charger.id] ?? null
        return (
          <li key={charger.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-ui-sm font-semibold text-slate-900">
                <span
                  aria-hidden="true"
                  className={cn('h-2.5 w-2.5 rounded-full', current ? STYLE[current].dot : 'bg-slate-300')}
                />
                {charger.label}
              </p>
              <span className="flex items-center gap-1.5 text-ui-xs text-slate-400">
                {saving === charger.id ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : null}
                {current
                  ? charger.conditionAt && current === charger.condition
                    ? `Updated ${formatRelativeTime(charger.conditionAt)}`
                    : 'Saving…'
                  : 'No status set — drivers see no status'}
              </span>
            </div>
            <div role="radiogroup" aria-label={`Status of ${charger.label}`} className="grid grid-cols-3 gap-2">
              {CHARGER_CONDITIONS.map((condition) => {
                const Icon = STYLE[condition].icon
                const on = current === condition
                return (
                  <button
                    key={condition}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    disabled={saving === charger.id}
                    onClick={() => choose(charger.id, condition)}
                    className={cn(
                      'flex min-h-11 items-center justify-center gap-1.5 rounded-lg border-[1.5px] px-2 text-ui-sm font-semibold transition-colors',
                      on ? STYLE[condition].on : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                    )}
                  >
                    <Icon size={15} className="shrink-0" aria-hidden="true" />
                    <span className="truncate">{CONDITION_SHORT[condition]}</span>
                  </button>
                )
              })}
            </div>
            {error?.id === charger.id ? (
              <p role="alert" className="mt-2 text-ui-sm text-red-600">
                {error.text}
              </p>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
