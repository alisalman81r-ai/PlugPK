// src/components/community/ClubJoinButton.tsx
'use client'

import { Check, UserPlus } from '@/components/ui/icons'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { joinClub, leaveClub } from '@/lib/db/community-actions'
import { cn } from '@/lib/utils'

/**
 * Join / leave one club — the same control on the club card, the club's own
 * page and the dashboard.
 *
 * Joining is free (community-actions.ts joinClub writes a ClubMember row). The
 * button answers at once and rolls back with a message if the server refuses.
 * `onChange` lets a parent move its member count in step; `refreshAfter` asks
 * the server for a fresh render afterwards, for pages that list the members.
 */
export function ClubJoinButton({
  clubId,
  initiallyJoined,
  signedIn,
  signInRedirect,
  onChange,
  refreshAfter = false,
  className,
}: {
  clubId: string
  initiallyJoined: boolean
  signedIn: boolean
  /** Where sign-in sends a signed-out visitor back to. */
  signInRedirect: string
  onChange?: (joined: boolean) => void
  refreshAfter?: boolean
  className?: string
}) {
  const router = useRouter()
  const [joined, setJoined] = React.useState(initiallyJoined)
  const [error, setError] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()

  // A fresh server render is the truth again.
  React.useEffect(() => setJoined(initiallyJoined), [initiallyJoined])

  const toggle = (join: boolean) => {
    setError(null)
    setJoined(join)
    onChange?.(join)
    startTransition(async () => {
      try {
        const result = join ? await joinClub(clubId) : await leaveClub(clubId)
        if (!result.ok) throw new Error(result.message)
        if (refreshAfter) router.refresh()
      } catch (cause) {
        setJoined(!join)
        onChange?.(!join)
        setError(cause instanceof Error && cause.message ? cause.message : 'Something went wrong. Please try again.')
      }
    })
  }

  const primary =
    'flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-plug-blue-600 text-ui font-bold text-white transition-colors duration-150 hover:bg-plug-cyan-500 hover:text-plug-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2 disabled:opacity-70'

  return (
    <div className={className}>
      {!signedIn ? (
        <Link href={`/login?redirect=${encodeURIComponent(signInRedirect)}`} className={primary}>
          <UserPlus size={16} aria-hidden="true" />
          Sign in to join
        </Link>
      ) : joined ? (
        <>
          <p className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 text-ui font-bold text-green-700">
            <Check size={16} aria-hidden="true" />
            You&apos;re a member
          </p>
          <button
            type="button"
            onClick={() => toggle(false)}
            disabled={isPending}
            className="mt-2 w-full text-center text-ui-xs font-semibold text-slate-500 hover:text-red-600 disabled:opacity-60"
          >
            Leave club
          </button>
        </>
      ) : (
        <button type="button" onClick={() => toggle(true)} disabled={isPending} className={cn(primary)}>
          <UserPlus size={16} aria-hidden="true" />
          Join club
        </button>
      )}
      {error ? (
        <p role="alert" className="mt-2 text-center text-ui-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  )
}
