// src/components/admin/AdminBackButton.tsx
'use client'

import { useRouter } from 'next/navigation'

import { AdmIcon } from './admin-icons'

/**
 * The design's `.backbtn`. Steps back through history when there is some, so a
 * filtered list is returned to as it was left; otherwise goes to the parent.
 */
export function AdminBackButton({ fallbackHref, label = 'Back' }: { fallbackHref: string; label?: string }) {
  const router = useRouter()
  return (
    <a
      className="backbtn"
      href={fallbackHref}
      aria-label={label}
      title={label}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
        event.preventDefault()
        if (window.history.length > 1) router.back()
        else router.push(fallbackHref)
      }}
    >
      <AdmIcon name="back" />
    </a>
  )
}
