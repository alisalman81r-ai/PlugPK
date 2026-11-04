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
  working: { icon: CheckCircle2, on: 'border-[#35D07F] bg-[rgba(53,208,127,.12)] text-[#12804a]', dot: 'bg-[#35D07F]' },
  maintenance: { icon: Wrench, on: 'border-[#FFB020] bg-[rgba(255,176,32,.16)] text-[#8a5a00]', dot: 'bg-[#FFB020]' },
  'not-working': { icon: XCircle, on: 'border-ember bg-[rgba(255,90,31,.12)] text-[#b23b0d]', dot: 'bg-ember' },
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

  if (chargers.length === 0) return <p className="m-0 text-sm text-muted">Add a charger first.</p>

  return (
    <ul className="flex flex-col gap-3">
      {chargers.map((charger) => {
        const current = local[charger.id] ?? null
        return (
          <li key={charger.id} className="rounded-[18px] border border-ink/[.09] bg-paper p-4 transition-[translate,box-shadow] duration-500 ease-out hover:[translate:0_-2px] hover:shadow-[0_20px_40px_-28px_rgba(11,12,14,.4)]">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 font-display text-base font-normal text-ink">
                <span
                  aria-hidden="true"
                  className={cn('h-2.5 w-2.5 rounded-full', current ? STYLE[current].dot : 'bg-fog')}
                />
                {charger.label}
              </p>
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-fog">
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
                      'flex min-h-11 items-center justify-center gap-1.5 rounded-xl border-[1.5px] px-2 text-[13px] font-semibold transition-[background-color,border-color,color,scale] duration-200 active:scale-[.97]',
                      on ? STYLE[condition].on : 'border-ink/[.09] bg-white text-muted hover:border-ink/30 hover:text-ink',
                    )}
                  >
                    <Icon size={15} className="shrink-0" aria-hidden="true" />
                    <span className="truncate">{CONDITION_SHORT[condition]}</span>
                  </button>
                )
              })}
            </div>
            {error?.id === charger.id ? (
              <p role="alert" className="mb-0 mt-2 text-[13px] text-[#b23b0d]">
                {error.text}
              </p>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
