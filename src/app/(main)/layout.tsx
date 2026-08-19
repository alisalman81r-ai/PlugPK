// src/app/(main)/layout.tsx
import { BottomTabBar } from '@/components/layout/BottomTabBar'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { getCurrentProfile } from '@/lib/db/session-actions'

/**
 * Site chrome for every public page. The (auth) group and /onboarding sit
 * outside this group, so they render on a clean page with no navbar or footer.
 *
 * Reading the session here makes the header correct on first paint — no flash
 * of "Sign In" for somebody who is already signed in. The cost is that these
 * pages render per request rather than being served from the static cache,
 * since a layout that reads cookies cannot be prerendered. That is the right
 * trade for a header whose whole job is to say who you are, and it is confined
 * to this one line if it ever needs revisiting.
 */
export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile()
  const user = profile
    ? { name: profile.name, email: profile.email, avatar: profile.avatar }
    : null

  return (
    <>
      <Navbar user={user} />
      <main className="min-h-screen pt-[72px]">{children}</main>
      <Footer />
      <BottomTabBar />
    </>
  )
}
