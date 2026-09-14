// src/hooks/useCurrentUser.ts
'use client'

import { useEffect, useState } from 'react'

import { getCurrentUser } from '@/lib/db/session-actions'

/**
 * Who is signed in, for a client component that has no other way to know.
 *
 * ── Why this exists ───────────────────────────────────────────────────
 *
 * The community section is a client page, so nothing on it could see the
 * session cookie — it is httpOnly, which is the point of it. Rather than
 * reading the session, the post dialog simply assumed nobody was signed in:
 *
 *     const [showLoginPrompt, setShowLoginPrompt] = useState(true)
 *
 * So a signed-in member was asked to create an account every time they went to
 * start a discussion. Nothing was wrong with the session; it was never
 * consulted.
 *
 * ── Shape of the answer ───────────────────────────────────────────────
 *
 * Three states, not two, and the difference matters. `loading` is not the same
 * as signed out: treating it as signed out is what would make the prompt flash
 * up for a moment before disappearing, which is the same rudeness in a shorter
 * form. Callers should show nothing until it resolves.
 *
 * The server action already exists and is what the business dashboard uses. It
 * reads the cookie, verifies its signature and looks the row up, so an expired
 * or forged cookie resolves to null exactly as it should.
 */
export interface CurrentUserState {
  user: { id: string; name: string; email: string } | null
  /** True until the session has been read. Not the same as signed out. */
  loading: boolean
}

export function useCurrentUser(): CurrentUserState {
  const [state, setState] = useState<CurrentUserState>({ user: null, loading: true })

  useEffect(() => {
    let cancelled = false

    getCurrentUser()
      .then((user) => {
        if (!cancelled) setState({ user, loading: false })
      })
      .catch(() => {
        // A failed lookup is treated as signed out rather than retried. The
        // worst case is being asked to sign in while already signed in, which
        // is the state this hook exists to fix — but guessing the other way
        // would show a member's controls to somebody who is not one.
        if (!cancelled) setState({ user: null, loading: false })
      })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
