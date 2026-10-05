// src/components/admin/useUnsavedChanges.ts
'use client'

import * as React from 'react'

const MESSAGE = 'You have unsaved changes on this form. Leave and lose them?'

/**
 * Warns before an operator walks away from a half-filled form.
 *
 * The station, car, business, service and connector forms are long, and every
 * one of them sits beside a sidebar of links. One stray click on "Members"
 * used to throw away ten minutes of typing without a word.
 *
 * Three exits are covered:
 *
 * - closing or reloading the tab, through `beforeunload` (the browser shows
 *   its own wording; the string here is ignored by modern browsers);
 * - clicking any in-app link, caught in the capture phase before Next's Link
 *   handles it — the App Router has no navigation-blocking API, so this is the
 *   reliable seam;
 * - the form's own Cancel button, which calls `confirmLeave()`.
 *
 * Dirty means "an input in this form changed since load or since the last
 * save". It does not diff values: typing a letter and deleting it still counts,
 * which errs on the side of asking.
 */
export function useUnsavedChanges(formRef: React.RefObject<HTMLFormElement>) {
  const [dirty, setDirty] = React.useState(false)
  const dirtyRef = React.useRef(false)

  const markClean = React.useCallback(() => {
    dirtyRef.current = false
    setDirty(false)
  }, [])

  /** For changes held in React state rather than in an input, e.g. a map pin. */
  const markDirty = React.useCallback(() => {
    if (dirtyRef.current) return
    dirtyRef.current = true
    setDirty(true)
  }, [])

  React.useEffect(() => {
    const form = formRef.current
    if (!form) return
    const onChange = markDirty
    form.addEventListener('input', onChange)
    form.addEventListener('change', onChange)
    return () => {
      form.removeEventListener('input', onChange)
      form.removeEventListener('change', onChange)
    }
  }, [formRef, markDirty])

  React.useEffect(() => {
    if (!dirty) return

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = MESSAGE
      return MESSAGE
    }

    const onClick = (event: MouseEvent) => {
      if (!dirtyRef.current || event.defaultPrevented || event.button !== 0) return
      // A modified click opens a new tab and leaves this one where it is.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return
      const url = new URL(anchor.href, window.location.href)
      if (url.origin !== window.location.origin) return
      if (url.pathname === window.location.pathname && url.search === window.location.search) return

      if (!window.confirm(MESSAGE)) {
        event.preventDefault()
        event.stopPropagation()
      } else {
        markClean()
      }
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('click', onClick, true)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('click', onClick, true)
    }
  }, [dirty, markClean])

  /** For buttons that navigate in code. True means go ahead. */
  const confirmLeave = React.useCallback(() => {
    if (!dirtyRef.current) return true
    const ok = window.confirm(MESSAGE)
    if (ok) markClean()
    return ok
  }, [markClean])

  return { dirty, markClean, markDirty, confirmLeave }
}
