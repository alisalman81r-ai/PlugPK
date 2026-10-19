// src/components/auth/ConfirmEmailButton.tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { Button } from '@/components/ui'
import { ArrowRight } from '@/components/ui/icons'
import { confirmEmail } from '@/lib/db/auth-actions'

export function ConfirmEmailButton({ tokenHash, type }: { tokenHash: string; type: string }) {
  const router = useRouter()
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const confirm = async () => {
    setBusy(true)
    setError(null)
    let result: Awaited<ReturnType<typeof confirmEmail>>
    try {
      result = await confirmEmail(tokenHash, type)
    } catch {
      result = { ok: false, message: 'We could not reach the server. Check your connection and try again.' }
    }
    if (result.redirectTo) {
      router.push(result.redirectTo)
      router.refresh()
      return
    }
    setBusy(false)
    setError(result.message ?? 'That did not work. Please try again.')
  }

  return (
    <>
      {error ? (
        <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}{' '}
          <Link href="/login" className="font-semibold text-plug-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      ) : null}
      <Button type="button" size="lg" fullWidth isLoading={busy} onClick={confirm} className="group/submit">
        Confirm my email
        <ArrowRight size={18} aria-hidden="true" />
      </Button>
    </>
  )
}
