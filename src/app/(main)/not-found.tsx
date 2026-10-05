// src/app/(main)/not-found.tsx
import type { Metadata } from 'next'

import { NotFoundContent } from '@/components/shared/NotFoundContent'

/*
  What notFound() renders anywhere under (main) — an unknown car, station,
  service or post. The group layout supplies the navbar and footer, so this is
  the body only.
*/
export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
}

export default function MainNotFound() {
  return <NotFoundContent />
}
