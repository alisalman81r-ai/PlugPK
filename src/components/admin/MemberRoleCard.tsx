// src/components/admin/MemberRoleCard.tsx
'use client'

import { Loader2, Shield, ShieldCheck } from '@/components/ui/icons'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { setMemberAdmin } from '@/lib/db/member-actions'

import { useAdminToast } from './AdminToast'
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

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="flex items-center gap-2 text-ui-lg font-bold text-slate-900">
        {isAdmin ? (
          <ShieldCheck size={18} className="text-plug-blue-600" aria-hidden="true" />
        ) : (
          <Shield size={18} className="text-slate-400" aria-hidden="true" />
        )}
        Role
      </h2>
      <p className="mt-1 text-ui-sm text-slate-500">
        {isAdmin
          ? `${name} is an admin and can use this portal, including everything on this page.`
          : `${name} is a member. Admins can use this portal and change any record in it.`}
      </p>

      {blocked ? (
        <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-ui-sm text-slate-600">{blocked}</p>
      ) : confirming ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-ui-sm font-semibold text-amber-900">
            {isAdmin
              ? `Remove admin from ${name}? They are signed out everywhere straight away.`
              : `Make ${name} an admin? They will be able to edit, approve and delete anything in the portal.`}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={apply}
              disabled={isPending}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-plug-navy-900 px-4 text-ui-sm font-semibold text-white hover:bg-plug-navy-800 disabled:opacity-60"
            >
              {isPending ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null}
              {isAdmin ? 'Yes, remove admin' : 'Yes, make admin'}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={isPending}
              className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-ui-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-4 text-ui-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          {isAdmin ? <Shield size={15} aria-hidden="true" /> : <ShieldCheck size={15} aria-hidden="true" />}
          {isAdmin ? 'Remove admin role' : 'Make admin'}
        </button>
      )}

      {error ? (
        <p role="alert" className="mt-3 text-ui-sm text-red-600">
          {error}
        </p>
      ) : null}
    </section>
  )
}
