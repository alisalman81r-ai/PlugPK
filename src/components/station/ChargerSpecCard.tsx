// src/components/station/ChargerSpecCard.tsx
import { ConnectorBadge } from '@/components/ui'
import { CONDITION_LABEL } from '@/lib/charger-host'
import type { Connector } from '@/lib/types'
import { cn, formatRelativeTime, getConnectorConfig } from '@/lib/utils'

const CONDITION_TONE = {
  working: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  maintenance: 'border-amber-200 bg-amber-50 text-amber-800',
  'not-working': 'border-red-200 bg-red-50 text-red-800',
} as const

const CONDITION_DOT = {
  working: 'bg-emerald-500',
  maintenance: 'bg-amber-500',
  'not-working': 'bg-red-500',
} as const

export interface ChargerSpecCardProps {
  connector: Connector
  index: number
}

/*
  No "Available" / "In use" pill and no "1/2 free". Plug.pk has no live
  connection to the charging hardware (the FAQ says so), so a port count
  that changes only when somebody edits it in the admin portal is not
  availability — it is a guess presented as a reading. What is installed is a
  fact, and that is what this card states.
*/

/** Short abbreviation shown in the icon box. */
const CURRENT_ABBREVIATION: Record<Connector['type'], string> = {
  CCS2: 'DC',
  CHAdeMO: 'DC',
  Type2: 'AC',
  GBT: 'DC',
  Type1: 'AC',
}

function Spec({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="mb-2 text-ui-xs font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className="font-mono text-2xl font-bold text-slate-900">
        {value}
        {unit ? <span className="ml-1 font-mono text-sm text-slate-400">{unit}</span> : null}
      </p>
    </div>
  )
}

export function ChargerSpecCard({ connector, index }: ChargerSpecCardProps) {
  const config = getConnectorConfig(connector.type)

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-6">
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-0 top-0 w-1 rounded-l-2xl bg-gradient-accent"
      />

      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
            <span className="font-mono text-sm font-black text-plug-blue-600">
              {CURRENT_ABBREVIATION[connector.type]}
            </span>
          </span>

          <div>
            <div className="flex items-center gap-2">
              <ConnectorBadge type={connector.type} size="md" />
              <span className="font-mono text-xs text-slate-400">#{index + 1}</span>
            </div>
            <p className="mt-1 text-sm text-slate-500">{config.description}</p>
          </div>
        </div>

        {/* The host's own word on this charger, never presented as a live
            reading: it always says who said it and when. */}
        {connector.hostCondition ? (
          <div className="text-right">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-ui-sm font-semibold',
                CONDITION_TONE[connector.hostCondition],
              )}
            >
              <span aria-hidden="true" className={cn('h-2 w-2 rounded-full', CONDITION_DOT[connector.hostCondition])} />
              {CONDITION_LABEL[connector.hostCondition]}
            </span>
            {connector.hostConditionAt ? (
              <p className="mt-1 text-ui-xs text-slate-400">
                Host update · {formatRelativeTime(connector.hostConditionAt)}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Spec label="Max Power" value={String(connector.maxPowerKw)} unit="kW" />
        <Spec
          label="Ports"
          value={String(connector.ports)}
          unit="installed"
        />
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Compatible with
        </p>

        {connector.compatibleVehicles.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {connector.compatibleVehicles.map((vehicle) => (
              <span
                key={vehicle}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600"
              >
                {vehicle}
              </span>
            ))}
          </div>
        ) : (
          // No list was given for this charger. "Most EVs" was a claim; the socket
          // is what decides it, so that is what is said.
          <p className="text-sm text-slate-500">Any car with a {connector.type} socket</p>
        )}
      </div>
    </div>
  )
}
