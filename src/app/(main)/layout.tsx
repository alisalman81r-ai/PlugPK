// src/app/(main)/layout.tsx
import { BottomTabBar } from '@/components/layout/BottomTabBar'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { CardSpotlight } from '@/components/ui/CardSpotlight'

/**
 * Site chrome for every public page. The (auth) group and /onboarding sit
 * outside this group, so they render on a clean page with no navbar or footer.
 *
 * ── Why the session is not read here any more ─────────────────────────
 *
 * It used to `await getCurrentProfile()` and hand the result to Navbar, so the
 * header was correct on the very first frame. Reading cookies in a layout opts
 * the whole subtree out of static rendering, and Next 14 has no partial escape
 * from that — wrapping the call in Suspense does not help, because any cookies()
 * in the tree marks the route dynamic.
 *
 * Measured on a production build, the cost was every page under this group
 * coming back `ƒ (server-rendered on demand)`, the homepage included — which
 * asks for `revalidate = 300` and could never be given it. Each navigation
 * waited on a server render that nothing was permitted to cache.
 *
 * Navbar now asks /api/me for itself once it has mounted. The header is briefly
 * signed-out before that answers, which is a real regression for one frame and
 * was accepted on purpose: it buys back static rendering for every public page
 * on the site. If it ever needs reverting, this file and Navbar's effect are
 * the whole of it.
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* One delegated pointer listener for every card on the page. Renders
          nothing; see CardSpotlight for why it is not per-card. */}
      <CardSpotlight />
      <Navbar />
      {/*
        The page, lifted above the footer (z-2, rounded bottom) so the footer
        is revealed from under it. The floating navbar sits over an ink strip
        at the top, which runs straight into each page's ink hero. The
        scroll-progress line now lives inside the navbar.
      */}
      <main className="relative z-[2] min-h-screen rounded-b-[32px] bg-chalk pt-[var(--nav-h)] sm:rounded-b-[48px]">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-[var(--nav-h)] bg-ink" />
        {children}
      </main>
      <Footer />
      <BottomTabBar />
    </>
  )
}
