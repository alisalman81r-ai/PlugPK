// src/components/auth/CopyEmailButton.tsx
'use client'

import * as React from 'react'

import { Button } from '@/components/ui'
import { Check, Copy } from '@/components/ui/icons'

/**
 * Copies an address to the clipboard.
 *
 * Beside the mailto link because a mailto does nothing at all on a machine
 * with no mail client configured — most shared and work computers, and plenty
 * of phones where people use webmail. Copying the address works everywhere.
 *
 * Falls back to selecting a hidden field when the async clipboard is not
 * available (an http origin, an old browser), and says so if even that fails,
 * rather than claiming a copy that did not happen.
 */
export function CopyEmailButton({ email }: { email: string }) {
  const [state, setState] = React.useState<'idle' | 'copied' | 'failed'>('idle')

  React.useEffect(() => {
    if (state === 'idle') return
    const timer = window.setTimeout(() => setState('idle'), 2500)
    return () => window.clearTimeout(timer)
  }, [state])

  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(email)
      } else {
        const field = document.createElement('textarea')
        field.value = email
        field.setAttribute('readonly', '')
        field.style.position = 'fixed'
        field.style.opacity = '0'
        document.body.appendChild(field)
        field.select()
        const ok = document.execCommand('copy')
        document.body.removeChild(field)
        if (!ok) throw new Error('copy refused')
      }
      setState('copied')
    } catch {
      setState('failed')
    }
  }

  return (
    <>
      <Button
        variant="secondary"
        size="lg"
        fullWidth
        onClick={copy}
        leftIcon={state === 'copied' ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
      >
        {state === 'copied' ? 'Address copied' : 'Copy the address'}
      </Button>
      <p role="status" aria-live="polite" className="mt-2 min-h-[1.125rem] text-center text-ui-xs text-slate-500">
        {state === 'copied'
          ? `${email} is on your clipboard — paste it into your email app.`
          : state === 'failed'
            ? `Copying was blocked by the browser. The address is ${email}.`
            : ''}
      </p>
    </>
  )
}
