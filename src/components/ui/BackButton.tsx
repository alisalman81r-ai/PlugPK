'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface BackButtonProps {
  fallbackHref: string
  label?: string
}

export function BackButton({ fallbackHref, label = 'Back' }: BackButtonProps) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back()
        else router.push(fallbackHref)
      }}
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-plug-blue-300 hover:bg-plug-blue-50 hover:text-plug-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
    >
      <ArrowLeft size={17} aria-hidden="true" />
    </button>
  )
}
