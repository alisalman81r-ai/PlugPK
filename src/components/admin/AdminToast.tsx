// src/components/admin/AdminToast.tsx
'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

import { AdmIcon } from './admin-icons'

/**
 * A small confirmation that something happened — the design's `.toast`: an ink
 * pill at the bottom centre with a volt tick, rising in and fading out.
 *
 * One provider in the admin shell, a hook, and a short stack that clears
 * itself. Errors carry an ember mark and stay longer than successes, because
 * an error is the one worth reading; each can be dismissed.
 */

type Tone = 'success' | 'error'

interface Toast {
  id: number
  tone: Tone
  message: string
  leaving?: boolean
}

interface ToastApi {
  success: (message: string) => void
  error: (message: string) => void
}

// A no-op default, so a control rendered outside the shell still works.
const ToastContext = React.createContext<ToastApi>({ success: () => {}, error: () => {} })

export function useAdminToast(): ToastApi {
  return React.useContext(ToastContext)
}

export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])
  const nextId = React.useRef(0)

  const remove = React.useCallback((id: number) => {
    setToasts((list) => list.filter((toast) => toast.id !== id))
  }, [])

  // Fade out first (the design's .3s), then leave the tree.
  const dismiss = React.useCallback(
    (id: number) => {
      setToasts((list) => list.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)))
      setTimeout(() => remove(id), 320)
    },
    [remove],
  )

  const push = React.useCallback(
    (tone: Tone, message: string) => {
      const id = ++nextId.current
      // Three at most: a burst of saves should not wallpaper the screen.
      setToasts((list) => [...list.slice(-2), { id, tone, message }])
      setTimeout(() => dismiss(id), tone === 'error' ? 8000 : 2400)
    },
    [dismiss],
  )

  const api = React.useMemo<ToastApi>(
    () => ({ success: (message) => push('success', message), error: (message) => push('error', message) }),
    [push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            className={cn('toast', !toast.leaving && 'show', toast.tone === 'error' && 'toast--bad')}
          >
            <AdmIcon name={toast.tone === 'error' ? 'alert' : 'okc'} />
            <span>{toast.message}</span>
            <button type="button" className="toast__x" onClick={() => dismiss(toast.id)} aria-label="Dismiss">
              <AdmIcon name="x" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
