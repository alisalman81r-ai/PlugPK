// src/components/business/ChargerManager.tsx
'use client'

import { Check, Loader2, Plus, Trash2, Zap } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui'
import { CONNECTOR_TYPES } from '@/lib/constants'
import { saveMyChargers, type DraftCharger } from '@/lib/db/business-actions'

/**
 * The chargers on the owner's listing.
 *
 * Previously this edited an in-memory array seeded from MOCK_BUSINESS: adding a
 * charger appeared to work, and refreshing put the fixture back. Edits now go
 * to the listing itself, which is also what the map reads — so a charger added
 * here shows up to drivers.
 *
 * The whole list is submitted at once rather than one row at a time. The
 * chargers live in a single JSON column, so sending the full intended list is
 * what keeps the column consistent with what is on screen.
 */

export interface ChargerManagerProps {
  businessId: string
  chargers: DraftCharger[]
  /** Approved listings are live; anything else is not yet visible to drivers. */
  isLive: boolean
}

const MAX_CHARGERS = 20

const FIELD =
  'h-11 w-full rounded-xl border-[1.5px] border-slate-200 bg-white px-3 text-ui text-slate-900 outline-none transition-all focus:border-plug-blue-500'

function blankCharger(): DraftCharger {
  return { connectorType: 'Type2', maxPowerKw: 22, ports: 1 }
}

export function ChargerManager({ businessId, chargers, isLive }: ChargerManagerProps) {
  const [rows, setRows] = React.useState<DraftCharger[]>(chargers)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isSaved, setIsSaved] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // What was last written, so the save button can tell whether anything
  // actually changed rather than offering to save a list nobody touched.
  const [saved, setSaved] = React.useState<string>(() => JSON.stringify(chargers))
  const isDirty = JSON.stringify(rows) !== saved

  const patch = (index: number, next: Partial<DraftCharger>) => {
    setRows((current) =>
      current.map((row, position) => (position === index ? { ...row, ...next } : row)),
    )
    setError(null)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    const result = await saveMyChargers(businessId, rows)
    setIsSaving(false)

    if (!result.ok) {
      setError(result.message ?? 'Could not save your chargers.')
      return
    }

    setSaved(JSON.stringify(rows))
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  const totalPorts = rows.reduce((sum, row) => sum + (Number(row.ports) || 0), 0)

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your chargers</h2>
            <p className="mt-0.5 text-ui-sm text-slate-500">
              {rows.length === 0
                ? 'None listed yet.'
                : `${rows.length} charger${rows.length === 1 ? '' : 's'} · ${totalPorts} port${totalPorts === 1 ? '' : 's'}`}
            </p>
          </div>

          <Button
            variant="secondary"
            onClick={() => {
              setRows((current) => [...current, blankCharger()])
              setError(null)
            }}
            disabled={rows.length >= MAX_CHARGERS}
          >
            <Plus size={16} aria-hidden="true" />
            Add charger
          </Button>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center">
            <Zap size={24} className="mx-auto mb-2 text-slate-400" aria-hidden="true" />
            <p className="text-ui-sm text-slate-500">
              Add the chargers at this location so drivers can filter for them.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((row, index) => (
              <li
                key={`charger-${index}`}
                className="grid items-end gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-[1fr_1fr_1fr_auto]"
              >
                <div>
                  <label
                    htmlFor={`charger-type-${index}`}
                    className="mb-1.5 block text-ui-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    Connector
                  </label>
                  <select
                    id={`charger-type-${index}`}
                    value={row.connectorType}
                    onChange={(event) => patch(index, { connectorType: event.target.value })}
                    className={`${FIELD} cursor-pointer`}
                  >
                    {CONNECTOR_TYPES.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor={`charger-kw-${index}`}
                    className="mb-1.5 block text-ui-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    Power (kW)
                  </label>
                  <input
                    id={`charger-kw-${index}`}
                    type="number"
                    min={0}
                    max={400}
                    value={row.maxPowerKw}
                    onChange={(event) => patch(index, { maxPowerKw: Number(event.target.value) })}
                    className={FIELD}
                  />
                </div>

                <div>
                  <label
                    htmlFor={`charger-ports-${index}`}
                    className="mb-1.5 block text-ui-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    Ports
                  </label>
                  <input
                    id={`charger-ports-${index}`}
                    type="number"
                    min={1}
                    max={50}
                    value={row.ports}
                    onChange={(event) => patch(index, { ports: Number(event.target.value) })}
                    className={FIELD}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setRows((current) => current.filter((_, position) => position !== index))
                    setError(null)
                  }}
                  aria-label={`Remove charger ${index + 1}`}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {rows.length >= MAX_CHARGERS ? (
          <p className="mt-3 text-ui-sm text-slate-500">
            That is the maximum of {MAX_CHARGERS} chargers on one listing.
          </p>
        ) : null}
      </section>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-ui-sm text-red-700">{error}</p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isSaving || !isDirty}>
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              Saving
            </>
          ) : (
            'Save chargers'
          )}
        </Button>

        {isSaved ? (
          <span className="inline-flex items-center gap-1.5 text-ui-sm font-semibold text-green-600">
            <Check size={16} aria-hidden="true" />
            Saved
          </span>
        ) : null}

        {!isLive ? (
          <span className="text-ui-sm text-slate-500">
            Visible to drivers once the listing is approved.
          </span>
        ) : null}
      </div>
    </div>
  )
}
