// src/app/(main)/layout.tsx
import { BottomTabBar } from '@/components/layout/BottomTabBar'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'

/**
 * Site chrome for every public page. The (auth) group and /onboarding sit
 * outside this group, so they render on a clean page with no navbar or footer.
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-[72px]">{children}</main>
      <Footer />
      <BottomTabBar />
    </>
  )
}
