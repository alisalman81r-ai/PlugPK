// src/hooks/useSavedStations.ts
'use client'

import { useEffect, useState } from 'react'

import { getMySavedStationIds, toggleSavedStation } from '@/lib/db/session-actions'

/**
 * Which stations the signed-in visitor has saved, shared by every Save button
 * on the page.
 *
 * The map can show dozens of station cards; each asking the server on its own
 * would be dozens of round trips to a database a region away. So the answer is
 * fetched once per page load and held here, and a toggle on one card updates
 * every other card showing the same station.
 *
 * `signedIn` is null until known. Buttons render nothing until then, and
 * nothing at all for a visitor who is signed out — saving is an account
 * feature, so the control is not offered to someone without one.
 */

interface State {
  signedIn: boolean | null
  ids: Set<string>
}

let state: State = { signedIn: null, ids: new Set() }
let request: Promise<void> | null = null
const listeners = new Set<(next: State) => void>()

function publish(next: State) {
  state = next
  for (const listener of listeners) listener(next)
}

function load() {
  if (!request) {
    request = getMySavedStationIds()
      .then(({ signedIn, ids }) => publish({ signedIn, ids: new Set(ids) }))
      .catch(() => publish({ signedIn: false, ids: new Set() }))
  }
  return request
}

export function useSavedStations() {
  const [current, setCurrent] = useState<State>(state)

  useEffect(() => {
    listeners.add(setCurrent)
    setCurrent(state)
    void load()
    return () => {
      listeners.delete(setCurrent)
    }
  }, [])

  /** Saves or unsaves; shown at once, put back if the server refuses. */
  const toggle = async (stationId: string) => {
    const wasSaved = state.ids.has(stationId)
    const optimistic = new Set(state.ids)
    if (wasSaved) optimistic.delete(stationId)
    else optimistic.add(stationId)
    publish({ ...state, ids: optimistic })

    const result = await toggleSavedStation(stationId).catch(() => null)
    if (!result?.ok) {
      const rollback = new Set(state.ids)
      if (wasSaved) rollback.add(stationId)
      else rollback.delete(stationId)
      publish({ ...state, ids: rollback })
      return false
    }
    return true
  }

  return { signedIn: current.signedIn, isSaved: (id: string) => current.ids.has(id), toggle }
}
