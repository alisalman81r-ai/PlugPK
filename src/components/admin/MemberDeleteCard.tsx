// src/components/admin/MemberDeleteCard.tsx
'use client'

import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { deleteMember } from '@/lib/db/member-actions'
import { cn } from '@/lib/utils'

/**
 * Deleting a member, with what that actually does spelled out.
 *
 * Deletion here is not one row: reviews go, saved listings go, and business
 * listings stay behind without an owner. Those consequences are listed before
 * the button rather than discovered afterwards, because the third one in
 * particular is not what "delete this profile" sounds like it means.
 *
 * Typing the name to confirm, rather than the two-click arm used elsewhere in
 * the admin: this is the only destructive action here that removes a person's
 * data across several tables and cannot be undone from the interface.
 */

export interface MemberDeleteCardProps {
  id: string
  name: string
  reviewCount: number
  savedCount: number
  businessCount: number
}

export function MemberDeleteCard({
  id,
  name,
  reviewCount,
  savedCount,
  businessCount,
}: MemberDeleteCardProps) {
  const router = useRouter()
  const [typed, setTyped] = React.useState('')
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const confirmed = typed.trim() === name

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    const result = await deleteMember(id)

    if (!result.ok) {
      setIsDeleting(false)
      setError(result.message ?? 'Could not delete this account.')
      return
    }

    // Straight back to the list — this page no longer has anything to show.
    router.push('/admin/members')
    router.refresh()
  }

  const consequences = [
    reviewCount > 0
      ? `${reviewCount} review${reviewCount === 1 ? '' : 's'} will be deleted, and the rating on every listing they reviewed will change.`
      : 'They have written no reviews.',
    savedCount > 0
      ? `${savedCount} saved listing${savedCount === 1 ? '' : 's'} will be removed.`
      : 'They have saved nothing.',
    businessCount > 0
      ? `${businessCount} business listing${businessCount === 1 ? '' : 's'} will be kept but left without an owner — nobody will be able to sign in and manage ${businessCount === 1 ? 'it' : 'them'}. Delete ${businessCount === 1 ? 'it' : 'them'} separately on the Businesses page if that is what you want.`
      : 'They own no business listings.',
  ]

  return (
    <section className="rounded-xl border-[1.5px] border-red-200 bg-red-50/50 p-6">
      <h2 className="flex items-center gap-2 text-ui-lg font-bold text-red-900">
        <AlertTriangle size={18} className="shrink-0 text-red-600" aria-hidden="true" />
        Delete this account
      </h2>

      <p className="mt-2 text-ui-sm text-red-900/80">
        Permanent. There is no undo from here.
      </p>

      <ul className="mt-4 flex list-disc flex-col gap-1.5 pl-5 text-ui-sm text-red-900/80">
        {consequences.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <div className="mt-6 max-w-md">
        <label htmlFor="confirm-name" className="mb-2 block text-ui-sm font-semibold text-red-900">
          Type <span className="font-mono">{name}</span> to confirm
        </label>
        <input
          id="confirm-name"
          type="text"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          placeholder={name}
          className="h-11 w-full rounded-xl border-[1.5px] border-red-200 bg-white px-4 text-ui text-slate-900 outline-none transition-all focus:border-red-500"
        />
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-ui-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleDelete}
        disabled={!confirmed || isDeleting}
        className={cn(
          'mt-5 inline-flex h-11 items-center gap-2 rounded-xl px-5 text-ui font-semibold transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400',
          confirmed && !isDeleting
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'cursor-not-allowed bg-red-200 text-red-500',
        )}
      >
        {isDeleting ? (
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
        ) : (
          <Trash2 size={16} aria-hidden="true" />
        )}
        {isDeleting ? 'Deleting' : 'Delete account'}
      </button>
    </section>
  )
}
