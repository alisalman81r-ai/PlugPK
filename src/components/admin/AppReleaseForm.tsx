// src/components/admin/AppReleaseForm.tsx
'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'

import { cn } from '@/lib/utils'

import { AdmIcon } from './admin-icons'
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

const NOTES_MAX = 2000

/**
 * Writes an app update — the design's form (app-updates.html): Version and
 * Headline side by side, "What changed" under them with a live count, errors
 * under each field in words, and "Send to users" confirmed in a dialog before
 * anything reaches anyone.
 */
export function AppReleaseForm({ mode, initial, action, onDone }: AppReleaseFormProps) {
  const router = useRouter()
  const toast = useAdminToast()
  const formRef = React.useRef<HTMLFormElement>(null)
  const dialogRef = React.useRef<HTMLDialogElement>(null)
  const [pending, setPending] = React.useState<'draft' | 'now' | 'save' | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [bad, setBad] = React.useState<Record<string, string>>({})
  const [count, setCount] = React.useState(initial?.notes.length ?? 0)
  const [version, setVersion] = React.useState('')
  const id = React.useId()

  /** The design's checks, in its words; focuses the first field that fails. */
  const validate = (): boolean => {
    const form = formRef.current
    if (!form) return false
    const checks: [string, string][] = [
      ['version', 'Add a version number.'],
      ['title', 'Add a headline.'],
      ['notes', 'Say what changed.'],
    ]
    const next: Record<string, string> = {}
    let first: HTMLInputElement | HTMLTextAreaElement | null = null
    for (const [name, message] of checks) {
      const el = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null
      if (el && !el.value.trim()) {
        next[name] = message
        first ??= el
      }
    }
    setBad(next)
    first?.focus()
    return !first
  }

  const submit = async (intent: 'draft' | 'now' | 'save') => {
    const form = formRef.current
    if (!form) return
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
    if (mode === 'create') {
      form.reset()
      setCount(0)
      setBad({})
    }
    onDone?.()
    router.refresh()
  }

  const askSend = () => {
    if (!validate()) return
    const form = formRef.current
    setVersion(((form?.elements.namedItem('version') as HTMLInputElement | null)?.value ?? '').trim())
    const dialog = dialogRef.current
    if (dialog?.showModal) dialog.showModal()
    else submit('now')
  }

  const field = (name: string) => cn('fld', bad[name] && 'is-bad')

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        if (!validate()) return
        submit(mode === 'create' ? 'draft' : 'save')
      }}
    >
      <div className="fgrid">
        <div className={field('version')}>
          <label htmlFor={`${id}-v`}>Version</label>
          <input
            id={`${id}-v`}
            name="version"
            className="in mono"
            required
            maxLength={20}
            defaultValue={initial?.version}
            placeholder="1.4"
            aria-invalid={Boolean(bad.version)}
            aria-describedby={`${id}-ve`}
          />
          <p className="ferr" id={`${id}-ve`}>
            {bad.version}
          </p>
        </div>
        <div className={field('title')}>
          <label htmlFor={`${id}-h`}>Headline</label>
          <input
            id={`${id}-h`}
            name="title"
            className="in"
            required
            maxLength={120}
            defaultValue={initial?.title}
            placeholder="Detailed 3D map and profile photos"
            aria-invalid={Boolean(bad.title)}
            aria-describedby={`${id}-he`}
          />
          <p className="ferr" id={`${id}-he`}>
            {bad.title}
          </p>
        </div>
        <div className={cn(field('notes'), 'fld--full')}>
          <label htmlFor={`${id}-n`}>
            What changed <span className="fnote">(users read this)</span>
          </label>
          <textarea
            id={`${id}-n`}
            name="notes"
            className="in"
            required
            maxLength={NOTES_MAX}
            rows={5}
            defaultValue={initial?.notes}
            onChange={(event) => setCount(event.target.value.length)}
            placeholder={'• The map now shows shops, road names and 3D buildings\n• Add a profile photo from Profile\n• Tap a station card to fly to it'}
            aria-invalid={Boolean(bad.notes)}
            aria-describedby={`${id}-ne ${id}-nc`}
          />
          <p className="ferr" id={`${id}-ne`}>
            {bad.notes}
          </p>
          <p className="fcount mono" id={`${id}-nc`}>
            {count} / {NOTES_MAX}
          </p>
        </div>
      </div>

      {error ? (
        <p className="ferr" role="alert" style={{ marginTop: 14 }}>
          {error}
        </p>
      ) : null}

      <div className="formc__acts">
        {mode === 'create' ? (
          <>
            <button className="btn btn--ink" type="button" onClick={askSend} disabled={pending !== null}>
              <AdmIcon name={pending === 'now' ? 'loader' : 'send'} className={pending === 'now' ? 'spin' : undefined} />
              Send to users
            </button>
            <button className="btn btn--line" type="submit" disabled={pending !== null}>
              {pending === 'draft' ? <AdmIcon name="loader" className="spin" /> : null}
              Save as draft
            </button>
          </>
        ) : (
          <>
            <button className="btn btn--ink" type="submit" disabled={pending !== null}>
              {pending === 'save' ? <AdmIcon name="loader" className="spin" /> : <AdmIcon name="check" />}
              Save changes
            </button>
            {onDone ? (
              <button className="btn btn--line" type="button" onClick={onDone}>
                Cancel
              </button>
            ) : null}
          </>
        )}
      </div>

      {mode === 'create' ? (
        <dialog ref={dialogRef} className="dlg" aria-labelledby={`${id}-dt`} data-lenis-prevent>
          <h2 id={`${id}-dt`}>Send version {version} to users?</h2>
          <p>Everyone sees it as &ldquo;What&rsquo;s new&rdquo; the next time they open the app.</p>
          <div className="dlg__btns">
            <button className="btn btn--line" type="button" onClick={() => dialogRef.current?.close()}>
              Cancel
            </button>
            <button
              className="btn btn--ink"
              type="button"
              onClick={() => {
                dialogRef.current?.close()
                submit('now')
              }}
            >
              <AdmIcon name="send" />
              Send to users
            </button>
          </div>
        </dialog>
      ) : null}
    </form>
  )
}

/**
 * One update in the history — the design's `.upd` row: the version tag, the
 * headline and note, when it was written or sent, a Sent / Draft pill, and its
 * controls. Edit opens the form in place of the row; a draft can be sent from
 * here; the delete control is rendered by the server page.
 */
export function AppReleaseRow({
  release,
  update,
  send,
  children,
  meta,
  badge,
}: {
  release: { version: string; title: string; notes: string; sentAt: string | null }
  update: (form: FormData) => Promise<Result>
  send: () => Promise<Result>
  /** The delete control. */
  children?: React.ReactNode
  /** The line under the note ("Sent 2 days ago · by …"). */
  meta?: React.ReactNode
  /** Extra tag beside the pill, e.g. "Showing in the app". */
  badge?: React.ReactNode
}) {
  const router = useRouter()
  const toast = useAdminToast()
  const [editing, setEditing] = React.useState(false)
  const [sending, setSending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  if (editing) {
    return (
      <li className="upd upd--edit">
        <span className="ctag mono">v{release.version}</span>
        <div className="upd__main">
          <b>Edit update</b>
          <AppReleaseForm mode="edit" initial={release} action={update} onDone={() => setEditing(false)} />
        </div>
      </li>
    )
  }

  return (
    <li className={cn('upd', !release.sentAt && 'upd--draft')}>
      <span className="ctag mono">v{release.version}</span>
      <div className="upd__main">
        <b>{release.title}</b>
        <p>{release.notes}</p>
        {meta ? <small>{meta}</small> : null}
        {error ? (
          <p className="ferr" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <span className="upd__tags">
        <span className={cn('pill', release.sentAt ? 'pill--ok' : 'pill--unk')}>
          {release.sentAt ? <AdmIcon name="okc" /> : null}
          {release.sentAt ? 'Sent' : 'Draft'}
        </span>
        {badge}
      </span>
      <div className="acts">
        {!release.sentAt ? (
          <button
            type="button"
            disabled={sending}
            aria-label={`Send ${release.version} to users`}
            title="Send to users"
            onClick={async () => {
              setError(null)
              setSending(true)
              const result = await runAction(send)
              setSending(false)
              if (!result.ok) return setError(result.message ?? 'Could not send.')
              toast.success(result.message ?? 'Sent.')
              router.refresh()
            }}
          >
            <AdmIcon name={sending ? 'loader' : 'send'} className={sending ? 'spin' : undefined} />
          </button>
        ) : null}
        <button type="button" onClick={() => setEditing(true)} aria-label={`Edit ${release.version}`} title="Edit">
          <AdmIcon name="pen" />
        </button>
        {children}
      </div>
    </li>
  )
}
