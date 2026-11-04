// src/components/admin/DeleteButton.tsx
'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'

import { cn } from '@/lib/utils'

import { AdmIcon } from './admin-icons'
import { useAdminToast } from './AdminToast'
import { runAction } from './run-action'

export interface DeleteButtonProps {
  /** Server action bound to the record's id by the caller. */
  action: () => Promise<{ ok: boolean; message?: string }>
  /** Named in the confirmation, so nobody deletes the wrong row. */
  label: string
  /**
   * What goes with the record — "its 3 connectors and 12 reviews". Several
   * deletes cascade in the schema, and a confirmation that does not say so is
   * confirming the wrong question.
   */
  consequence?: string
  className?: string
  /**
   * `icon` — the design's trash icon button (`.acts .del` / `.ib`).
   * `button` — a line button with a word, as on a member card ("Remove").
   */
  variant?: 'icon' | 'button'
  /** The word on the `button` variant and on the dialog's confirm. Default "Delete". */
  verb?: string
}

/**
 * Delete, confirmed in the design's dialog (`.dlg`): "Delete this …?", what
 * goes with it, "This can't be undone.", Cancel or the ember confirm.
 *
 * A native <dialog>: focus moves into it, Escape and the backdrop cancel, and
 * it cannot be suppressed the way window.confirm can. Every outcome is
 * reported — a failure stays in the dialog with its message and as a toast; a
 * success closes it, says so, and refreshes the page.
 */
export function DeleteButton({ action, label, consequence, className, variant = 'icon', verb = 'Delete' }: DeleteButtonProps) {
  const router = useRouter()
  const toast = useAdminToast()
  const dialogRef = React.useRef<HTMLDialogElement>(null)
  const [isPending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)
  const titleId = React.useId()

  const open = () => {
    setError(null)
    const dialog = dialogRef.current
    if (dialog?.showModal) dialog.showModal()
    else if (window.confirm(`${verb} ${label}?`)) confirm()
  }

  const close = () => dialogRef.current?.close()

  const confirm = () => {
    setError(null)
    startTransition(async () => {
      const result = await runAction(action)
      if (!result.ok) {
        const message = result.message ?? `Could not ${verb.toLowerCase()}.`
        setError(message)
        toast.error(message)
        return
      }
      close()
      toast.success(result.message ?? `${verb === 'Delete' ? 'Deleted' : `${verb}d`} ${label}.`)
      router.refresh()
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        disabled={isPending}
        aria-label={variant === 'icon' ? `${verb} ${label}` : undefined}
        aria-haspopup="dialog"
        className={cn(variant === 'icon' ? 'ib del' : 'btn btn--line btn--sm del', className)}
      >
        <AdmIcon name={isPending ? 'loader' : 'trash'} className={isPending ? 'spin' : undefined} />
        {variant === 'button' ? verb : null}
      </button>

      <dialog
        ref={dialogRef}
        className="dlg"
        aria-labelledby={titleId}
        data-lenis-prevent
        onClick={(event) => {
          // A click on the backdrop lands on the dialog itself.
          if (event.target === event.currentTarget && !isPending) close()
        }}
      >
        <h2 id={titleId}>
          {verb} {label}?
        </h2>
        <p>
          {consequence ? `This also removes ${consequence}. ` : ''}This can&apos;t be undone.
        </p>
        {error ? (
          <p className="ferr" role="alert">
            {error}
          </p>
        ) : null}
        <div className="dlg__btns">
          <button className="btn btn--line" type="button" onClick={close} disabled={isPending}>
            Cancel
          </button>
          <button className="btn btn--danger" type="button" onClick={confirm} disabled={isPending}>
            {isPending ? <AdmIcon name="loader" className="spin" /> : null}
            {verb}
          </button>
        </div>
      </dialog>
    </>
  )
}
