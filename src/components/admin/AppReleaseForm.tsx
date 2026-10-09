// src/components/admin/AppReleaseForm.tsx
'use client'

import { Loader2, Send } from '@/components/ui/icons'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { cn } from '@/lib/utils'

import { useAdminToast } from './AdminToast'
import { runAction } from './run-action'

type Result = { ok: boolean; message?: string }

export interface AppReleaseFormProps {
  /** New updates offer "send now"; editing keeps the update's sent state. */
  mode: 'create' | 'edit'
  initial?: { version: string; title: string; notes: string }
  action: (form: FormData) => Promise<Result>
  onDone?: () => void
}

const field =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-ui-sm text-slate-900 placeholder:text-slate-400 focus:border-plug-blue-500 focus:outline-none focus:ring-2 focus:ring-plug-blue-500/20'

/** Writes an app update: version, headline and the note users read. */
export function AppReleaseForm({ mode, initial, action, onDone }: AppReleaseFormProps) {
  const router = useRouter()
  const toast = useAdminToast()
  const formRef = React.useRef<HTMLFormElement>(null)
  const [pending, setPending] = React.useState<'draft' | 'now' | 'save' | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const submit = async (intent: 'draft' | 'now' | 'save') => {
    const form = formRef.current
    if (!form) return
    if (!form.reportValidity()) return
    const data = new FormData(form)
    if (intent === 'now') data.set('send', 'now')
    setError(null)
    setPending(intent)
    const result = await runAction(() => action(data))
    setPending(null)
    if (!result.ok) {
      setError(result.message ?? 'Could not save.')
      return
    }
    toast.success(result.message ?? 'Saved.')
    if (mode === 'create') form.reset()
    onDone?.()
    router.refresh()
  }

  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault()
        submit(mode === 'create' ? 'draft' : 'save')
      }}
      className="flex flex-col gap-4"
    >
      <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
        <label className="flex flex-col gap-1.5">
          <span className="text-ui-xs font-semibold text-slate-700">Version</span>
          <input name="version" required maxLength={20} defaultValue={initial?.version} placeholder="1.4" className={field} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-ui-xs font-semibold text-slate-700">Headline</span>
          <input
            name="title"
            required
            maxLength={120}
            defaultValue={initial?.title}
            placeholder="Detailed 3D map and profile photos"
            className={field}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-ui-xs font-semibold text-slate-700">What changed (users read this)</span>
        <textarea
          name="notes"
          required
          maxLength={2000}
          rows={5}
          defaultValue={initial?.notes}
          placeholder={'• The map now shows shops, road names and 3D buildings\n• Add a profile photo from Profile\n• Tap a station card to fly to it'}
          className={cn(field, 'resize-y leading-relaxed')}
        />
      </label>

      {error ? <p className="text-ui-sm font-medium text-red-700">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        {mode === 'create' ? (
          <>
            <button
              type="button"
              onClick={() => submit('now')}
              disabled={pending !== null}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-plug-blue-600 px-4 text-ui-sm font-semibold text-white transition-colors hover:bg-plug-blue-700 disabled:opacity-60"
            >
              {pending === 'now' ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Send size={15} aria-hidden="true" />}
              Send to users
            </button>
            <button
              type="submit"
              disabled={pending !== null}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-ui-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
            >
              {pending === 'draft' ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null}
              Save as draft
            </button>
          </>
        ) : (
          <>
            <button
              type="submit"
              disabled={pending !== null}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-plug-blue-600 px-4 text-ui-sm font-semibold text-white transition-colors hover:bg-plug-blue-700 disabled:opacity-60"
            >
              {pending === 'save' ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null}
              Save changes
            </button>
            {onDone ? (
              <button
                type="button"
                onClick={onDone}
                className="inline-flex h-10 items-center rounded-xl px-3 text-ui-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
            ) : null}
          </>
        )}
      </div>
    </form>
  )
}

/** One update in the log, with Edit (inline), Send and the delete button beside it. */
export function AppReleaseRow({
  release,
  update,
  send,
  children,
}: {
  release: { version: string; title: string; notes: string; sentAt: string | null }
  update: (form: FormData) => Promise<Result>
  send: () => Promise<Result>
  /** The delete control, rendered by the server page. */
  children?: React.ReactNode
}) {
  const router = useRouter()
  const toast = useAdminToast()
  const [editing, setEditing] = React.useState(false)
  const [sending, setSending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  if (editing) {
    return <AppReleaseForm mode="edit" initial={release} action={update} onDone={() => setEditing(false)} />
  }

  return (
    <div className="flex flex-wrap items-start gap-2">
      {!release.sentAt ? (
        <button
          type="button"
          disabled={sending}
          onClick={async () => {
            setError(null)
            setSending(true)
            const result = await runAction(send)
            setSending(false)
            if (!result.ok) return setError(result.message ?? 'Could not send.')
            toast.success(result.message ?? 'Sent.')
            router.refresh()
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-plug-blue-600 px-3 text-ui-sm font-semibold text-white transition-colors hover:bg-plug-blue-700 disabled:opacity-60"
        >
          {sending ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Send size={14} aria-hidden="true" />}
          Send to users
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-ui-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
      >
        Edit
      </button>
      {children}
      {error ? <p className="w-full text-ui-xs font-medium text-red-700">{error}</p> : null}
    </div>
  )
}
