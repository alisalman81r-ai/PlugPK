// src/components/station/ChargerSpecCard.tsx
import { ConnectorBadge } from '@/components/ui'
import type { Connector, ConnectorStatus } from '@/lib/types'
import { cn, getConnectorConfig } from '@/lib/utils'

export interface ChargerSpecCardProps {
  connector: Connector
  index: number
}

const STATUS_PILL: Record<ConnectorStatus, { label: string; className: string }> = {
  available: { label: 'Available', className: 'border-green-200 bg-green-50 text-green-700' },
  'in-use': { label: 'In Use', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  offline: { label: 'Offline', className: 'border-red-200 bg-red-50 text-red-700' },
}

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
  const status = STATUS_PILL[connector.status]

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-6">
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-0 top-0 w-1 rounded-l-2xl bg-gradient-brand"
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

        <span
          className={cn(
            'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold',
            status.className,
          )}
        >
          {status.label}
        </span>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Spec label="Max Power" value={String(connector.maxPowerKw)} unit="kW" />
        <Spec
          label="Ports"
          value={`${connector.availablePorts}/${connector.ports}`}
          unit="free"
        />
        <Spec
          label="Price"
          value={connector.isFree ? 'Free' : `PKR ${connector.pricePerKwh}`}
          unit={connector.isFree ? undefined : '/kWh'}
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
          <p className="text-sm text-slate-400">Compatible with most EVs</p>
        )}
      </div>
    </div>
  )
}
