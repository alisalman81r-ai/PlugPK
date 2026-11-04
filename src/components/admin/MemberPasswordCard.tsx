// src/components/admin/MemberPasswordCard.tsx
'use client'

import * as React from 'react'

import { setTemporaryPassword } from '@/lib/db/member-actions'

import { Ico, Spinner, k, rise, s } from './people/kit'

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

  const r = rise(3)

  return (
    <section className={k('card', 'panel', r.className)} style={r.style}>
      <h2>
        <Ico n="lock" />
        Password
      </h2>
      <p>
        For a member who is locked out and has written in from <b style={{ color: '#0B0C0E' }}>{email}</b>. Their current
        password stops working, every device they are signed in on is signed out, and they must choose a new password
        the next time they sign in.
      </p>

      {isSelf || isAdmin ? (
        <p className={s.box}>
          {isSelf
            ? 'This is your account — change your password under Settings → Password.'
            : `${name} is an admin. Ask them to change it under Settings → Password, or reset it with the server CLI.`}
        </p>
      ) : password ? (
        <div className={k('box', 'box--ok')}>
          <b>Temporary password for {name}</b>
          <div className={s.panel__acts} style={{ marginTop: 10, alignItems: 'center' }}>
            <code className={s.code}>{password}</code>
            <button type="button" onClick={() => void copy()} className={k('btn', 'btn--line', 'btn--sm')}>
              <Ico n={copied ? 'check' : 'copy'} />
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p style={{ margin: '10px 0 0', fontSize: 13 }}>
            Shown only now. Send it to {email}; they will be asked to replace it when they sign in.
          </p>
        </div>
      ) : confirming ? (
        <div className={s.panel__acts}>
          <button type="button" onClick={() => void generate()} disabled={busy} className={k('btn', 'btn--ink', 'btn--sm')}>
            {busy ? <Spinner /> : <Ico n="lock" />}
            Yes, set a new password
          </button>
          <button type="button" onClick={() => setConfirming(false)} disabled={busy} className={k('btn', 'btn--line', 'btn--sm')}>
            Cancel
          </button>
        </div>
      ) : (
        <div className={s.panel__acts}>
          <button type="button" onClick={() => setConfirming(true)} className={k('btn', 'btn--line', 'btn--sm')}>
            <Ico n="lock" />
            Set a temporary password
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
