// src/app/not-found.tsx
import type { Metadata } from 'next'

import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { NotFoundContent } from '@/components/shared/NotFoundContent'

/*
  The 404 for a URL that matches no route at all.

  An unmatched path renders inside the root layout only — no route group's
  layout applies — so this one brings the navbar and footer itself. Without
  them it was the framework's bare "404 | This page could not be found", with
  no way back into the site but the browser's back button.
*/
export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
}

export default function RootNotFound() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-[var(--nav-h)]">
        <NotFoundContent />
      </main>
      <Footer />
    </>
  )
}
