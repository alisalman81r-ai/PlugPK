// src/components/cars/compare-selection.ts

/*
  No 'use client' here on purpose: MAX_COMPARE is read by the server-rendered
  comparison page, and a constant exported from a client module arrives on the
  server as a reference rather than a number. The hook below only runs in the
  client components that call it.
*/

import * as React from 'react'

/**
 * The cars picked for comparison, kept in localStorage.
 *
 * The selection lived in CarsBrowser's component state, so a refresh, a visit
 * to a car's detail page or any other page and back, or opening the
 * comparison and pressing the site's own "All cars" link all emptied the tray.
 * Somebody who had picked three cars across a long grid lost all three to a
 * single tap.
 *
 * The comparison page still addresses its cars by ?ids= — that is what makes a
 * comparison shareable — and it writes back here whenever its ids change, so
 * adding or removing a car on that page is remembered on the catalogue too.
 *
 * Every read and write is guarded, as in useFavouriteCars: storage throws in a
 * Safari private window, and a comparison tray is never worth breaking the
 * page over.
 */

const KEY = 'plugpk.compare-cars'

/** Four columns of specs is already dense on a phone; more would not read. */
export const MAX_COMPARE = 4

const EVENT = 'plugpk:compare-change'

export function readComparedIds(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return Array.from(new Set(parsed.filter((entry): entry is string => typeof entry === 'string'))).slice(
      0,
      MAX_COMPARE,
    )
  } catch {
    return []
  }
}

export function writeComparedIds(ids: string[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids.slice(0, MAX_COMPARE)))
    // Same-tab listeners; the native `storage` event only fires in other tabs.
    window.dispatchEvent(new Event(EVENT))
  } catch {
    // Remembered for this page only.
  }
}

/**
 * The selection, as state that persists.
 *
 * Starts empty and fills after mount, so the server's HTML and the first client
 * paint agree (reading storage during render is a hydration mismatch). Follows
 * changes made in another tab, or by the comparison page in this one.
 */
export function useComparedCars() {
  const [ids, setIds] = React.useState<string[]>([])

  React.useEffect(() => {
    const sync = () => setIds(readComparedIds())
    sync()
    window.addEventListener('storage', sync)
    window.addEventListener(EVENT, sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(EVENT, sync)
    }
  }, [])

  const set = React.useCallback((next: string[]) => {
    setIds(next)
    writeComparedIds(next)
  }, [])

  const toggle = React.useCallback(
    (id: string) => {
      const current = readComparedIds()
      set(
        current.includes(id)
          ? current.filter((entry) => entry !== id)
          : current.length >= MAX_COMPARE
            ? current
            : [...current, id],
      )
    },
    [set],
  )

  return { ids, set, toggle, clear: React.useCallback(() => set([]), [set]) }
}
