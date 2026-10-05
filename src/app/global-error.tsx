// src/app/global-error.tsx
'use client'

import * as React from 'react'

/**
 * The last boundary: what renders when the root layout itself throws.
 *
 * It replaces the whole document, so it brings its own <html> and <body> and
 * cannot rely on globals.css or the font loader having run — the styles are
 * inline for that reason. It is deliberately plain: a heading, a reference to
 * quote, a retry and a way home.
 *
 * As in (main)/error.tsx, the error's message is not printed; the digest is,
 * because it ties a screenshot to a line in the server log.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error('Root layout failed:', error)
  }, [error])

  const button: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    padding: '0 20px',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    textDecoration: 'none',
    cursor: 'pointer',
  }

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F1F4F3',
          color: '#0B332C',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
          padding: 16,
        }}
      >
        <main style={{ maxWidth: 440, textAlign: 'center' }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#0F7A6A',
            }}
          >
            Plug.pk
          </p>
          <h1 style={{ fontSize: 30, lineHeight: 1.15, margin: '12px 0 0' }}>Something went wrong</h1>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: '#626D6B', marginTop: 12 }}>
            This one is on us, not on you. Trying again usually clears it.
          </p>
          {error.digest ? (
            <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: '#626D6B' }}>
              Reference: {error.digest}
            </p>
          ) : null}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={reset}
              style={{ ...button, border: 'none', background: '#0B332C', color: '#FFFFFF' }}
            >
              Try again
            </button>
            {/* A plain <a>, not next/link: the router may be what failed. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" style={{ ...button, border: '1.5px solid #BAC2C0', background: '#FFFFFF', color: '#0B332C' }}>
              Back to the home page
            </a>
          </div>
        </main>
      </body>
    </html>
  )
}
