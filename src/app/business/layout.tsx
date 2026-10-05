// src/app/business/layout.tsx
import type { Metadata } from 'next'

/**
 * The business portal's shared metadata.
 *
 * Every page under /business is either a signed-in owner's own dashboard or
 * the sign-up form, and none of it is something a search engine should list:
 * the dashboards are private and redirect a crawler to sign-in, and indexing
 * that redirect only teaches search results to show a login page. The public
 * pitch for businesses lives at /partners, which stays indexable.
 *
 * Rendering is left to each page — they draw their own chrome — so this only
 * sets the title pattern and the robots rule.
 */
export const metadata: Metadata = {
  title: {
    // The root layout's '%s | Plug.pk' is applied to this default, so it
    // carries no suffix of its own.
    default: 'Business portal',
    template: '%s · Business portal | Plug.pk',
  },
  robots: { index: false, follow: false },
}

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return children
}
