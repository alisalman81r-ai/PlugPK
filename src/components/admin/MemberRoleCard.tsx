// src/components/admin/MemberRoleCard.tsx
'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'

import { setMemberAdmin } from '@/lib/db/member-actions'

import { useAdminToast } from './AdminToast'
import { Ico, Spinner, k, rise, s } from './people/kit'
import { runAction } from './run-action'

/**
 * Grant or revoke access to this portal.
 *
 * Until now the flag could only be set from the command line and was not
 * shown anywhere, so nobody in the portal could see who held it. The same two
 * rules the server enforces are explained here before the click: nobody
 * changes their own role, and the last admin cannot be removed.
 */
export function MemberRoleCard({
  id,
  name,
  isAdmin,
  isSelf,
  adminCount,
  anonymised,
}: {
  id: string
  name: string
  isAdmin: boolean
  isSelf: boolean
  adminCount: number
  anonymised: boolean
}) {
  const router = useRouter()
  const toast = useAdminToast()
  const [confirming, setConfirming] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)

  const blocked = isSelf
    ? 'This is your own account. Another admin has to change your role.'
    : anonymised
      ? 'An anonymised account cannot be given a role.'
      : isAdmin && adminCount <= 1
        ? 'This is the only admin. Make someone else an admin before removing this one.'
        : null

  const apply = () => {
    setError(null)
    startTransition(async () => {
      const result = await runAction(() => setMemberAdmin(id, !isAdmin))
      if (!result.ok) {
        setError(result.message ?? 'Could not change the role.')
        return
      }
      setConfirming(false)
      toast.success(result.message ?? 'Role updated.')
      router.refresh()
    })
  }

  const r = rise(2)

  return (
    <section className={k('card', 'panel', r.className)} style={r.style}>
      <h2>
        <Ico n={isAdmin ? 'shield' : 'user'} />
        Role
      </h2>
      <p>
        {isAdmin
          ? `${name} is an admin and can use this portal, including everything on this page.`
          : `${name} is a member. Admins can use this portal and change any record in it.`}
      </p>

      {blocked ? (
        <p className={s.box}>{blocked}</p>
      ) : confirming ? (
        <div className={k('box', 'box--warn')}>
          <b>
            {isAdmin
              ? `Remove admin from ${name}? They are signed out everywhere straight away.`
              : `Make ${name} an admin? They will be able to edit, approve and delete anything in the portal.`}
          </b>
          <div className={s.panel__acts} style={{ marginTop: 12 }}>
            <button type="button" onClick={apply} disabled={isPending} className={k('btn', 'btn--ink', 'btn--sm')}>
              {isPending ? <Spinner /> : <Ico n="check" />}
              {isAdmin ? 'Yes, remove admin' : 'Yes, make admin'}
            </button>
            <button type="button" onClick={() => setConfirming(false)} disabled={isPending} className={k('btn', 'btn--line', 'btn--sm')}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className={s.panel__acts}>
          <button type="button" onClick={() => setConfirming(true)} className={k('btn', 'btn--line', 'btn--sm')}>
            <Ico n={isAdmin ? 'shieldOff' : 'shield'} />
            {isAdmin ? 'Remove admin role' : 'Make admin'}
          </button>
        </div>
      )}

      {error ? (
        <p role="alert" className={s.ferr} style={{ marginTop: 10 }}>
          {error}
        </p>
      ) : null}
    </section>
  )
}
