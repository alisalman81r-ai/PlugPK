// src/components/admin/AdminToast.tsx
'use client'

import { AlertTriangle, CheckCircle2, X } from '@/components/ui/icons'
import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * A small confirmation that something happened.
 *
 * The portal had no feedback for a successful write at all: approve a
 * business and the row quietly re-rendered, delete a post and it simply was
 * not there. That is fine when you are watching the row and alarming when you
 * are not — "did it save?" is answered by doing it again, which is how things
 * get done twice.
 *
 * Deliberately small: one provider in the admin shell, a hook, and a stack in
 * the corner that clears itself. Errors stay longer than successes, because
 * an error is the one worth reading.
 */

type Tone = 'success' | 'error'

interface Toast {
  id: number
  tone: Tone
  message: string
}

interface ToastApi {
  success: (message: string) => void
  error: (message: string) => void
}

// A no-op default, so a control rendered outside the shell (a test, a story)
// still works rather than throwing on a missing provider.
const ToastContext = React.createContext<ToastApi>({ success: () => {}, error: () => {} })

export function useAdminToast(): ToastApi {
  return React.useContext(ToastContext)
}

export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])
  const nextId = React.useRef(0)

  const dismiss = React.useCallback((id: number) => {
    setToasts((list) => list.filter((toast) => toast.id !== id))
  }, [])

  const push = React.useCallback(
    (tone: Tone, message: string) => {
      const id = ++nextId.current
      // Three at most: a burst of saves should not wallpaper the screen.
      setToasts((list) => [...list.slice(-2), { id, tone, message }])
      setTimeout(() => dismiss(id), tone === 'error' ? 8000 : 3500)
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
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border px-4 py-3 text-ui-sm shadow-[0_12px_32px_-12px_rgba(5,36,30,0.3)]',
              toast.tone === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-red-200 bg-red-50 text-red-900',
            )}
          >
            {toast.tone === 'success' ? (
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
            ) : (
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-600" aria-hidden="true" />
            )}
            <p className="min-w-0 flex-1 leading-snug">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss"
              className="-mr-1 shrink-0 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
