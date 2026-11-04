// src/components/business/BizKpi.tsx
import type { IconType } from '@/components/ui/icons'
import type * as React from 'react'

import { AdmIcon, type AdmIconName } from '@/components/admin/admin-icons'
import { CountUp, KpiRing } from '@/components/admin/admin-motion'
import { cn } from '@/lib/utils'

/**
 * One figure in the business portal: the admin design's KPI tile (`.card.kpi`)
 * — icon, mono label, a JetBrains figure that counts up, and a note. Rendered
 * inside `.biz-kpis`, whose tiles the shell staggers in.
 *
 * `value` null renders "—" with the reason, never a stand-in number.
 */
export function BizKpi({
  label,
  value,
  decimals = 0,
  suffix,
  note,
  icon,
  lit = false,
  ring,
}: {
  label: string
  value: number | null
  decimals?: number
  suffix?: string
  note?: React.ReactNode
  icon: AdmIconName | IconType
  lit?: boolean
  /** Draws the corner ring to this fraction (0–1). */
  ring?: number
}) {
  const Icon = typeof icon === 'string' ? null : icon
  return (
    <article className={cn('card kpi', lit && 'is-lit', value === null && 'kpi--none')}>
      <div className="kpi__top">
        {Icon ? <Icon size={24} className="kpi__ico" aria-hidden="true" /> : <AdmIcon name={icon as AdmIconName} className="kpi__ico" />}
      </div>
      {typeof ring === 'number' && value !== null ? <KpiRing fraction={ring} /> : null}
      <p className="kpi__lab">{label}</p>
      <p className={cn('kpi__val', value === null && 'kpi__val--none')}>
        {value === null ? '—' : <CountUp value={value} decimals={decimals} />}
        {suffix && value !== null ? <small>{suffix}</small> : null}
      </p>
      {note ? <div className="kpi__note">{note}</div> : null}
    </article>
  )
}
