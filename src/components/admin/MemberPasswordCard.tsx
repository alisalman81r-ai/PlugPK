// src/components/admin/MemberPasswordCard.tsx
'use client'

import * as React from 'react'

import { Check, Copy, Lock, Loader2 } from '@/components/ui/icons'
import { setTemporaryPassword } from '@/lib/db/member-actions'

/**
 * Reset a member's password by hand, for someone who has written in from the
 * address on their account. The new password is shown here once and is not
 * stored anywhere in readable form; the member is made to choose a new one on
 * their next sign-in, and every session they had open ends — a locked-out
 * account is often one somebody else is using.
 *
 * Not offered for admins or for yourself; the server refuses both too. One
 * operator resetting another's password would be a way to take over their
 * account.
 */
export function MemberPasswordCard({
  id,
  name,
  email,
  isAdmin = false,
  isSelf = false,
}: {
  id: string
  name: string
  email: string
  isAdmin?: boolean
  isSelf?: boolean
}) {
  const [confirming, setConfirming] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [password, setPassword] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const generate = async () => {
    setBusy(true)
    setError(null)
    const result = await setTemporaryPassword(id).catch(() => ({
      ok: false as const,
      message: 'That did not reach the server. Reload the page and try again.',
      password: undefined,
    }))
    setBusy(false)
    setConfirming(false)
    if (!result?.ok || !result.password) {
      setError(result?.message ?? 'Could not set a new password.')
      return
    }
    setPassword(result.password)
  }

  const copy = async () => {
    if (!password) return
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked: the password is on screen to copy by hand.
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
        <Lock size={18} className="text-slate-500" aria-hidden="true" />
        Password
      </h2>
      <p className="mt-1 text-ui-sm text-slate-500">
        For a member who is locked out and has written in from <span className="font-medium text-slate-700">{email}</span>.
        Their current password stops working, every device they are signed in on is signed out, and they
        must choose a new password the next time they sign in.
      </p>

      {isSelf || isAdmin ? (
        <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-ui-sm text-slate-600">
          {isSelf
            ? 'This is your account — change your password under Settings → Password.'
            : `${name} is an admin. Ask them to change it under Settings → Password, or reset it with the server CLI.`}
        </p>
      ) : password ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-ui-sm font-semibold text-emerald-900">Temporary password for {name}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="rounded-lg bg-white px-3 py-2 font-mono text-base tracking-wider text-slate-900 ring-1 ring-emerald-200">
              {password}
            </code>
            <button
              type="button"
              onClick={() => void copy()}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3 text-ui-sm font-semibold text-emerald-800 hover:bg-emerald-100"
            >
              {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="mt-3 text-ui-xs text-emerald-800">
            Shown only now. Send it to {email}; they will be asked to replace it when they sign in.
          </p>
        </div>
      ) : confirming ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void generate()}
            disabled={busy}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-plug-blue-600 px-4 text-ui-sm font-semibold text-white hover:bg-plug-blue-700 disabled:opacity-60"
          >
            {busy ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null}
            Yes, set a new password
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={busy}
            className="inline-flex h-10 items-center rounded-xl border border-slate-200 px-4 text-ui-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-4 text-ui-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Lock size={15} aria-hidden="true" />
          Set a temporary password
        </button>
      )}

      {error ? <p role="alert" className="mt-3 text-ui-sm text-red-600">{error}</p> : null}
    </section>
  )
}
