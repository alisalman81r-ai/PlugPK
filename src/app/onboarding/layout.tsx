// src/app/onboarding/layout.tsx
import type { Metadata } from 'next'

/* A signed-in-only step straight after sign-up: nothing here to index. */
export const metadata: Metadata = {
  title: 'Add your car',
  robots: { index: false, follow: false },
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children
}
