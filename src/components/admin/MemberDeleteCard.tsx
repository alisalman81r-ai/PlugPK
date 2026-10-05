// src/components/admin/MemberDeleteCard.tsx
'use client'

import { AlertTriangle, EyeOff, Loader2, Trash2 } from '@/components/ui/icons'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { anonymiseMember, deleteMember } from '@/lib/db/member-actions'
import { cn } from '@/lib/utils'

import { useAdminToast } from './AdminToast'
import { runAction } from './run-action'

/**
 * Removing a member, two ways, with what each actually does spelled out.
 *
 * Delete takes the account and their personal data across several tables:
 * reviews, posts, comments and bookmarks go, business listings stay behind
 * without an owner. Anonymise keeps every row and removes the person — their
 * name, email, picture and password — which is the only option for an account
 * with memberships, because those rows cascade with the user and they are the
 * record of what was paid.
 *
 * Typing the name to confirm, rather than the two-click arm used elsewhere in
 * the admin: both remove a person's data across several tables and neither can
 * be undone from the interface.
 *
 * The server refuses the same cases this card hides (yourself, an admin, a
 * delete with memberships); the card hides them so nobody types a name only
 * to be told no.
 */

export interface MemberDeleteCardProps {
  id: string
  name: string
  reviewCount: number
  savedCount: number
  businessCount: number
  postCount: number
  commentCount: number
  membershipCount: number
  isAdmin: boolean
  isSelf: boolean
  anonymised: boolean
}

export function MemberDeleteCard({
  id,
  name,
  reviewCount,
  savedCount,
  businessCount,
  postCount,
  commentCount,
  membershipCount,
  isAdmin,
  isSelf,
  anonymised,
}: MemberDeleteCardProps) {
  const router = useRouter()
  const toast = useAdminToast()
  const [typed, setTyped] = React.useState('')
  const [busy, setBusy] = React.useState<'delete' | 'anonymise' | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const confirmed = typed.trim() === name
  const canDelete = membershipCount === 0

  const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

  const run = async (kind: 'delete' | 'anonymise') => {
    setBusy(kind)
    setError(null)

    const result = await runAction(() => (kind === 'delete' ? deleteMember(id) : anonymiseMember(id)))

    setBusy(null)
    if (!result.ok) {
      setError(result.message ?? 'That did not work.')
      return
    }

    toast.success(result.message ?? (kind === 'delete' ? 'Account deleted.' : 'Account anonymised.'))
    setTyped('')
    if (kind === 'delete') {
      // Straight back to the list — this page no longer has anything to show.
      router.push('/admin/members')
    }
    router.refresh()
  }

  if (isSelf || isAdmin || anonymised) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="flex items-center gap-2 text-ui-lg font-bold text-slate-900">
          <AlertTriangle size={18} className="shrink-0 text-slate-400" aria-hidden="true" />
          Delete or anonymise
        </h2>
        <p className="mt-2 text-ui-sm text-slate-500">
          {anonymised
            ? 'This account has already been anonymised. Nothing here identifies a person any more.'
            : isSelf
              ? 'This is your own account. Another admin has to remove it.'
              : `${name} is an admin. Remove their admin role above first — removing an operator is deliberately two steps.`}
        </p>
      </section>
    )
  }

  const deleteConsequences = [
    reviewCount > 0
      ? `${plural(reviewCount, 'review')} deleted — the rating on every listing they reviewed will change.`
      : 'They have written no reviews.',
    postCount + commentCount > 0
      ? `${plural(postCount, 'community post')} and ${plural(commentCount, 'comment')} deleted.`
      : 'They have posted nothing in the community.',
    savedCount > 0 ? `${plural(savedCount, 'saved listing')} removed.` : 'They have saved nothing.',
    businessCount > 0
      ? `${plural(businessCount, 'business listing')} kept but left without an owner — nobody will be able to sign in and manage ${businessCount === 1 ? 'it' : 'them'}. Delete ${businessCount === 1 ? 'it' : 'them'} separately on the Businesses page if that is what you want.`
      : 'They own no business listings.',
  ]

  return (
    <section className="rounded-xl border-[1.5px] border-red-200 bg-red-50/50 p-6">
      <h2 className="flex items-center gap-2 text-ui-lg font-bold text-red-900">
        <AlertTriangle size={18} className="shrink-0 text-red-600" aria-hidden="true" />
        Delete or anonymise this account
      </h2>

      <p className="mt-2 text-ui-sm text-red-900/80">Both are permanent. There is no undo from here.</p>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-red-200 bg-white/70 p-4">
          <h3 className="flex items-center gap-1.5 font-semibold text-red-900">
            <EyeOff size={15} aria-hidden="true" />
            Anonymise
          </h3>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-ui-sm text-red-900/80">
            <li>Name becomes “Deleted member”; email, picture, city and vehicle are removed.</li>
            <li>The password is replaced and every session ends — nobody can sign in again.</li>
            <li>Posts, comments and reviews stay, credited to “Deleted member”.</li>
            {membershipCount > 0 ? <li>{plural(membershipCount, 'membership record')} kept.</li> : null}
          </ul>
        </div>

        <div className={cn('rounded-lg border bg-white/70 p-4', canDelete ? 'border-red-200' : 'border-slate-200')}>
          <h3 className={cn('flex items-center gap-1.5 font-semibold', canDelete ? 'text-red-900' : 'text-slate-500')}>
            <Trash2 size={15} aria-hidden="true" />
            Delete
          </h3>
          {canDelete ? (
            <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-ui-sm text-red-900/80">
              {deleteConsequences.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-ui-sm text-slate-600">
              Not available: this account has {plural(membershipCount, 'membership record')}, which would be deleted
              with it. Anonymise instead — it keeps the payment record and removes the person.
            </p>
          )}
        </div>
      </div>

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

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void run('anonymise')}
          disabled={!confirmed || busy !== null}
          className={cn(
            'inline-flex h-11 items-center gap-2 rounded-xl border-[1.5px] px-5 text-ui font-semibold transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400',
            confirmed && busy === null
              ? 'border-red-600 bg-white text-red-700 hover:bg-red-50'
              : 'cursor-not-allowed border-red-200 bg-white text-red-300',
          )}
        >
          {busy === 'anonymise' ? (
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          ) : (
            <EyeOff size={16} aria-hidden="true" />
          )}
          {busy === 'anonymise' ? 'Anonymising' : 'Anonymise account'}
        </button>

        {canDelete ? (
          <button
            type="button"
            onClick={() => void run('delete')}
            disabled={!confirmed || busy !== null}
            className={cn(
              'inline-flex h-11 items-center gap-2 rounded-xl px-5 text-ui font-semibold transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400',
              confirmed && busy === null
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'cursor-not-allowed bg-red-200 text-red-500',
            )}
          >
            {busy === 'delete' ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 size={16} aria-hidden="true" />
            )}
            {busy === 'delete' ? 'Deleting' : 'Delete account'}
          </button>
        ) : null}
      </div>
    </section>
  )
}
