// src/components/vehicles/VehicleBrowser.tsx
'use client'

import { Car } from 'lucide-react'
import * as React from 'react'

import { CAP_RULE, FACE, FRAME } from '@/components/shared/frame'
import { AnimatedIcon, HoverMotion } from '@/components/ui'
import type { Vehicle } from '@/data/pakistanVehicles'
import type { DbVehicle } from '@/lib/db/serialize'
import { getVehicleLabel } from '@/lib/vehicles'
import { cn } from '@/lib/utils'

import { VehicleSelector } from './VehicleSelector'

/**
 * The selector with somewhere to put its answer.
 *
 * The selector itself is a field — it belongs in a form. This wraps it for the
 * catalogue page: the field on the left, what was picked on the right, and the
 * catalogue's own totals underneath so the page says something before anything
 * is selected.
 *
 * The picked panel shows verified figures only where the row carries them, and
 * says plainly that it does not otherwise. A catalogue that invents a range is
 * worse than one that admits it has none — a driver plans a 400km trip on that
 * number, and 137 of the 145 rows have no verified range yet.
 *
 * Rows and totals arrive as props from the page, which reads them from the
 * database. Nothing here imports the static module, so a vehicle added by an
 * admin shows up without a deploy.
 */

export interface VehicleBrowserProps {
  vehicles: DbVehicle[]
  totals: {
    vehicles: number
    brands: number
    official: number
    electric: number
    withSpecs: number
  }
}

const AVAILABILITY_LABEL: Record<Vehicle['availability'], string> = {
  official: 'Officially sold in Pakistan',
  imported: 'Commonly imported',
  'rare-import': 'Rare import',
}

const POWERTRAIN_LABEL: Record<Vehicle['powertrain'], string> = {
  BEV: 'Fully electric',
  PHEV: 'Plug-in hybrid',
  EREV: 'Range-extended electric',
}

export function VehicleBrowser({ vehicles, totals }: VehicleBrowserProps) {
  const [selected, setSelected] = React.useState<DbVehicle | null>(null)

  /** A row has figures when it has a range; the rest travel with it. */
  const hasFigures = Boolean(selected?.rangeKm)

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
      {/* ── Pick one ─────────────────────────────────────────────── */}
      <div className={FRAME}>
        <div className={cn(FACE, 'p-7 lg:p-8')}>
          <p className="text-ui-sm font-bold uppercase tracking-[0.18em] text-plug-blue-600">
            Find your vehicle
          </p>

          <span aria-hidden="true" className={cn('mt-5 block', CAP_RULE)} />

          <p className="mt-5 text-ui leading-relaxed text-slate-500">
            Pick a brand, then a model. Or search — &ldquo;iX&rdquo;,
            &ldquo;Tesla&rdquo; and &ldquo;PHEV&rdquo; all work.
          </p>

          {/* The panel below reads what this sets; nothing else is wired to
              it yet, so the page is safe to link to from anywhere. */}
          <div className="mt-6">
            <VehicleSelector
              vehicles={vehicles}
              selectedVehicle={selected}
              onSelect={setSelected}
            />
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-slate-100 pt-6">
            <div>
              <dd className="text-2xl font-black tracking-tight text-slate-900">
                {totals.vehicles}
              </dd>
              <dt className="mt-0.5 text-ui-xs text-slate-500">Vehicles listed</dt>
            </div>
            <div>
              <dd className="text-2xl font-black tracking-tight text-slate-900">
                {totals.brands}
              </dd>
              <dt className="mt-0.5 text-ui-xs text-slate-500">Brands</dt>
            </div>
            <div>
              <dd className="text-2xl font-black tracking-tight text-slate-900">
                {totals.official}
              </dd>
              <dt className="mt-0.5 text-ui-xs text-slate-500">Officially sold</dt>
            </div>
            <div>
              <dd className="text-2xl font-black tracking-tight text-slate-900">
                {totals.electric}
              </dd>
              <dt className="mt-0.5 text-ui-xs text-slate-500">Fully electric</dt>
            </div>
            <div>
              <dd className="text-2xl font-black tracking-tight text-slate-900">
                {totals.withSpecs}
              </dd>
              <dt className="mt-0.5 text-ui-xs text-slate-500">With verified specs</dt>
            </div>
          </dl>
        </div>
      </div>

      {/* ── What was picked ──────────────────────────────────────── */}
      <HoverMotion className={FRAME}>
        <div className={cn(FACE, 'p-7 lg:p-8')}>
          {selected ? (
            <>
              <p className="text-ui-sm font-bold uppercase tracking-[0.18em] text-plug-blue-600">
                {selected.brand}
              </p>

              <h2 className="mt-3 text-[clamp(1.75rem,3.5vw,2.5rem)] font-black leading-[1.05] tracking-[-0.03em] text-slate-900">
                {getVehicleLabel(selected)}
              </h2>

              <ul className="mt-7 flex flex-col">
                <Row label="Powertrain" value={POWERTRAIN_LABEL[selected.powertrain]} />
                <Row label="Availability" value={AVAILABILITY_LABEL[selected.availability]} />
                <Row label="Body type" value={selected.bodyType} capitalise />
                <Row label="Catalogue id" value={selected.id} mono />
              </ul>

              {selected && hasFigures ? (
                <div className="mt-7 border-t border-slate-100 pt-6">
                  <p className="text-ui-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                    Verified figures
                  </p>
                  {/* Each row renders only where its column is populated, so an
                      unknown AC speed is absent rather than shown as a dash the
                      reader has to interpret. */}
                  <ul className="mt-4 flex flex-col">
                    {selected.rangeKm ? (
                      <Row label="Range" value={`${selected.rangeKm} km`} />
                    ) : null}
                    {selected.batteryCapacityKwh ? (
                      <Row label="Battery" value={`${selected.batteryCapacityKwh} kWh`} />
                    ) : null}
                    {selected.dcChargingKw ? (
                      <Row label="DC charging" value={`${selected.dcChargingKw} kW`} />
                    ) : null}
                    {selected.acChargingKw ? (
                      <Row label="AC charging" value={`${selected.acChargingKw} kW`} />
                    ) : null}
                    {selected.modelYear ? (
                      <Row label="Model year" value={String(selected.modelYear)} />
                    ) : null}
                    {selected.connectorTypes?.length ? (
                      <Row label="Connectors" value={selected.connectorTypes.join(', ')} />
                    ) : null}
                  </ul>
                </div>
              ) : (
                <p className="mt-7 border-t border-slate-100 pt-6 text-ui-sm leading-relaxed text-slate-500">
                  No verified range, battery or charging figures for this one yet. The
                  catalogue lists which vehicles are here; it does not guess at numbers a
                  driver would plan a trip on.
                </p>
              )}
            </>
          ) : (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center">
              <AnimatedIcon motion="pop" standalone>
                <Car size={40} className="text-slate-200" aria-hidden="true" />
              </AnimatedIcon>
              <p className="mt-4 text-ui font-semibold text-slate-600">Nothing selected yet</p>
              <p className="mt-1.5 max-w-[16rem] text-ui-sm leading-relaxed text-slate-400">
                Choose a vehicle and its details appear here.
              </p>
            </div>
          )}
        </div>
      </HoverMotion>
    </div>
  )
}

interface RowProps {
  label: string
  value: string
  mono?: boolean
  capitalise?: boolean
}

function Row({ label, value, mono, capitalise }: RowProps) {
  return (
    <li className="flex items-baseline justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0">
      <span className="shrink-0 text-ui-sm text-slate-500">{label}</span>
      <span
        className={cn(
          'min-w-0 text-right text-ui-sm font-semibold text-slate-900',
          mono && 'font-mono text-ui-xs',
          capitalise && 'capitalize',
        )}
      >
        {value}
      </span>
    </li>
  )
}
