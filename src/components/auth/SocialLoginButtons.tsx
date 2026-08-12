// src/components/auth/SocialLoginButtons.tsx
'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

export interface SocialLoginButtonsProps {
  mode: 'signup' | 'login'
  className?: string
}

/** Google's brand mark, inlined so it needs no network request. */
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  )
}

export function SocialLoginButtons({ mode, className }: SocialLoginButtonsProps) {
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false)

  const handleGoogle = async () => {
    setIsGoogleLoading(true)
    // Stands in for the OAuth redirect until auth is wired up.
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsGoogleLoading(false)
  }

  return (
    <button
      type="button"
      onClick={handleGoogle}
      disabled={isGoogleLoading}
      className={cn(
        'flex h-12 w-full items-center justify-center gap-3 rounded-xl border-[1.5px] border-slate-200 bg-white text-ui font-semibold text-slate-700 shadow-sm transition-all duration-200',
        'hover:border-slate-300 hover:bg-slate-50 hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2',
        isGoogleLoading && 'pointer-events-none opacity-70',
        className,
      )}
    >
      {isGoogleLoading ? (
        <>
          <span
            aria-hidden="true"
            className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
          Connecting...
        </>
      ) : (
        <>
          <GoogleIcon />
          {mode === 'signup' ? 'Continue with Google' : 'Sign in with Google'}
        </>
      )}
    </button>
  )
}
