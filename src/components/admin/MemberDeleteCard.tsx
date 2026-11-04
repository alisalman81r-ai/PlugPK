// src/components/admin/MemberDeleteCard.tsx
'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'

import { anonymiseMember, deleteMember } from '@/lib/db/member-actions'

import { useAdminToast } from './AdminToast'
import { Ico, Spinner, k, rise, s } from './people/kit'
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

  const r = rise(1)

  if (isSelf || isAdmin || anonymised) {
    return (
      <section className={k('card', 'panel', r.className)} style={r.style}>
        <h2>
          <Ico n="alert" />
          Delete or anonymise
        </h2>
        <p>
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
    <section className={k('card', 'panel', 'danger', r.className)} style={r.style}>
      <h2>
        <Ico n="alert" />
        Delete or anonymise this account
      </h2>
      <p>Both are permanent. There is no undo from here.</p>

      <div className={s.split2}>
        <div className={s.opt}>
          <h3>
            <Ico n="eyeOff" />
            Anonymise
          </h3>
          <ul>
            <li>Name becomes “Deleted member”; email, picture, city and vehicle are removed.</li>
            <li>The password is replaced and every session ends — nobody can sign in again.</li>
            <li>Posts, comments and reviews stay, credited to “Deleted member”.</li>
            {membershipCount > 0 ? <li>{plural(membershipCount, 'membership record')} kept.</li> : null}
          </ul>
        </div>

        <div className={k('opt', !canDelete && 'off')}>
          <h3>
            <Ico n="trash" />
            Delete
          </h3>
          {canDelete ? (
            <ul>
              {deleteConsequences.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : (
            <p>
              Not available: this account has {plural(membershipCount, 'membership record')}, which would be deleted
              with it. Anonymise instead — it keeps the payment record and removes the person.
            </p>
          )}
        </div>
      </div>

      <div className={s.fld} style={{ marginTop: 18, maxWidth: 460 }}>
        <label htmlFor="confirm-name">
          <span>
            Type <b className={s.mono}>{name}</b> to confirm
          </span>
        </label>
        <input
          id="confirm-name"
          type="text"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          placeholder={name}
          className={s.in}
        />
      </div>

      {error ? (
        <p role="alert" className={s.ferr} style={{ marginTop: 12 }}>
          {error}
        </p>
      ) : null}

      <div className={s.panel__acts}>
        <button type="button" onClick={() => void run('anonymise')} disabled={!confirmed || busy !== null} className={k('btn', 'btn--line', 'del')}>
          {busy === 'anonymise' ? <Spinner /> : <Ico n="eyeOff" />}
          {busy === 'anonymise' ? 'Anonymising' : 'Anonymise account'}
        </button>
        {canDelete ? (
          <button type="button" onClick={() => void run('delete')} disabled={!confirmed || busy !== null} className={k('btn', 'btn--danger')}>
            {busy === 'delete' ? <Spinner /> : <Ico n="trash" />}
            {busy === 'delete' ? 'Deleting' : 'Delete account'}
          </button>
        ) : null}
      </div>
    </section>
  )
}
