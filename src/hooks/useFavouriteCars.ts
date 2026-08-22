// src/hooks/useFavouriteCars.ts
'use client'

import * as React from 'react'

/**
 * Cars the visitor has saved, kept in localStorage.
 *
 * Deliberately not in the database. Saving a car is a browsing convenience, not
 * an account feature — requiring a login to shortlist three cars is the kind of
 * friction that loses the visit, and there is no signed-in car-owner concept in
 * this app yet. When there is, this hook is the one place to point at it.
 *
 * Every read and write is guarded. localStorage throws outright in a Safari
 * private window and can be blocked by browser settings, and a shortlist is
 * never worth breaking the page over — a failure here just means favourites do
 * not persist.
 */

const KEY = 'plugpk.favourite-cars'

function read(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    // Filtered rather than trusted: this string is editable by anyone with
    // devtools, and a non-array would break every consumer downstream.
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string') : []
  } catch {
    return []
  }
}

export function useFavouriteCars() {
  /**
   * Starts empty on both server and client, then fills after mount.
   *
   * Reading localStorage during the first render would make the server's HTML
   * and the client's first paint disagree, which React reports as a hydration
   * mismatch and resolves by throwing the server markup away.
   */
  const [ids, setIds] = React.useState<string[]>([])
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    setIds(read())
    setReady(true)
  }, [])

  const persist = React.useCallback((next: string[]) => {
    setIds(next)
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      // Saved for this session only. Nothing to tell the user — the heart
      // still reflects their click.
    }
  }, [])

  const toggle = React.useCallback(
    (id: string) => {
      persist(ids.includes(id) ? ids.filter((entry) => entry !== id) : [...ids, id])
    },
    [ids, persist],
  )

  const clear = React.useCallback(() => persist([]), [persist])

  return {
    ids,
    /** False until the effect has run; used to avoid a filled-heart flash. */
    ready,
    isFavourite: React.useCallback((id: string) => ids.includes(id), [ids]),
    toggle,
    clear,
    count: ids.length,
  }
}
