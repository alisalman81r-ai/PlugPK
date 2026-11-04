// src/components/dashboard/ClubToggle.tsx
'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'

import { joinClub, leaveClub } from '@/lib/db/community-actions'

import { ISpin } from './acct-icons'
import { abtn, FERR } from './dash-ui'

/**
 * The Join / Leave button on a club row of My clubs (.aclubs li .btn).
 *
 * The design's button only said "Requested"; here joining is real — a
 * ClubMember row, free — so it says "Joined" and the page re-reads, moving the
 * club up into "Your clubs". A refusal puts the button back with the reason.
 */
export function ClubToggle({ clubId, clubName, joined }: { clubId: string; clubName: string; joined: boolean }) {
  const router = useRouter()
  const [state, setState] = React.useState(joined)
  const [error, setError] = React.useState<string | null>(null)
  const [pending, startTransition] = React.useTransition()

  React.useEffect(() => setState(joined), [joined])

  const toggle = () => {
    const next = !state
    setError(null)
    setState(next)
    startTransition(async () => {
      try {
        const result = next ? await joinClub(clubId) : await leaveClub(clubId)
        if (!result.ok) throw new Error(result.message)
        router.refresh()
      } catch (cause) {
        setState(!next)
        setError(cause instanceof Error && cause.message ? cause.message : 'Something went wrong. Please try again.')
      }
    })
  }

  return (
    <div className="grid justify-items-start gap-1.5 max-[640px]:col-start-2">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-label={`${joined ? 'Leave' : 'Join'} ${clubName}`}
        className={joined ? abtn('plain', 'sm') : abtn('line', 'sm')}
      >
        {pending ? <ISpin /> : null}
        <span>{joined ? (state ? 'Leave' : 'Left') : state ? 'Joined' : 'Join'}</span>
      </button>
      {error ? (
        <p role="alert" className={FERR}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
